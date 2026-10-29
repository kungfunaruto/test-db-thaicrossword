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
/** Day/month parts for date badges, e.g. { day: '29', month: 'ต.ค.' }. */
export const dateParts = (s: string, lang: Lang) => {
  const d = new Date(s); const tz = isDateOnly(s) ? 'UTC' : TZ;
  return { day: new Intl.DateTimeFormat(locale(lang), { day: 'numeric', timeZone: tz }).format(d), month: new Intl.DateTimeFormat(locale(lang), { month: 'short', timeZone: tz }).format(d) };
};
