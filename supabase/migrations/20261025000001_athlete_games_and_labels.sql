-- Athletes choose the games they play; ratings are saved together with the athlete (atomic RPC); label fix.
update public.game_types set label_th = 'คำคม' where code = 'kumkom';

alter table public.athletes add column if not exists games text[] not null default '{}';
create index if not exists athletes_games_idx on public.athletes using gin (games);
grant select (games) on public.athletes to anon;
-- Backfill: athletes that already have ratings are marked as playing those games.
update public.athletes a set games = coalesce((select array_agg(distinct h.game_type) from public.athlete_rating_history h where h.athlete_id = a.id), '{}')
where cardinality(a.games) = 0;

-- Current rating per athlete and game. PROVISIONAL RULE (needs association confirmation):
-- latest effective_date among published records, then latest created_at.
create or replace view public.current_ratings with (security_invoker = true) as
select distinct on (h.athlete_id, h.game_type) h.athlete_id, h.game_type, h.rating_value, h.effective_date, h.rating_period
from public.athlete_rating_history h
where h.publication_status = 'published' and h.category_id is null
order by h.athlete_id, h.game_type, h.effective_date desc, h.created_at desc;
grant select on public.current_ratings to anon, authenticated;

-- Public ranking: only published, active athletes, and only games the athlete plays. Equal ratings share a rank.
create or replace view public.national_rankings with (security_invoker = true) as
select c.athlete_id, a.full_name, a.school_name, a.province, c.game_type, c.rating_value, c.effective_date, c.rating_period,
       rank() over (partition by c.game_type order by c.rating_value desc) as rank
from public.current_ratings c
join public.athletes a on a.id = c.athlete_id and a.publication_status = 'published' and a.is_active and c.game_type = any(a.games);
grant select on public.national_rankings to anon, authenticated;

-- Atomic create/update of an athlete + their games + rating changes. Admin only (checked inside).
-- A rating row is appended only when the value differs from the current rating, so history is preserved.
create or replace function public.admin_save_athlete(
  p_id uuid, p_full_name text, p_school_name text, p_province text, p_games text[],
  p_publication_status text, p_is_active boolean, p_ratings jsonb, p_effective_date date
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; r jsonb; v_game text; v_val numeric; v_cur numeric;
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if btrim(coalesce(p_full_name, '')) = '' then raise exception 'full_name is required'; end if;
  if exists (select 1 from unnest(coalesce(p_games, '{}')) g where g not in (select code from public.game_types where is_active)) then
    raise exception 'invalid game type'; end if;
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
