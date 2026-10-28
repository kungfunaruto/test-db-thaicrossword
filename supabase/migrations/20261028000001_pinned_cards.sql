-- Pin news and competitions (events). Pinned rows are shown first on the Home page (most recently pinned first).
alter table public.news add column if not exists is_pinned boolean not null default false;
alter table public.news add column if not exists pinned_at timestamptz;
alter table public.events add column if not exists is_pinned boolean not null default false;
alter table public.events add column if not exists pinned_at timestamptz;

-- pinned_at is managed by the database: set when a row becomes pinned, kept while it stays pinned, cleared on unpin.
create or replace function public.set_pinned_at() returns trigger language plpgsql as $$
begin
  if new.is_pinned then
    if tg_op = 'UPDATE' then
      if old.is_pinned and old.pinned_at is not null then new.pinned_at := old.pinned_at; else new.pinned_at := now(); end if;
    else
      new.pinned_at := coalesce(new.pinned_at, now());
    end if;
  else
    new.pinned_at := null;
  end if;
  return new;
end $$;
drop trigger if exists trg_news_pinned on public.news;
create trigger trg_news_pinned before insert or update on public.news for each row execute function public.set_pinned_at();
drop trigger if exists trg_events_pinned on public.events;
create trigger trg_events_pinned before insert or update on public.events for each row execute function public.set_pinned_at();

-- Matches the Home page query: published only, pinned first, then newest.
create index if not exists news_home_idx on public.news (is_pinned desc, pinned_at desc nulls last, published_at desc) where status = 'published';
create index if not exists events_home_idx on public.events (is_pinned desc, pinned_at desc nulls last, start_date desc) where publication_status = 'published';

-- Public (anon) column allow-list: the Home page needs to read and sort by these two columns.
grant select (is_pinned, pinned_at) on public.news to anon;
grant select (is_pinned, pinned_at) on public.events to anon;
