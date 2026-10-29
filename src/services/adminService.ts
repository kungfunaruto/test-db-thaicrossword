import { supabase } from './supabase';
export const signIn = (email: string, password: string) => supabase.auth.signInWithPassword({ email, password });
export const signOut = () => supabase.auth.signOut();
/** Server-verified: calls the SQL function public.is_admin(); never trusts client metadata. */
export async function checkIsAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_admin');
  return !error && data === true;
}

type CountRes = PromiseLike<{ count: number | null; error: unknown }>;
const cnt = async (q: CountRes) => { const r = await q; if (r.error) throw r.error; return r.count ?? 0; };
const head = { count: 'exact' as const, head: true };
export interface Counts { news: number; events: number; athletes: number; faqs: number }
export async function fetchCounts(): Promise<Counts> {
  const [news, events, athletes, faqs] = await Promise.all([
    cnt(supabase.from('news').select('*', head)), cnt(supabase.from('events').select('*', head)),
    cnt(supabase.from('athletes').select('*', head)), cnt(supabase.from('faqs').select('*', head))]);
  return { news, events, athletes, faqs };
}
export const fetchNewQuestionCount = () => cnt(supabase.from('faq_submissions').select('*', head).eq('status', 'new'));

export interface Stat { visitors: number; views: number; sessions: number }
export interface Analytics {
  generated_at: string; days: number; online_now: number; today: Stat; month: Stat; all_time: Stat & { since: string | null };
  range: Stat & { new_visitors: number }; daily: { day: string; visitors: number; views: number }[];
  top_pages: { path: string; views: number; visitors: number }[]; top_news: { id: string; title: string | null; views: number; visitors: number }[];
  top_events: { id: string; title: string | null; views: number; visitors: number }[]; devices: { device: string; visitors: number }[];
  languages: { lang: string; views: number }[]; referrers: { referrer: string; sessions: number }[]; hours: { hour: number; views: number }[];
}
export async function fetchAnalytics(days: number): Promise<Analytics> {
  const { data, error } = await supabase.rpc('admin_analytics', { p_days: days });
  if (error) throw error;
  return data as Analytics;
}
