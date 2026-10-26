-- Initial schema: content tables, athletes, rating history, RLS, storage.
-- No rating formula or tie-break policy is implemented (none has been supplied).

-- ---------- helpers ----------
create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ---------- admin_profiles (never stores passwords) ----------
create table public.admin_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'admin' check (role in ('admin')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_admin_profiles_updated before update on public.admin_profiles for each row execute function public.set_updated_at();

-- SECURITY DEFINER avoids RLS recursion; reads only trusted table, never user_metadata.
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_profiles where user_id = auth.uid() and is_active)
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------- lookup tables ----------
create table public.game_types (
  code text primary key check (code ~ '^[a-z0-9_]+$'),
  label_th text not null,
  is_active boolean not null default true,
  sort_order int not null default 0
);
insert into public.game_types (code, label_th, sort_order) values
  ('crossword','ครอสเวิร์ด',1), ('a_math','เอแม็ท',2), ('kumkom','คำคม',3), ('sudoku','ซูโดกุ',4);

-- Configurable ranking categories. Intentionally NO seed rows: official definitions are not supplied.
create table public.ranking_categories (
  id uuid primary key default gen_random_uuid(),
  game_type text not null references public.game_types(code),
  code text not null,
  label_th text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (game_type, code)
);

-- ---------- news ----------
create table public.news (
  id uuid primary key default gen_random_uuid(),
  image_url text,
  category text not null,
  title text not null check (length(btrim(title)) > 0),
  slug text not null unique,
  excerpt text,
  content text not null,
  external_url text check (external_url is null or external_url ~* '^https?://'),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.admin_profiles(user_id) on delete set null
);
create index news_status_idx on public.news(status);
create index news_published_at_idx on public.news(published_at desc);
create index news_category_idx on public.news(category);

-- ---------- events ----------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  image_url text,
  title text not null check (length(btrim(title)) > 0),
  slug text not null unique,
  category text not null check (category in ('tournament','event','training','other')),
  game_type text not null check (game_type in ('crossword','a_math','kumkom','sudoku','multiple','other')),
  start_date date not null,
  end_date date,
  venue text,
  description text not null,
  result_url text check (result_url is null or result_url ~* '^https?://'),
  teacher_certificate_url text check (teacher_certificate_url is null or teacher_certificate_url ~* '^https?://'),
  student_certificate_url text check (student_certificate_url is null or student_certificate_url ~* '^https?://'),
  competition_status text not null check (competition_status in ('upcoming','registration_open','in_progress','completed','cancelled')),
  publication_status text not null default 'draft' check (publication_status in ('draft','published','archived')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.admin_profiles(user_id) on delete set null,
  check (end_date is null or end_date >= start_date)
);
create index events_publication_status_idx on public.events(publication_status);
create index events_competition_status_idx on public.events(competition_status);
create index events_start_date_idx on public.events(start_date);
create index events_game_type_idx on public.events(game_type);

-- Stamp published_at on first publish.
create or replace function public.stamp_published_at() returns trigger language plpgsql as $$
begin
  if tg_table_name = 'news' and new.status = 'published' and new.published_at is null then new.published_at = now(); end if;
  if tg_table_name = 'events' and new.publication_status = 'published' and new.published_at is null then new.published_at = now(); end if;
  return new;
end $$;
create trigger trg_news_pub before insert or update on public.news for each row execute function public.stamp_published_at();
create trigger trg_events_pub before insert or update on public.events for each row execute function public.stamp_published_at();
create trigger trg_news_updated before update on public.news for each row execute function public.set_updated_at();
create trigger trg_events_updated before update on public.events for each row execute function public.set_updated_at();

-- ---------- athletes (no date_of_birth: not needed, avoids exposing private data) ----------
create table public.athletes (
  id uuid primary key default gen_random_uuid(),
  athlete_code text unique,
  full_name text not null check (length(btrim(full_name)) > 0),
  display_name text,
  school_name text,
  province text,
  is_active boolean not null default true,
  publication_status text not null default 'draft' check (publication_status in ('draft','published','archived')),
  admin_notes text,  -- internal; public column grants below exclude it
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.admin_profiles(user_id) on delete set null
);
create index athletes_full_name_idx on public.athletes(full_name);
create index athletes_publication_idx on public.athletes(publication_status, is_active);
create trigger trg_athletes_updated before update on public.athletes for each row execute function public.set_updated_at();

