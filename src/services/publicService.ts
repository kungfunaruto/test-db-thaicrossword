import { supabase } from './supabase';
import type { CompetitionStatus, EventCardRow, EventRow, FaqRow, NewsCardRow, NewsRow, RankingRow, Revision } from '../types/db';
import { bangkokToday, bkkStartIso, addDays } from '../lib/dates';

// List pages only fetch what the cards show (no full text), so lists load faster.
const NEWS_CARD = 'id,images,category,title,title_en,excerpt,excerpt_en,published_at,is_pinned,created_at';
const NEWS_FULL = `${NEWS_CARD},content,content_en,external_url,updated_at`;
const EVENT_CARD = 'id,images,title,title_en,games,start_date,end_date,registration_deadline,reg_close,last_date,venue,venue_en,is_pinned,created_at';
const EVENT_FULL = `${EVENT_CARD},description,description_en,result_url,teacher_certificate_url,student_certificate_url,updated_at`;
export const PAGE_SIZE = 15; export const RANK_PAGE = 20; export const HOME_LIMIT = 5;
const like = (q: string) => `%${q.trim().replace(/[\\%_]/g, m => `\\${m}`)}%`;
const span = (page: number, size: number) => [(page - 1) * size, page * size - 1] as const;
// 22P02 = malformed uuid in the URL: treat as "not found".
const notFound = (e: { code?: string }) => e.code === '22P02';
// Values inside an or() filter are quoted; characters that would break the filter syntax are dropped from the search text.
const orLike = (cols: string[], q: string) => { const v = like(q.replace(/[,()"\\:]/g, ' ')); return cols.map(c => `${c}.ilike."${v}"`).join(','); };
const orTitle = (q: string) => orLike(['title', 'title_en'], q);

/** Competition status from dates, in Thailand time (same rule as the database columns reg_close / last_date). */
export function competitionStatus(e: Pick<EventCardRow, 'reg_close' | 'last_date'>, today = bangkokToday()): CompetitionStatus {
  if (today <= e.reg_close) return 'open';
  if (today <= e.last_date) return 'closed';
  return 'ended';
}

export interface DateRange { from: string; to: string }
export interface NewsQuery { q: string; category: string; range: DateRange | null; page: number }
export const newsKey = (o: NewsQuery) => `news:list:${JSON.stringify(o)}`;
export async function fetchNews(o: NewsQuery) {
  let qb = supabase.from('news').select(NEWS_CARD, { count: 'exact' }).eq('status', 'published');
  if (o.q.trim()) qb = qb.or(orTitle(o.q));
  if (o.category) qb = qb.eq('category', o.category);
  if (o.range) qb = qb.gte('published_at', bkkStartIso(o.range.from)).lt('published_at', bkkStartIso(addDays(o.range.to, 1)));
  const [a, b] = span(o.page, PAGE_SIZE);
  const { data, count, error } = await qb.order('published_at', { ascending: false }).order('created_at', { ascending: false }).range(a, b);
  if (error) throw error;
  return { rows: (data ?? []) as unknown as NewsCardRow[], total: count ?? 0 };
}
export const HOME_NEWS_KEY = 'news:home';
/** Home: ONE query so pinned rows can never be duplicated. Pinned first (most recently pinned), then newest. */
export async function fetchHomeNews(limit = HOME_LIMIT) {
  const { data, error } = await supabase.from('news').select(NEWS_CARD).eq('status', 'published')
    .order('is_pinned', { ascending: false }).order('pinned_at', { ascending: false, nullsFirst: false }).order('published_at', { ascending: false }).limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as NewsCardRow[];
}
export const newsDetailKey = (id: string) => `news:detail:${id}`;
export async function fetchNewsDetail(id: string) {
  const { data, error } = await supabase.from('news').select(NEWS_FULL).eq('id', id).eq('status', 'published').maybeSingle();
  if (error) { if (notFound(error)) return null; throw error; }
  const n = data as unknown as NewsRow | null;
  if (!n) return null;
  const [rev, rel] = await Promise.all([fetchRevisions('news', id), supabase.from('news').select(NEWS_CARD).eq('status', 'published').eq('category', n.category).neq('id', id)
    .order('published_at', { ascending: false }).limit(3)]);
  return { news: n, revisions: rev, related: (rel.data ?? []) as unknown as NewsCardRow[] };
}

export interface EventsQuery { q: string; status: string; range: DateRange | null; page: number }
export const eventsKey = (o: EventsQuery) => `events:list:${JSON.stringify(o)}`;
export async function fetchEvents(o: EventsQuery) {
  const today = bangkokToday();
  let qb = supabase.from('events').select(EVENT_CARD, { count: 'exact' }).eq('publication_status', 'published');
  if (o.q.trim()) qb = qb.or(orTitle(o.q));
  if (o.status === 'open') qb = qb.gte('reg_close', today);
  if (o.status === 'closed') qb = qb.lt('reg_close', today).gte('last_date', today);
  if (o.status === 'ended') qb = qb.lt('last_date', today);
  if (o.range) qb = qb.lte('start_date', o.range.to).gte('last_date', o.range.from); // competition days overlap the range
  const [a, b] = span(o.page, PAGE_SIZE);
  const { data, count, error } = await qb.order('start_date', { ascending: false }).order('created_at', { ascending: false }).range(a, b);
  if (error) throw error;
  return { rows: (data ?? []) as unknown as EventCardRow[], total: count ?? 0 };
}
export const HOME_EVENTS_KEY = 'events:home';
/** Home: pinned first, then the most recently ADDED competitions. */
export async function fetchHomeEvents(limit = HOME_LIMIT) {
  const { data, error } = await supabase.from('events').select(EVENT_CARD).eq('publication_status', 'published')
    .order('is_pinned', { ascending: false }).order('pinned_at', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false }).limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as EventCardRow[];
}
export const eventDetailKey = (id: string) => `events:detail:${id}`;
export async function fetchEventDetail(id: string) {
  const { data, error } = await supabase.from('events').select(EVENT_FULL).eq('id', id).eq('publication_status', 'published').maybeSingle();
  if (error) { if (notFound(error)) return null; throw error; }
  const e = data as unknown as EventRow | null;
  if (!e) return null;
  return { event: e, revisions: await fetchRevisions('events', id) };
}

async function fetchRevisions(entity: 'news' | 'events', id: string): Promise<Revision[]> {
  const { data, error } = await supabase.from('content_revisions').select('id,note,note_en,edited_at').eq('entity', entity).eq('entity_id', id).order('edited_at', { ascending: false }).limit(100);
  if (error) return []; // history is extra information; never block the page on it
  return (data ?? []) as Revision[];
}

const RANK_COLS = 'athlete_id,full_name,full_name_en,photo_url,game_type,rating_value,effective_date,rank';
export interface RankQuery { game: string; q: string; page: number }
export const rankingsKey = (o: RankQuery) => `rank:list:${JSON.stringify(o)}`;
/** Equal ratings share a rank (from the national_rankings view). Name order is display-only, not a tie-break. */
export async function fetchRankings(o: RankQuery) {
  let qb = supabase.from('national_rankings').select(RANK_COLS, { count: 'exact' }).eq('game_type', o.game);
  if (o.q.trim()) qb = qb.or(orLike(['full_name', 'full_name_en'], o.q));
  const [a, b] = span(o.page, RANK_PAGE);
  const { data, count, error } = await qb.order('rating_value', { ascending: false }).order('full_name').range(a, b);
  if (error) throw error;
  return { rows: (data ?? []) as unknown as RankingRow[], total: count ?? 0 };
}
export const topRatingsKey = (game: string) => `rank:top:${game}`;
export async function fetchTopRatings(game: string, limit = 10) {
  const { data, error } = await supabase.from('national_rankings').select(RANK_COLS).eq('game_type', game).order('rating_value', { ascending: false }).order('full_name').limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as RankingRow[];
}

export const FAQ_KEY = 'faq:list';
export async function fetchFaqs() {
  const { data, error } = await supabase.from('faqs').select('id,question,question_en,answer,answer_en,game_type,created_at').eq('status', 'published')
    .order('created_at', { ascending: false }).limit(500);
  if (error) throw error;
  return (data ?? []) as unknown as FaqRow[];
}
/** Visitors can send a question; they can never read submissions back. */
export async function submitQuestion(question: string) {
  const { error } = await supabase.from('faq_submissions').insert({ question: question.trim() });
  if (error) throw error;
}
