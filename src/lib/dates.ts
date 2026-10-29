import type { Lang } from '../i18n';
// All "today" logic uses Thailand time so the competition status flips at midnight in Thailand, wherever the visitor is.
export const TZ = 'Asia/Bangkok';
const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
/** YYYY-MM-DD in Thailand time. */
export const bangkokToday = () => ymd.format(new Date());
export const toYmd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
/** Parses YYYY-MM-DD as a local calendar date (no timezone shift). */
export const parseYmd = (s: string) => { const [y, m, d] = s.slice(0, 10).split('-').map(Number); return new Date(y, m - 1, d); };
export const addDays = (s: string, n: number) => { const d = parseYmd(s); d.setDate(d.getDate() + n); return toYmd(d); };
export const daysBetween = (a: string, b: string) => Math.round((parseYmd(b).getTime() - parseYmd(a).getTime()) / 86_400_000);
/** Start of a Thailand calendar day as an ISO timestamp (for filtering timestamptz columns). */
export const bkkStartIso = (s: string) => `${s}T00:00:00+07:00`;

const locale = (lang: Lang) => (lang === 'th' ? 'th-TH' : 'en-GB');
const isDateOnly = (s: string) => s.length === 10;
/** Date-only strings are shown as-is (UTC) to avoid day shifts; timestamps are shown in Thailand time. */
export function fmtDate(s: string | null | undefined, lang: Lang, style: 'long' | 'medium' | 'short' = 'long') {
  if (!s) return '';
  return new Intl.DateTimeFormat(locale(lang), { dateStyle: style, timeZone: isDateOnly(s) ? 'UTC' : TZ }).format(new Date(s));
}
export function fmtDateTime(s: string, lang: Lang) {
  return new Intl.DateTimeFormat(locale(lang), { dateStyle: 'medium', timeStyle: 'short', timeZone: TZ }).format(new Date(s));
}
export const fmtRange = (a: string, b: string | null | undefined, lang: Lang, style: 'long' | 'medium' = 'long') =>
  (b && b !== a ? `${fmtDate(a, lang, style)} – ${fmtDate(b, lang, style)}` : fmtDate(a, lang, style));
export const monthTitle = (d: Date, lang: Lang) => new Intl.DateTimeFormat(locale(lang), { month: 'long', year: 'numeric' }).format(d);
/**
 * Short competition-day badge: "11" + "พ.ย." for one day, "20–21" + "พ.ย." within one month,
 * "30 พ.ย. – 2 ธ.ค." (long) across months. Date-only strings, no timezone shift.
 */
export function dateBadge(start: string, end: string | null | undefined, lang: Lang): { main: string; sub: string; long: boolean } {
  const f = (s: string, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(locale(lang), { ...o, timeZone: 'UTC' }).format(new Date(s));
  const d1 = f(start, { day: 'numeric' }), m1 = f(start, { month: 'short' });
  if (!end || end === start) return { main: d1, sub: m1, long: false };
  const d2 = f(end, { day: 'numeric' }), m2 = f(end, { month: 'short' });
  if (start.slice(0, 7) === end.slice(0, 7)) return { main: `${d1}–${d2}`, sub: m1, long: false };
  return { main: `${d1} ${m1} – ${d2} ${m2}`, sub: '', long: true };
}
