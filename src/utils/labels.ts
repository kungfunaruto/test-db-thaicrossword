const WJ = '\u2060'; // word joiner: forbids a line break at this point
const NO_BREAK: [string, string[]][] = [['เอแม็ท', ['เอ', 'แม็', 'ท']], ['ซูโดกุ', ['ซู', 'โด', 'กุ']]]; // split only between syllable clusters, never inside one
/** Keeps เอแม็ท and ซูโดกุ on one line wherever they are rendered. */
export const nb = (s: string) => NO_BREAK.reduce((t, [w, p]) => t.split(w).join(p.join(WJ)), s);
export const GAME_TYPES = ['crossword', 'a_math', 'kumkom', 'sudoku'] as const;
const RAW_GAME_LABEL: Record<string, string> = { crossword: 'ครอสเวิร์ด', a_math: 'เอแม็ท', kumkom: 'คำคม', sudoku: 'ซูโดกุ', multiple: 'หลายเกม', other: 'อื่น ๆ' };
export const GAME_LABEL: Record<string, string> = Object.fromEntries(Object.entries(RAW_GAME_LABEL).map(([k, v]) => [k, nb(v)]));
export const RANKED_GAMES = ['crossword', 'a_math'] as const; // only these games have ratings/rankings
export const STATUS_LABEL: Record<string, string> = { upcoming: 'เร็ว ๆ นี้', registration_open: 'เปิดรับสมัคร', in_progress: 'กำลังแข่งขัน', completed: 'สิ้นสุดแล้ว', cancelled: 'ยกเลิก' };
export const STATUS_STYLE: Record<string, string> = { upcoming: 'bg-blue-light text-navy', registration_open: 'bg-emerald-100 text-emerald-800',
  in_progress: 'bg-amber-100 text-amber-800', completed: 'bg-slate-200 text-slate-700', cancelled: 'bg-red-100 text-red-800' };
export const NEWS_CATEGORIES = ['ประกาศทั่วไป', 'ประกาศการแข่งขัน', 'ผลการแข่งขัน', 'ข่าวกิจกรรม', 'ข่าวอื่น ๆ'];
/** Date-only strings are shown as-is (UTC) to avoid day shifts; timestamps use the viewer's timezone. Display only; stored values untouched. */
export const thDate = (s?: string | null) => s ? new Intl.DateTimeFormat('th-TH', { dateStyle: 'long', timeZone: s.length === 10 ? 'UTC' : undefined }).format(new Date(s)) : '';
export const dateRange = (a: string, b?: string | null) => (b && b !== a ? `${thDate(a)} – ${thDate(b)}` : thDate(a));
export const thDateShort = (s?: string | null) => s ? new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeZone: s.length === 10 ? 'UTC' : undefined }).format(new Date(s)) : '';
