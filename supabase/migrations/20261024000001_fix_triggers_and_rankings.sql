-- 1) Fix: the shared trigger referenced new.status, which events does not have ("record new has no field status").
drop trigger if exists trg_news_pub on public.news;
drop trigger if exists trg_events_pub on public.events;
drop function if exists public.stamp_published_at();
create or replace function public.stamp_news_published_at() returns trigger language plpgsql as $$
begin if new.status = 'published' and new.published_at is null then new.published_at = now(); end if; return new; end $$;
create or replace function public.stamp_event_published_at() returns trigger language plpgsql as $$
begin if new.publication_status = 'published' and new.published_at is null then new.published_at = now(); end if; return new; end $$;
create trigger trg_news_pub before insert or update on public.news for each row execute function public.stamp_news_published_at();
create trigger trg_events_pub before insert or update on public.events for each row execute function public.stamp_event_published_at();

-- 2) National ranking per game type.
-- PROVISIONAL RULE (awaiting association confirmation): an athlete's current rating for a game is the published
-- record with the latest effective_date (then latest created_at). Equal ratings share the same rank; no other tie-break.
-- Only published, active athletes appear. Ratings with a category_id are excluded (categories not defined yet).
create or replace view public.national_rankings with (security_invoker = true) as
with cur as (
  select distinct on (h.athlete_id, h.game_type)
         h.athlete_id, h.game_type, h.rating_value, h.effective_date, h.rating_period
  from public.athlete_rating_history h
  where h.publication_status = 'published' and h.category_id is null
  order by h.athlete_id, h.game_type, h.effective_date desc, h.created_at desc
)
select cur.athlete_id, a.full_name, a.school_name, a.province, cur.game_type, cur.rating_value,
       cur.effective_date, cur.rating_period,
       rank() over (partition by cur.game_type order by cur.rating_value desc) as rank
from cur join public.athletes a on a.id = cur.athlete_id and a.publication_status = 'published' and a.is_active;
grant select on public.national_rankings to anon, authenticated;
