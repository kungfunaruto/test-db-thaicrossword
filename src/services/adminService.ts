import { supabase } from './supabase';
export const signIn = (email: string, password: string) => supabase.auth.signInWithPassword({ email, password });
export const signOut = () => supabase.auth.signOut();
/** Server-verified: calls the SQL function public.is_admin(); never trusts client metadata. */
export async function checkIsAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_admin');
  return !error && data === true;
}

export interface Recent { id: string; title: string; at: string | null }
export interface Dashboard {
  counts: { news: number; newsPublished: number; events: number; eventsUpcoming: number; athletes: number; faqs: number };
  recent: { news: Recent[]; events: Recent[]; athletes: Recent[] };
}
type CountRes = PromiseLike<{ count: number | null; error: unknown }>;
const cnt = async (q: CountRes) => { const r = await q; if (r.error) throw r.error; return r.count ?? 0; };
const head = { count: 'exact' as const, head: true };
async function recent(table: string, titleCol: string): Promise<Recent[]> {
  const { data, error } = await supabase.from(table).select(`id, ${titleCol}, created_at`).order('created_at', { ascending: false }).limit(5);
  if (error) throw error;
  return ((data ?? []) as unknown as Record<string, string>[]).map(r => ({ id: r.id, title: r[titleCol], at: r.created_at }));
}
/** "Upcoming" = published events whose competition_status is upcoming or registration_open. */
export async function fetchDashboard(): Promise<Dashboard> {
  const [news, newsPublished, events, eventsUpcoming, athletes, faqs, rn, re, ra] = await Promise.all([
    cnt(supabase.from('news').select('*', head)),
    cnt(supabase.from('news').select('*', head).eq('status', 'published')),
    cnt(supabase.from('events').select('*', head)),
    cnt(supabase.from('events').select('*', head).eq('publication_status', 'published').in('competition_status', ['upcoming', 'registration_open'])),
    cnt(supabase.from('athletes').select('*', head)),
    cnt(supabase.from('faqs').select('*', head)),
    recent('news', 'title'), recent('events', 'title'), recent('athletes', 'full_name'),
  ]);
  return { counts: { news, newsPublished, events, eventsUpcoming, athletes, faqs }, recent: { news: rn, events: re, athletes: ra } };
}
