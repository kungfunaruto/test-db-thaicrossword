-- Q&A (frequently asked questions): public reads published rows, admins manage.
create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null check (length(btrim(question)) > 0),
  answer text not null check (length(btrim(answer)) > 0),
  game_type text check (game_type is null or game_type in ('crossword', 'a_math', 'kumkom', 'sudoku')), -- null = general
  sort_order int not null default 0,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.admin_profiles(user_id) on delete set null
);
create index if not exists faqs_status_sort_idx on public.faqs (status, sort_order);
create index if not exists faqs_game_idx on public.faqs (game_type);
drop trigger if exists trg_faqs_updated on public.faqs;
create trigger trg_faqs_updated before update on public.faqs for each row execute function public.set_updated_at();
alter table public.faqs enable row level security;
drop policy if exists faqs_public_read on public.faqs;
create policy faqs_public_read on public.faqs for select using (status = 'published');
drop policy if exists faqs_admin on public.faqs;
create policy faqs_admin on public.faqs for all to authenticated using (public.is_admin()) with check (public.is_admin());
revoke insert, update, delete on public.faqs from anon;
revoke select on public.faqs from anon;
grant select (id, question, answer, game_type, sort_order, status, created_at, updated_at) on public.faqs to anon; -- no created_by
