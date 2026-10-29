-- v2: English fields, multi-image galleries, simpler statuses, competition registration deadline + date-based status,
-- public edit history, athlete photos + private admin comments, questions sent by visitors, visitor analytics.
-- Safe to run more than once.

-- =====================================================================================================
-- 1) NEWS
-- =====================================================================================================
alter table public.news add column if not exists images text[] not null default '{}';
alter table public.news add column if not exists title_en text;
alter table public.news add column if not exists excerpt_en text;
alter table public.news add column if not exists content_en text;
-- edit_note / edit_note_en are transient: the admin sends them with an update, the revision trigger stores them
-- in content_revisions and clears them, so they are always null in the table.
alter table public.news add column if not exists edit_note text;
alter table public.news add column if not exists edit_note_en text;
update public.news set images = array[image_url] where image_url is not null and cardinality(images) = 0;

-- Two categories only (stored as codes so both languages can label them).
alter table public.news drop constraint if exists news_category_check;
update public.news set category = case when category in ('ประกาศการแข่งขัน', 'ผลการแข่งขัน') then 'competition' else 'general' end
where category not in ('general', 'competition');
alter table public.news add constraint news_category_check check (category in ('general', 'competition'));
alter table public.news alter column category set default 'general';

-- Status: draft | published ("archived" removed; old archived rows become drafts, i.e. hidden).
update public.news set status = 'draft' where status not in ('draft', 'published');
alter table public.news drop constraint if exists news_status_check;
alter table public.news add constraint news_status_check check (status in ('draft', 'published'));
alter table public.news drop constraint if exists news_images_count_check;
alter table public.news add constraint news_images_count_check check (cardinality(images) <= 20);

-- =====================================================================================================
-- 2) EVENTS = competitions only
-- =====================================================================================================
alter table public.events add column if not exists images text[] not null default '{}';
alter table public.events add column if not exists games text[] not null default '{}';
alter table public.events add column if not exists registration_deadline date;
alter table public.events add column if not exists title_en text;
alter table public.events add column if not exists venue_en text;
alter table public.events add column if not exists description_en text;
alter table public.events add column if not exists edit_note text;
alter table public.events add column if not exists edit_note_en text;
update public.events set images = array[image_url] where image_url is not null and cardinality(images) = 0;
update public.events set games = case game_type
    when 'multiple' then array['crossword', 'a_math', 'kumkom', 'sudoku']
    when 'other' then '{}'::text[]
    else array[game_type] end
where cardinality(games) = 0 and game_type is not null;
alter table public.events drop constraint if exists events_games_check;
alter table public.events add constraint events_games_check check (games <@ array['crossword', 'a_math', 'kumkom', 'sudoku']::text[]);
alter table public.events drop constraint if exists events_images_count_check;
alter table public.events add constraint events_images_count_check check (cardinality(images) <= 20);

-- No more "activity type" / single game / stored competition status: kept only for old rows.
alter table public.events alter column category set default 'tournament';
alter table public.events alter column game_type drop not null;
alter table public.events alter column competition_status drop not null;

-- Competition status is calculated from dates (Asia/Bangkok "today", computed by the caller):
--   registration open    : today <= reg_close
--   registration closed  : reg_close < today <= last_date
--   competition finished : last_date < today
-- Old rows without a deadline close registration the day before the start date.
alter table public.events add column if not exists reg_close date generated always as (coalesce(registration_deadline, start_date - 1)) stored;
alter table public.events add column if not exists last_date date generated always as (coalesce(end_date, start_date)) stored;
alter table public.events drop constraint if exists events_registration_deadline_check;
alter table public.events add constraint events_registration_deadline_check
  check (registration_deadline is null or registration_deadline <= coalesce(end_date, start_date));
create index if not exists events_reg_close_idx on public.events (reg_close);
create index if not exists events_last_date_idx on public.events (last_date);

update public.events set publication_status = 'draft' where publication_status not in ('draft', 'published');
alter table public.events drop constraint if exists events_publication_status_check;
alter table public.events add constraint events_publication_status_check check (publication_status in ('draft', 'published'));

