-- Competitions: organiser (company / organisation running the competition), Thai + English. Safe to run more than once.
alter table public.events add column if not exists organizer text;
alter table public.events add column if not exists organizer_en text;
alter table public.events drop constraint if exists events_organizer_len_check;
alter table public.events add constraint events_organizer_len_check check ((organizer is null or length(organizer) <= 300) and (organizer_en is null or length(organizer_en) <= 300));
grant select (organizer, organizer_en) on public.events to anon;

-- Edit history: same rule as before, but every *_en column (including organizer_en) is treated as a translation, not an edit.
create or replace function public.record_content_revision() returns trigger language plpgsql security definer set search_path = public as $$
declare
  ign text[] := array['status', 'publication_status', 'published_at', 'is_pinned', 'pinned_at', 'updated_at', 'created_at', 'created_by',
    'edit_note', 'edit_note_en', 'slug', 'image_url', 'reg_close', 'last_date', 'competition_status', 'game_type',
    'title_en', 'excerpt_en', 'content_en', 'venue_en', 'description_en'];
  o jsonb := to_jsonb(old);
  n jsonb := to_jsonb(new);
begin
  -- English translation columns (any name ending in _en) never count as an edit.
  select coalesce(jsonb_object_agg(key, value), '{}'::jsonb) into n from jsonb_each(n - ign) where right(key, 3) <> '_en';
  select coalesce(jsonb_object_agg(key, value), '{}'::jsonb) into o from jsonb_each(o - ign) where right(key, 3) <> '_en';
  if coalesce(to_jsonb(old) ->> 'status', to_jsonb(old) ->> 'publication_status') = 'published' and n is distinct from o then
    if coalesce(btrim(new.edit_note), '') = '' then
      raise exception 'EDIT_NOTE_REQUIRED' using errcode = 'P0001', hint = 'Changing published content needs an edit note.';
    end if;
    insert into public.content_revisions (entity, entity_id, note, note_en, edited_by)
    values (tg_table_name, new.id, btrim(new.edit_note), nullif(btrim(coalesce(new.edit_note_en, '')), ''), auth.uid());
  end if;
  new.edit_note := null;
  new.edit_note_en := null;
  return new;
end $$;
