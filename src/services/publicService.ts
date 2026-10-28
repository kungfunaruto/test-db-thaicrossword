import { supabase } from './supabase';
import type { EventRow, FaqRow, NewsRow, RankingRow } from '../types/db';

const NEWS_COLS = 'id,image_url,category,title,slug,excerpt,content,external_url,status,published_at,is_pinned,pinned_at,created_at,updated_at';
const EVENT_COLS = 'id,image_url,title,slug,category,game_type,start_date,end_date,venue,description,result_url,teacher_certificate_url,student_certificate_url,competition_status,publication_status,published_at,is_pinned,pinned_at,created_at,updated_at';
export const NEWS_PAGE = 9; export const EVENTS_PAGE = 9; export const RANK_PAGE = 20;
const like = (q: string) => `%${q.trim().replace(/[\\%_]/g, m => `\\${m}`)}%`;
const span = (page: number, size: number) => [(page - 1) * size, page * size - 1] as const;
// 22P02 = malformed uuid in the URL: treat as "not found".
const notFound = (e: { code?: string }) => e.code === '22P02';

export async function fetchNews(o: { q: string; category: string; oldest: boolean; page: number }) {
  let qb = supabase.from('news').select(NEWS_COLS, { count: 'exact' }).eq('status', 'published');
  if (o.q.trim()) qb = qb.ilike('title', like(o.q));
  if (o.category) qb = qb.eq('category', o.category);
  const [a, b] = span(o.page, NEWS_PAGE);
  const { data, count, error } = await qb.order('published_at', { ascending: o.oldest }).range(a, b);
  if (error) throw error;
  return { rows: (data ?? []) as unknown as NewsRow[], total: count ?? 0 };
}
export const HOME_LIMIT = 5;
/** Home page: ONE query so pinned rows can never be duplicated. Pinned first (most recently pinned first), then newest; pinned rows count toward the limit. */
export async function fetchHomeNews(limit = HOME_LIMIT) {
  const { data, error } = await supabase.from('news').select(NEWS_COLS).eq('status', 'published')
    .order('is_pinned', { ascending: false }).order('pinned_at', { ascending: false, nullsFirst: false }).order('published_at', { ascending: false }).limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as NewsRow[];
}
export async function fetchNewsById(id: string) {
  const { data, error } = await supabase.from('news').select(NEWS_COLS).eq('id', id).eq('status', 'published').maybeSingle();
  if (error) { if (notFound(error)) return null; throw error; }
  return data as unknown as NewsRow | null;
}
export async function fetchRelatedNews(n: NewsRow) {
  const { data } = await supabase.from('news').select(NEWS_COLS).eq('status', 'published').eq('category', n.category).neq('id', n.id)
    .order('published_at', { ascending: false }).limit(3);
  return (data ?? []) as unknown as NewsRow[];
}
export async function fetchEvents(o: { q: string; status: string; oldest: boolean; page: number }) {
  let qb = supabase.from('events').select(EVENT_COLS, { count: 'exact' }).eq('publication_status', 'published');
  if (o.q.trim()) qb = qb.ilike('title', like(o.q));
  if (o.status) qb = qb.eq('competition_status', o.status);
  const [a, b] = span(o.page, EVENTS_PAGE);
  const { data, count, error } = await qb.order('start_date', { ascending: o.oldest }).range(a, b);
  if (error) throw error;
  return { rows: (data ?? []) as unknown as EventRow[], total: count ?? 0 };
}
export async function fetchHomeEvents(limit = HOME_LIMIT) {
  const { data, error } = await supabase.from('events').select(EVENT_COLS).eq('publication_status', 'published')
    .order('is_pinned', { ascending: false }).order('pinned_at', { ascending: false, nullsFirst: false }).order('start_date', { ascending: false }).limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as EventRow[];
}
export async function fetchEventById(id: string) {
  const { data, error } = await supabase.from('events').select(EVENT_COLS).eq('id', id).eq('publication_status', 'published').maybeSingle();
  if (error) { if (notFound(error)) return null; throw error; }
  return data as unknown as EventRow | null;
}
/** Equal ratings share a rank (from the national_rankings view). Name order is display-only, not a tie-break. */
export async function fetchRankings(o: { game: string; q: string; page: number }) {
  let qb = supabase.from('national_rankings').select('*', { count: 'exact' }).eq('game_type', o.game);
  if (o.q.trim()) qb = qb.ilike('full_name', like(o.q));
  const [a, b] = span(o.page, RANK_PAGE);
  const { data, count, error } = await qb.order('rating_value', { ascending: false }).order('full_name').range(a, b);
  if (error) throw error;
  return { rows: (data ?? []) as RankingRow[], total: count ?? 0 };
}

const FAQ_COLS = 'id,question,answer,game_type,sort_order,status,created_at,updated_at';
export async function fetchFaqs() {
  const { data, error } = await supabase.from('faqs').select(FAQ_COLS).eq('status', 'published')
    .order('sort_order', { ascending: true }).order('created_at', { ascending: false }).limit(500);
  if (error) throw error;
  return (data ?? []) as unknown as FaqRow[];
}
