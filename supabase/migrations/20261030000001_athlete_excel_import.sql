-- Import / edit athletes and ratings from an Excel file (admin only). Safe to run more than once.
-- One call imports the whole file in a single transaction: if any row is invalid nothing is saved.
-- Each row (jsonb): { "row": <sheet row number>, "id": <uuid or null>, "full_name": text, "full_name_en": text,
--                     "status": "published" | "archived" | null, "ratings": { "crossword": number|null, "a_math": number|null } }
-- Rules: id present = update that athlete; id missing = new athlete (Thai and English names required).
-- Empty cells (null) mean "no change". A rating is added to the history only when it differs from the current rating,
-- so re-importing an unchanged file changes nothing. Ratings are never deleted (history stays complete).
create or replace function public.admin_import_athletes(p_rows jsonb, p_effective_date date)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  r jsonb; g text; v_row text; v_id uuid; v_th text; v_en text; v_status text; v_val numeric; v_cur numeric;
  o_th text; o_en text; o_status text; v_touched boolean;
  n_rows int := 0; n_created int := 0; n_updated int := 0; n_unchanged int := 0; n_ratings int := 0;
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_effective_date is null then raise exception 'IMPORT: effective date is required'; end if;
  if jsonb_typeof(p_rows) is distinct from 'array' then raise exception 'IMPORT: rows must be an array'; end if;
  if jsonb_array_length(p_rows) > 5000 then raise exception 'IMPORT: at most 5000 rows per file'; end if;

  for r in select * from jsonb_array_elements(p_rows) loop
    n_rows := n_rows + 1;
    v_row := coalesce(r ->> 'row', n_rows::text);
    v_th := nullif(btrim(coalesce(r ->> 'full_name', '')), '');
    v_en := nullif(btrim(coalesce(r ->> 'full_name_en', '')), '');
    v_status := nullif(btrim(coalesce(r ->> 'status', '')), '');
    v_touched := false;
    if v_status is not null and v_status not in ('published', 'archived') then raise exception 'ROW %: invalid status', v_row; end if;
    if nullif(r ->> 'id', '') is not null and (r ->> 'id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      raise exception 'ROW %: invalid athlete id', v_row; end if;
    v_id := nullif(r ->> 'id', '')::uuid;

    if v_id is not null then
      select full_name, full_name_en, publication_status into o_th, o_en, o_status from public.athletes where id = v_id;
      if not found then raise exception 'ROW %: athlete id not found', v_row; end if;
      if (v_th is not null and v_th is distinct from o_th) or (v_en is not null and v_en is distinct from o_en) or (v_status is not null and v_status is distinct from o_status) then
        update public.athletes set full_name = coalesce(v_th, full_name), full_name_en = coalesce(v_en, full_name_en),
          publication_status = coalesce(v_status, publication_status), is_active = true where id = v_id;
        v_touched := true;
      end if;
    else
      if v_th is null or v_en is null then raise exception 'ROW %: a new athlete needs both Thai and English names', v_row; end if;
      insert into public.athletes (full_name, full_name_en, games, publication_status, is_active, created_by)
      values (v_th, v_en, '{}', coalesce(v_status, 'published'), true, auth.uid()) returning id into v_id;
      n_created := n_created + 1;
    end if;

    if r ? 'ratings' and jsonb_typeof(r -> 'ratings') = 'object' then
      for g in select key from jsonb_each(r -> 'ratings') loop
        continue when jsonb_typeof(r -> 'ratings' -> g) = 'null';
        if not exists (select 1 from public.game_types where code = g and has_rating and is_active) then raise exception 'ROW %: game % has no ratings', v_row, g; end if;
        if jsonb_typeof(r -> 'ratings' -> g) <> 'number' then raise exception 'ROW %: rating must be a number', v_row; end if;
        v_val := (r -> 'ratings' ->> g)::numeric;
        if v_val < 0 then raise exception 'ROW %: rating must not be negative', v_row; end if;
        update public.athletes set games = array_append(games, g) where id = v_id and not (g = any(games));
        if found then v_touched := true; end if;
        select rating_value into v_cur from public.current_ratings where athlete_id = v_id and game_type = g;
        if v_cur is null or v_cur <> v_val then
          insert into public.athlete_rating_history (athlete_id, game_type, rating_value, effective_date, source_type, publication_status, created_by)
          values (v_id, g, v_val, p_effective_date, 'csv_import', 'published', auth.uid());
          n_ratings := n_ratings + 1; v_touched := true;
        end if;
      end loop;
    end if;

    if r ->> 'id' is not null and nullif(r ->> 'id', '') is not null then
      if v_touched then n_updated := n_updated + 1; else n_unchanged := n_unchanged + 1; end if;
    end if;
  end loop;
  return jsonb_build_object('rows', n_rows, 'created', n_created, 'updated', n_updated, 'unchanged', n_unchanged, 'ratings_added', n_ratings);
end $$;
revoke all on function public.admin_import_athletes(jsonb, date) from public, anon;
grant execute on function public.admin_import_athletes(jsonb, date) to authenticated;
