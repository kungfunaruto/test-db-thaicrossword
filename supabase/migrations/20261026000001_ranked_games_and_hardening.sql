-- 1) Spelling: A-Math
update public.game_types set label_th = 'เอแม็ท' where code = 'a_math';

-- 2) Only some games have ratings (Crossword, A-Math). Sudoku and Kumkom are not ranked. Config-driven: flip the flag to change.
alter table public.game_types add column if not exists has_rating boolean not null default false;
update public.game_types set has_rating = (code in ('crossword', 'a_math'));
update public.athletes a set games = array(select g from unnest(a.games) g where g in (select code from public.game_types where has_rating and is_active))
where exists (select 1 from unnest(a.games) g where g not in (select code from public.game_types where has_rating and is_active));

create or replace function public.athletes_validate_games() returns trigger language plpgsql as $$
begin
  if exists (select 1 from unnest(new.games) g where g not in (select code from public.game_types where has_rating and is_active)) then
    raise exception 'athletes.games may only contain game types with has_rating = true'; end if;
  return new;
end $$;
drop trigger if exists trg_athletes_games on public.athletes;
create trigger trg_athletes_games before insert or update of games on public.athletes for each row execute function public.athletes_validate_games();

create or replace function public.arh_validate_game() returns trigger language plpgsql as $$
begin
  if not exists (select 1 from public.game_types where code = new.game_type and has_rating and is_active) then
    raise exception 'game type % does not have ratings', new.game_type; end if;
  return new;
end $$;
drop trigger if exists trg_arh_game on public.athlete_rating_history;
create trigger trg_arh_game before insert on public.athlete_rating_history for each row execute function public.arh_validate_game();

-- 3) Ranking view: rated games only.
create or replace view public.national_rankings with (security_invoker = true) as
select c.athlete_id, a.full_name, a.school_name, a.province, c.game_type, c.rating_value, c.effective_date, c.rating_period,
       rank() over (partition by c.game_type order by c.rating_value desc) as rank
from public.current_ratings c
join public.game_types gt on gt.code = c.game_type and gt.has_rating and gt.is_active
join public.athletes a on a.id = c.athlete_id and a.publication_status = 'published' and a.is_active and c.game_type = any(a.games);
grant select on public.national_rankings to anon, authenticated;

-- 4) Atomic save RPC (admin only), now limited to rated games.
create or replace function public.admin_save_athlete(
  p_id uuid, p_full_name text, p_school_name text, p_province text, p_games text[],
  p_publication_status text, p_is_active boolean, p_ratings jsonb, p_effective_date date
) returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare v_id uuid; r jsonb; v_game text; v_val numeric; v_cur numeric;
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if btrim(coalesce(p_full_name, '')) = '' then raise exception 'full_name is required'; end if;
  if exists (select 1 from unnest(coalesce(p_games, '{}')) g where g not in (select code from public.game_types where has_rating and is_active)) then
    raise exception 'invalid game type: only rated games are allowed'; end if;
  if p_id is null then
    insert into public.athletes (full_name, school_name, province, games, publication_status, is_active, created_by)
    values (btrim(p_full_name), nullif(btrim(p_school_name), ''), nullif(btrim(p_province), ''), coalesce(p_games, '{}'), p_publication_status, p_is_active, auth.uid())
    returning id into v_id;
  else
    update public.athletes set full_name = btrim(p_full_name), school_name = nullif(btrim(p_school_name), ''), province = nullif(btrim(p_province), ''),
      games = coalesce(p_games, '{}'), publication_status = p_publication_status, is_active = p_is_active where id = p_id returning id into v_id;
    if v_id is null then raise exception 'athlete not found'; end if;
  end if;
  for r in select * from jsonb_array_elements(coalesce(p_ratings, '[]'::jsonb)) loop
    v_game := r ->> 'game';
    continue when v_game is null or not (v_game = any(coalesce(p_games, '{}'))) or coalesce(r ->> 'value', '') = '';
    v_val := (r ->> 'value')::numeric;
    if v_val < 0 then raise exception 'rating must not be negative'; end if;
    select rating_value into v_cur from public.current_ratings where athlete_id = v_id and game_type = v_game;
    if v_cur is null or v_cur <> v_val then
      insert into public.athlete_rating_history (athlete_id, game_type, rating_value, effective_date, source_type, publication_status, created_by)
      values (v_id, v_game, v_val, coalesce(p_effective_date, current_date), 'manual', 'published', auth.uid());
    end if;
  end loop;
  return v_id;
end $$;
revoke all on function public.admin_save_athlete(uuid, text, text, text, text[], text, boolean, jsonb, date) from public, anon;
grant execute on function public.admin_save_athlete(uuid, text, text, text, text[], text, boolean, jsonb, date) to authenticated;

-- 5) Hardening
-- 5a) Unused internal-notes column was readable by any logged-in user: remove it.
alter table public.athletes drop column if exists admin_notes;
-- 5b) Inactive athletes' ratings must not be public.
drop policy if exists arh_public_read on public.athlete_rating_history;
create policy arh_public_read on public.athlete_rating_history for select
  using (publication_status = 'published' and exists (select 1 from public.athletes a where a.id = athlete_id and a.publication_status = 'published' and a.is_active));
-- 5c) Public API gets an allow-list of columns: no created_by (admin ids), notes, or source details.
revoke select on public.news from anon;
grant select (id, image_url, category, title, slug, excerpt, content, external_url, status, published_at, created_at, updated_at) on public.news to anon;
revoke select on public.events from anon;
grant select (id, image_url, title, slug, category, game_type, start_date, end_date, venue, description, result_url, teacher_certificate_url,
  student_certificate_url, competition_status, publication_status, published_at, created_at, updated_at) on public.events to anon;
revoke select on public.athlete_rating_history from anon;
-- category_id is required by the current_ratings / national_rankings views when read as anon.
grant select (id, athlete_id, game_type, category_id, rating_value, rating_period, effective_date, event_id, publication_status, created_at, updated_at) on public.athlete_rating_history to anon;
revoke select on public.hall_of_fame from anon; -- feature removed from the site; table kept for existing data
-- 5d) Index for the "current rating" lookup, and FK without index.
create index if not exists arh_current_idx on public.athlete_rating_history (athlete_id, game_type, effective_date desc, created_at desc)
  where publication_status = 'published' and category_id is null;
create index if not exists arh_category_idx on public.athlete_rating_history (category_id);
