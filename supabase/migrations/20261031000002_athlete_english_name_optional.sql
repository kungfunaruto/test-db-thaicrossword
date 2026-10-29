-- Athletes: the English name is optional (run after 20261029000001). Safe to run more than once.
-- Without an English name the site shows the Thai name in English mode as well.
create or replace function public.admin_save_athlete(
  p_id uuid, p_full_name text, p_full_name_en text, p_photo_url text, p_games text[],
  p_publication_status text, p_ratings jsonb, p_effective_date date
) returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare v_id uuid; r jsonb; v_game text; v_val numeric; v_cur numeric;
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if btrim(coalesce(p_full_name, '')) = '' then raise exception 'full_name is required'; end if;
  if p_publication_status not in ('published', 'archived') then raise exception 'invalid publication status'; end if;
  if exists (select 1 from unnest(coalesce(p_games, '{}')) g where g not in (select code from public.game_types where has_rating and is_active)) then
    raise exception 'invalid game type: only rated games are allowed'; end if;
  if p_id is null then
    insert into public.athletes (full_name, full_name_en, photo_url, games, publication_status, is_active, created_by)
    values (btrim(p_full_name), nullif(btrim(coalesce(p_full_name_en, '')), ''), nullif(btrim(coalesce(p_photo_url, '')), ''), coalesce(p_games, '{}'), p_publication_status, true, auth.uid())
    returning id into v_id;
  else
    update public.athletes set full_name = btrim(p_full_name), full_name_en = nullif(btrim(coalesce(p_full_name_en, '')), ''),
      photo_url = nullif(btrim(coalesce(p_photo_url, '')), ''), games = coalesce(p_games, '{}'), publication_status = p_publication_status, is_active = true
    where id = p_id returning id into v_id;
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
revoke all on function public.admin_save_athlete(uuid, text, text, text, text[], text, jsonb, date) from public, anon;
grant execute on function public.admin_save_athlete(uuid, text, text, text, text[], text, jsonb, date) to authenticated;