-- ---------- hall_of_fame ----------
create table public.hall_of_fame (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid references public.athletes(id) on delete set null, -- optional link (B12)
  image_url text,
  athlete_name text not null check (length(btrim(athlete_name)) > 0),
  achievement_year int not null check (achievement_year between 1900 and 2200),
  event_id uuid references public.events(id) on delete set null,
  event_name text, -- snapshot; kept when event_id is null or the event is later removed
  game_type text not null references public.game_types(code),
  award_name text,
  achievement_details text,
  rating numeric check (rating is null or rating >= 0),
  rating_type text,
  rating_date date,
  status text not null default 'published' check (status in ('draft','published','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.admin_profiles(user_id) on delete set null,
  check (rating is null or rating_type is not null)
);
create index hof_year_idx on public.hall_of_fame(achievement_year);
create index hof_game_idx on public.hall_of_fame(game_type);
create index hof_status_idx on public.hall_of_fame(status);
create index hof_event_idx on public.hall_of_fame(event_id);
create index hof_athlete_idx on public.hall_of_fame(athlete_id);
create or replace function public.hof_snapshot_event_name() returns trigger language plpgsql as $$
begin
  if new.event_id is not null and (new.event_name is null or tg_op = 'INSERT') then
    select title into new.event_name from public.events where id = new.event_id;
  end if; return new;
end $$;
create trigger trg_hof_snapshot before insert or update on public.hall_of_fame for each row execute function public.hof_snapshot_event_name();
create trigger trg_hof_updated before update on public.hall_of_fame for each row execute function public.set_updated_at();

-- ---------- athlete_rating_history (append-only; corrections create a new row) ----------
create table public.athlete_rating_history (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete restrict,
  game_type text not null references public.game_types(code),
  category_id uuid references public.ranking_categories(id) on delete restrict,
  rating_value numeric not null check (rating_value >= 0),
  rating_period text,
  effective_date date not null,
  event_id uuid references public.events(id) on delete set null,
  source_type text not null check (source_type in ('manual','csv_import','external_calculation')),
  source_reference text,
  notes text,
  corrects_id uuid references public.athlete_rating_history(id) on delete restrict,
  publication_status text not null default 'draft' check (publication_status in ('draft','published','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.admin_profiles(user_id) on delete set null
);
create index arh_athlete_game_idx on public.athlete_rating_history(athlete_id, game_type, effective_date desc);
create index arh_game_status_idx on public.athlete_rating_history(game_type, publication_status);
create index arh_period_idx on public.athlete_rating_history(rating_period);
create index arh_event_idx on public.athlete_rating_history(event_id);
-- Immutable facts: value/athlete/game/date cannot be edited in place; correct via new row + archive old.
create or replace function public.arh_protect_facts() returns trigger language plpgsql as $$
begin
  if new.athlete_id <> old.athlete_id or new.game_type <> old.game_type or new.rating_value <> old.rating_value
     or new.effective_date <> old.effective_date then
    raise exception 'Rating facts are immutable; insert a correcting record (corrects_id) and archive the old one.';
  end if; return new;
end $$;
create trigger trg_arh_protect before update on public.athlete_rating_history for each row execute function public.arh_protect_facts();
create trigger trg_arh_updated before update on public.athlete_rating_history for each row execute function public.set_updated_at();

-- ---------- RLS ----------
alter table public.admin_profiles enable row level security;
alter table public.game_types enable row level security;
alter table public.ranking_categories enable row level security;
alter table public.news enable row level security;
alter table public.events enable row level security;
alter table public.athletes enable row level security;
alter table public.hall_of_fame enable row level security;
alter table public.athlete_rating_history enable row level security;

-- admin_profiles: a user may read only their own row. No write policies and no write grants.
revoke insert, update, delete on public.admin_profiles from anon, authenticated;
create policy admin_profiles_self_read on public.admin_profiles for select to authenticated using (user_id = auth.uid());

-- public read of published rows
create policy game_types_read on public.game_types for select using (true);
create policy ranking_categories_read on public.ranking_categories for select using (is_active);
create policy news_public_read on public.news for select using (status = 'published');
create policy events_public_read on public.events for select using (publication_status = 'published');
create policy hof_public_read on public.hall_of_fame for select using (status = 'published');
create policy athletes_public_read on public.athletes for select using (publication_status = 'published' and is_active);
create policy arh_public_read on public.athlete_rating_history for select
  using (publication_status = 'published'
         and exists (select 1 from public.athletes a where a.id = athlete_id and a.publication_status = 'published'));

-- admin full access (rating history: no DELETE policy => rows can never be deleted via the API)
create policy game_types_admin on public.game_types for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy ranking_categories_admin on public.ranking_categories for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy news_admin on public.news for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy events_admin on public.events for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy athletes_admin on public.athletes for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy hof_admin on public.hall_of_fame for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy arh_admin_select on public.athlete_rating_history for select to authenticated using (public.is_admin());
create policy arh_admin_insert on public.athlete_rating_history for insert to authenticated with check (public.is_admin());
create policy arh_admin_update on public.athlete_rating_history for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Hide internal columns from the public API (admins use the authenticated role, which keeps full access via is_admin()).
revoke select on public.athletes from anon;
grant select (id, athlete_code, full_name, display_name, school_name, province, is_active, publication_status, created_at, updated_at) on public.athletes to anon;
revoke insert, update, delete on all tables in schema public from anon;

-- ---------- storage ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('news-images','news-images',true,5242880,array['image/jpeg','image/png','image/webp']),
  ('event-images','event-images',true,5242880,array['image/jpeg','image/png','image/webp']),
  ('athlete-images','athlete-images',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
create policy images_public_read on storage.objects for select using (bucket_id in ('news-images','event-images','athlete-images'));
create policy images_admin_write on storage.objects for all to authenticated
  using (bucket_id in ('news-images','event-images','athlete-images') and public.is_admin())
  with check (bucket_id in ('news-images','event-images','athlete-images') and public.is_admin());
