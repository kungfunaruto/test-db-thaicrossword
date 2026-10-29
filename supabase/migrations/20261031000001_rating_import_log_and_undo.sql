-- Rating import v2 (run AFTER 20261030000001_athlete_excel_import.sql). Safe to run more than once.
-- The admin picks ONE game (Crossword or A-Math); the file only has names and ratings. The file itself is never stored:
-- the browser reads it, the admin confirms who changes and who is new, then admin_import_ratings() saves the ratings.
-- Nothing is ever deleted: every import is logged in rating_imports and can be undone (its ratings are archived,
-- so each athlete's previous rating becomes current again; athletes it created are archived).

-- Replaces the first version (id-based round-trip file) from 20261030000001; its function is no longer used by the site.
drop function if exists public.admin_import_athletes(jsonb, date);

create table if not exists public.rating_imports (
  id uuid primary key default gen_random_uuid(),
  game_type text not null references public.game_types(code),
  file_name text check (file_name is null or length(file_name) <= 255),
  effective_date date not null,
  rows_total int not null default 0,
  ratings_changed int not null default 0,
  athletes_created int not null default 0,
  status text not null default 'applied' check (status in ('applied', 'reverted')),
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid() references public.admin_profiles(user_id) on delete set null,
  reverted_at timestamptz,
  reverted_by uuid references public.admin_profiles(user_id) on delete set null
);
create index if not exists rating_imports_created_idx on public.rating_imports (created_at desc);
alter table public.rating_imports enable row level security;
drop policy if exists rating_imports_admin on public.rating_imports;
create policy rating_imports_admin on public.rating_imports for all to authenticated using (public.is_admin()) with check (public.is_admin());
revoke all on public.rating_imports from anon;

-- Which import produced a rating / created an athlete (not exposed to the public API).
alter table public.athlete_rating_history add column if not exists import_id uuid references public.rating_imports(id) on delete restrict;
create index if not exists arh_import_idx on public.athlete_rating_history (import_id) where import_id is not null;
alter table public.athletes add column if not exists created_import_id uuid references public.rating_imports(id) on delete set null;

-- p_rows: [{ "row": <sheet row>, "athlete_id": uuid | null (null = new athlete), "name": text, "name_en": text | null, "rating": number }]
-- A rating is recorded only when it differs from the athlete's current rating for that game.
create or replace function public.admin_import_ratings(p_game text, p_effective_date date, p_file_name text, p_rows jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  r jsonb; v_row text; v_id uuid; v_name text; v_en text; v_val numeric; v_cur numeric; v_imp uuid; v_existing boolean;
  n_rows int := 0; n_changed int := 0; n_created int := 0; n_same int := 0;
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if not exists (select 1 from public.game_types where code = p_game and has_rating and is_active) then raise exception 'IMPORT: game % has no ratings', p_game; end if;
  if p_effective_date is null then raise exception 'IMPORT: effective date is required'; end if;
  if jsonb_typeof(p_rows) is distinct from 'array' or jsonb_array_length(p_rows) = 0 then raise exception 'IMPORT: nothing to import'; end if;
  if jsonb_array_length(p_rows) > 5000 then raise exception 'IMPORT: at most 5000 rows per file'; end if;
  if (select count(*) from jsonb_array_elements(p_rows) e where nullif(e ->> 'athlete_id', '') is not null)
     <> (select count(distinct e ->> 'athlete_id') from jsonb_array_elements(p_rows) e where nullif(e ->> 'athlete_id', '') is not null) then
    raise exception 'IMPORT: the same athlete appears more than once'; end if;

  insert into public.rating_imports (game_type, file_name, effective_date, created_by) values (p_game, left(p_file_name, 255), p_effective_date, auth.uid()) returning id into v_imp;

  for r in select * from jsonb_array_elements(p_rows) loop
    n_rows := n_rows + 1;
    v_row := coalesce(r ->> 'row', n_rows::text);
    if jsonb_typeof(r -> 'rating') is distinct from 'number' then raise exception 'ROW %: rating must be a number', v_row; end if;
    v_val := (r ->> 'rating')::numeric;
    if v_val < 0 then raise exception 'ROW %: rating must not be negative', v_row; end if;
    v_existing := nullif(r ->> 'athlete_id', '') is not null;
    if v_existing then
      if (r ->> 'athlete_id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then raise exception 'ROW %: invalid athlete id', v_row; end if;
      v_id := (r ->> 'athlete_id')::uuid;
      if not exists (select 1 from public.athletes where id = v_id) then raise exception 'ROW %: athlete not found', v_row; end if;
      update public.athletes set games = array_append(games, p_game) where id = v_id and not (p_game = any(games));
    else
      v_name := nullif(btrim(coalesce(r ->> 'name', '')), '');
      v_en := nullif(btrim(coalesce(r ->> 'name_en', '')), '');
      if v_name is null then raise exception 'ROW %: name is required', v_row; end if;
      insert into public.athletes (full_name, full_name_en, games, publication_status, is_active, created_by, created_import_id)
      values (v_name, v_en, array[p_game], 'published', true, auth.uid(), v_imp) returning id into v_id;
      n_created := n_created + 1;
    end if;
    select rating_value into v_cur from public.current_ratings where athlete_id = v_id and game_type = p_game;
    if v_cur is null or v_cur <> v_val then
      insert into public.athlete_rating_history (athlete_id, game_type, rating_value, effective_date, source_type, source_reference, publication_status, import_id, created_by)
      values (v_id, p_game, v_val, p_effective_date, 'csv_import', left(p_file_name, 255), 'published', v_imp, auth.uid());
      if v_existing then n_changed := n_changed + 1; end if; -- new rating (or first rating in this game) for an existing athlete
    else
      n_same := n_same + 1;
    end if;
  end loop;

  update public.rating_imports set rows_total = n_rows, ratings_changed = n_changed, athletes_created = n_created where id = v_imp;
  return jsonb_build_object('import_id', v_imp, 'rows', n_rows, 'changed', n_changed, 'created', n_created, 'unchanged', n_same);
end $$;
revoke all on function public.admin_import_ratings(text, date, text, jsonb) from public, anon;
grant execute on function public.admin_import_ratings(text, date, text, jsonb) to authenticated;

-- Undo one import: its ratings are archived (history kept), so the previous rating is current again.
-- Athletes it created are archived unless they have published ratings from somewhere else.
create or replace function public.admin_revert_rating_import(p_id uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare n_ratings int; n_athletes int;
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if not exists (select 1 from public.rating_imports where id = p_id and status = 'applied') then raise exception 'IMPORT: not found or already undone'; end if;
  update public.athlete_rating_history set publication_status = 'archived' where import_id = p_id and publication_status <> 'archived';
  get diagnostics n_ratings = row_count;
  update public.athletes a set publication_status = 'archived' where a.created_import_id = p_id and a.publication_status <> 'archived'
    and not exists (select 1 from public.athlete_rating_history h where h.athlete_id = a.id and h.publication_status = 'published');
  get diagnostics n_athletes = row_count;
  update public.rating_imports set status = 'reverted', reverted_at = now(), reverted_by = auth.uid() where id = p_id;
  return jsonb_build_object('ratings_archived', n_ratings, 'athletes_archived', n_athletes);
end $$;
revoke all on function public.admin_revert_rating_import(uuid) from public, anon;
grant execute on function public.admin_revert_rating_import(uuid) to authenticated;