-- Home page: pinned first, then most recently ADDED (created_at).
drop index if exists public.events_home_idx;
create index if not exists events_home_created_idx on public.events (is_pinned desc, pinned_at desc nulls last, created_at desc) where publication_status = 'published';

-- First image is the cover (image_url kept in sync for older code / social previews).
create or replace function public.sync_cover_image() returns trigger language plpgsql as $$
begin
  new.images := coalesce(array_remove(new.images, null), '{}');
  new.image_url := new.images[1];
  return new;
end $$;
drop trigger if exists trg_news_cover on public.news;
create trigger trg_news_cover before insert or update on public.news for each row execute function public.sync_cover_image();
drop trigger if exists trg_events_cover on public.events;
create trigger trg_events_cover before insert or update on public.events for each row execute function public.sync_cover_image();

-- =====================================================================================================
-- 3) EDIT HISTORY (public): every change to a PUBLISHED news item or competition needs a note.
-- =====================================================================================================
create table if not exists public.content_revisions (
  id uuid primary key default gen_random_uuid(),
  entity text not null check (entity in ('news', 'events')),
  entity_id uuid not null,
  note text not null check (length(btrim(note)) between 1 and 1000),
  note_en text check (note_en is null or length(note_en) <= 2000),
  edited_at timestamptz not null default now(),
  edited_by uuid references public.admin_profiles(user_id) on delete set null
);
create index if not exists content_revisions_entity_idx on public.content_revisions (entity, entity_id, edited_at desc);

-- Fields that do NOT count as an edit: status/publishing/pinning, bookkeeping, generated columns and the
-- English translation fields (fixing a translation is not a content change).
create or replace function public.record_content_revision() returns trigger language plpgsql security definer set search_path = public as $$
declare
  ign text[] := array['status', 'publication_status', 'published_at', 'is_pinned', 'pinned_at', 'updated_at', 'created_at', 'created_by',
    'edit_note', 'edit_note_en', 'slug', 'image_url', 'reg_close', 'last_date', 'competition_status', 'game_type',
    'title_en', 'excerpt_en', 'content_en', 'venue_en', 'description_en'];
  o jsonb := to_jsonb(old);
  n jsonb := to_jsonb(new);
begin
  if coalesce(o ->> 'status', o ->> 'publication_status') = 'published' and (n - ign) is distinct from (o - ign) then
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
drop trigger if exists trg_news_revision on public.news;
create trigger trg_news_revision before update on public.news for each row execute function public.record_content_revision();
drop trigger if exists trg_events_revision on public.events;
create trigger trg_events_revision before update on public.events for each row execute function public.record_content_revision();
-- Inserts never carry a note.
create or replace function public.clear_edit_note() returns trigger language plpgsql as $$
begin new.edit_note := null; new.edit_note_en := null; return new; end $$;
drop trigger if exists trg_news_clear_note on public.news;
create trigger trg_news_clear_note before insert on public.news for each row execute function public.clear_edit_note();
drop trigger if exists trg_events_clear_note on public.events;
create trigger trg_events_clear_note before insert on public.events for each row execute function public.clear_edit_note();

create or replace function public.delete_content_revisions() returns trigger language plpgsql security definer set search_path = public as $$
begin delete from public.content_revisions where entity = tg_table_name and entity_id = old.id; return old; end $$;
drop trigger if exists trg_news_revision_cleanup on public.news;
create trigger trg_news_revision_cleanup after delete on public.news for each row execute function public.delete_content_revisions();
drop trigger if exists trg_events_revision_cleanup on public.events;
create trigger trg_events_revision_cleanup after delete on public.events for each row execute function public.delete_content_revisions();

alter table public.content_revisions enable row level security;
drop policy if exists content_revisions_public_read on public.content_revisions;
create policy content_revisions_public_read on public.content_revisions for select using (
  (entity = 'news' and exists (select 1 from public.news x where x.id = entity_id and x.status = 'published'))
  or (entity = 'events' and exists (select 1 from public.events x where x.id = entity_id and x.publication_status = 'published')));
drop policy if exists content_revisions_admin on public.content_revisions;
create policy content_revisions_admin on public.content_revisions for all to authenticated using (public.is_admin()) with check (public.is_admin());
revoke all on public.content_revisions from anon;
grant select (id, entity, entity_id, note, note_en, edited_at) on public.content_revisions to anon;

-- =====================================================================================================
-- 4) ATHLETES: photo, English name, status published | archived, private admin comments
-- =====================================================================================================
alter table public.athletes add column if not exists photo_url text;
alter table public.athletes add column if not exists full_name_en text;
alter table public.athletes drop constraint if exists athletes_photo_url_check;
alter table public.athletes add constraint athletes_photo_url_check check (photo_url is null or photo_url ~* '^https?://');
-- "Draft" and "inactive" both meant "not shown": they become "archived". is_active is no longer edited.
update public.athletes set publication_status = 'archived' where publication_status not in ('published', 'archived') or not is_active;
update public.athletes set is_active = true where not is_active;
alter table public.athletes drop constraint if exists athletes_publication_status_check;
alter table public.athletes add constraint athletes_publication_status_check check (publication_status in ('published', 'archived'));
alter table public.athletes alter column publication_status set default 'published';

-- Ranking view: photo + English name; school and province are no longer shown.
drop view if exists public.national_rankings;
create view public.national_rankings with (security_invoker = true) as
select c.athlete_id, a.full_name, a.full_name_en, a.photo_url, c.game_type, c.rating_value, c.effective_date, c.rating_period,
       rank() over (partition by c.game_type order by c.rating_value desc) as rank
from public.current_ratings c
join public.game_types gt on gt.code = c.game_type and gt.has_rating and gt.is_active
join public.athletes a on a.id = c.athlete_id and a.publication_status = 'published' and a.is_active and c.game_type = any(a.games);
grant select on public.national_rankings to anon, authenticated;

-- Atomic save (admin only). Thai and English names are both required. School/province are left untouched.
drop function if exists public.admin_save_athlete(uuid, text, text, text, text[], text, boolean, jsonb, date);
create or replace function public.admin_save_athlete(
  p_id uuid, p_full_name text, p_full_name_en text, p_photo_url text, p_games text[],
  p_publication_status text, p_ratings jsonb, p_effective_date date
) returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare v_id uuid; r jsonb; v_game text; v_val numeric; v_cur numeric;
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if btrim(coalesce(p_full_name, '')) = '' then raise exception 'full_name is required'; end if;
  if btrim(coalesce(p_full_name_en, '')) = '' then raise exception 'full_name_en is required'; end if;
  if p_publication_status not in ('published', 'archived') then raise exception 'invalid publication status'; end if;
  if exists (select 1 from unnest(coalesce(p_games, '{}')) g where g not in (select code from public.game_types where has_rating and is_active)) then
    raise exception 'invalid game type: only rated games are allowed'; end if;
  if p_id is null then
    insert into public.athletes (full_name, full_name_en, photo_url, games, publication_status, is_active, created_by)
    values (btrim(p_full_name), btrim(p_full_name_en), nullif(btrim(coalesce(p_photo_url, '')), ''), coalesce(p_games, '{}'), p_publication_status, true, auth.uid())
    returning id into v_id;
  else
    update public.athletes set full_name = btrim(p_full_name), full_name_en = btrim(p_full_name_en),
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

-- Private comments about an athlete: admins only, never public.
create table if not exists public.athlete_comments (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  body text not null check (length(btrim(body)) between 1 and 4000),
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid() references public.admin_profiles(user_id) on delete set null
);
create index if not exists athlete_comments_athlete_idx on public.athlete_comments (athlete_id, created_at desc);
alter table public.athlete_comments enable row level security;
drop policy if exists athlete_comments_admin on public.athlete_comments;
create policy athlete_comments_admin on public.athlete_comments for all to authenticated using (public.is_admin()) with check (public.is_admin());
revoke all on public.athlete_comments from anon;

grant select (photo_url, full_name_en) on public.athletes to anon;

-- =====================================================================================================
-- 5) Q&A: published | archived, newest first, English fields, questions sent by visitors
-- =====================================================================================================
alter table public.faqs add column if not exists question_en text;
alter table public.faqs add column if not exists answer_en text;
update public.faqs set status = 'archived' where status not in ('published', 'archived');
alter table public.faqs drop constraint if exists faqs_status_check;
alter table public.faqs add constraint faqs_status_check check (status in ('published', 'archived'));
alter table public.faqs alter column status set default 'published';
create index if not exists faqs_status_created_idx on public.faqs (status, created_at desc);
grant select (question_en, answer_en) on public.faqs to anon;

-- Visitors send a question only (no name, no e-mail). They can write but never read.
create table if not exists public.faq_submissions (
  id uuid primary key default gen_random_uuid(),
  question text not null check (length(btrim(question)) between 5 and 1000),
  status text not null default 'new' check (status in ('new', 'answered', 'archived')),
  faq_id uuid references public.faqs(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists faq_submissions_status_idx on public.faq_submissions (status, created_at desc);
drop trigger if exists trg_faq_submissions_updated on public.faq_submissions;
create trigger trg_faq_submissions_updated before update on public.faq_submissions for each row execute function public.set_updated_at();
-- Flood guard: at most 30 new questions per 10 minutes across the whole site.
create or replace function public.faq_submissions_guard() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.faq_submissions where created_at > now() - interval '10 minutes') >= 30 then
    raise exception 'TOO_MANY_SUBMISSIONS' using errcode = 'P0001';
  end if;
  new.question := btrim(new.question);
  return new;
end $$;
drop trigger if exists trg_faq_submissions_guard on public.faq_submissions;
create trigger trg_faq_submissions_guard before insert on public.faq_submissions for each row execute function public.faq_submissions_guard();
alter table public.faq_submissions enable row level security;
drop policy if exists faq_submissions_public_insert on public.faq_submissions;
create policy faq_submissions_public_insert on public.faq_submissions for insert to anon, authenticated with check (status = 'new' and faq_id is null);
drop policy if exists faq_submissions_admin on public.faq_submissions;
create policy faq_submissions_admin on public.faq_submissions for all to authenticated using (public.is_admin()) with check (public.is_admin());
revoke all on public.faq_submissions from anon;
grant insert (question) on public.faq_submissions to anon;

-- =====================================================================================================
-- 6) VISITOR ANALYTICS: anonymous page views (random browser id, no IP, no personal data). Write-only for visitors.
-- =====================================================================================================
create table if not exists public.page_views (
  id uuid primary key default gen_random_uuid(),
  visitor_id uuid not null,
  session_id uuid not null,
  path text not null check (length(path) between 1 and 300),
  entity text check (entity in ('news', 'events')),
  entity_id uuid,
  referrer_host text check (referrer_host is null or length(referrer_host) <= 200),
  device text check (device in ('mobile', 'tablet', 'desktop')),
  lang text check (lang in ('th', 'en')),
  created_at timestamptz not null default now()
);
create index if not exists page_views_created_idx on public.page_views (created_at);
create index if not exists page_views_visitor_idx on public.page_views (visitor_id, created_at);
create index if not exists page_views_entity_idx on public.page_views (entity, entity_id) where entity is not null;
alter table public.page_views enable row level security;
drop policy if exists page_views_public_insert on public.page_views;
create policy page_views_public_insert on public.page_views for insert to anon, authenticated with check (true);
drop policy if exists page_views_admin_read on public.page_views;
create policy page_views_admin_read on public.page_views for select to authenticated using (public.is_admin());
revoke all on public.page_views from anon;
grant insert (visitor_id, session_id, path, entity, entity_id, referrer_host, device, lang) on public.page_views to anon;

-- One call returns everything the admin dashboard shows. Days are counted in Thailand time.
create or replace function public.admin_analytics(p_days int default 30) returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  tz constant text := 'Asia/Bangkok';
  v_today date := (now() at time zone tz)::date;
  v_days int := least(greatest(coalesce(p_days, 30), 7), 365);
  t_today timestamptz := (v_today::timestamp at time zone tz);
  t_month timestamptz := (date_trunc('month', v_today)::timestamp at time zone tz);
  t_from timestamptz := ((v_today - (v_days - 1))::timestamp at time zone tz);
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return jsonb_build_object(
    'generated_at', now(),
    'days', v_days,
    'online_now', (select count(distinct visitor_id) from page_views where created_at > now() - interval '5 minutes'),
    'today', (select jsonb_build_object('visitors', count(distinct visitor_id), 'views', count(*), 'sessions', count(distinct session_id)) from page_views where created_at >= t_today),
    'month', (select jsonb_build_object('visitors', count(distinct visitor_id), 'views', count(*), 'sessions', count(distinct session_id)) from page_views where created_at >= t_month),
    'all_time', (select jsonb_build_object('visitors', count(distinct visitor_id), 'views', count(*), 'sessions', count(distinct session_id), 'since', min(created_at)) from page_views),
    'range', (select jsonb_build_object(
        'visitors', count(distinct visitor_id), 'views', count(*), 'sessions', count(distinct session_id),
        'new_visitors', (select count(*) from (select visitor_id from page_views group by visitor_id having min(created_at) >= t_from) nv))
      from page_views where created_at >= t_from),
    'daily', (select coalesce(jsonb_agg(jsonb_build_object('day', d.day::date, 'visitors', coalesce(x.visitors, 0), 'views', coalesce(x.views, 0)) order by d.day), '[]')
      from generate_series(v_today - (v_days - 1), v_today, interval '1 day') as d(day)
      left join (select (created_at at time zone tz)::date as day, count(distinct visitor_id) visitors, count(*) views
                 from page_views where created_at >= t_from group by 1) x on x.day = d.day::date),
    'top_pages', (select coalesce(jsonb_agg(row_to_json(p) order by p.views desc), '[]') from (
      select path, count(*) views, count(distinct visitor_id) visitors from page_views where created_at >= t_from
      group by path order by count(*) desc limit 10) p),
    'top_news', (select coalesce(jsonb_agg(row_to_json(p) order by p.views desc), '[]') from (
      select v.entity_id as id, n.title, count(*) views, count(distinct v.visitor_id) visitors
      from page_views v left join news n on n.id = v.entity_id
      where v.created_at >= t_from and v.entity = 'news' group by v.entity_id, n.title order by count(*) desc limit 5) p),
    'top_events', (select coalesce(jsonb_agg(row_to_json(p) order by p.views desc), '[]') from (
      select v.entity_id as id, e.title, count(*) views, count(distinct v.visitor_id) visitors
      from page_views v left join events e on e.id = v.entity_id
      where v.created_at >= t_from and v.entity = 'events' group by v.entity_id, e.title order by count(*) desc limit 5) p),
    'devices', (select coalesce(jsonb_agg(row_to_json(p) order by p.visitors desc), '[]') from (
      select coalesce(device, 'unknown') device, count(distinct visitor_id) visitors from page_views where created_at >= t_from group by 1) p),
    'languages', (select coalesce(jsonb_agg(row_to_json(p) order by p.views desc), '[]') from (
      select coalesce(lang, 'th') lang, count(*) views from page_views where created_at >= t_from group by 1) p),
    'referrers', (select coalesce(jsonb_agg(row_to_json(p) order by p.sessions desc), '[]') from (
      select coalesce(referrer_host, '') referrer, count(distinct session_id) sessions from page_views where created_at >= t_from
      group by 1 order by count(distinct session_id) desc limit 8) p),
    'hours', (select coalesce(jsonb_agg(jsonb_build_object('hour', h.hour, 'views', coalesce(x.views, 0)) order by h.hour), '[]')
      from generate_series(0, 23) as h(hour)
      left join (select extract(hour from created_at at time zone tz)::int as hour, count(*) views from page_views where created_at >= t_from group by 1) x on x.hour = h.hour)
  );
end $$;
revoke all on function public.admin_analytics(int) from public, anon;
grant execute on function public.admin_analytics(int) to authenticated;

-- =====================================================================================================
-- 7) Public column allow-lists for the new columns (never edit_note, created_by)
-- =====================================================================================================
grant select (images, title_en, excerpt_en, content_en) on public.news to anon;
grant select (images, games, registration_deadline, reg_close, last_date, title_en, venue_en, description_en) on public.events to anon;
