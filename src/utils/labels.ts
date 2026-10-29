const WJ = '⁠'; // word joiner: forbids a line break at this point
const NO_BREAK: [string, string[]][] = [['เอแม็ท', ['เอ', 'แม็', 'ท']], ['ซูโดกุ', ['ซู', 'โด', 'กุ']]]; // split only between syllable clusters, never inside one
/** Keeps เอแม็ท and ซูโดกุ on one line wherever they are rendered. */
export const nb = (s: string) => NO_BREAK.reduce((t, [w, p]) => t.split(w).join(p.join(WJ)), s);
export const GAME_TYPES = ['crossword', 'a_math', 'kumkom', 'sudoku'] as const;
export const RANKED_GAMES = ['crossword', 'a_math'] as const; // only these games have ratings/rankings
/** Rules page slug for each game (Sudoku has no rules page yet). */
export const GAME_SLUG: Record<string, string> = { crossword: 'crossword', a_math: 'a-math', kumkom: 'kumkom' };
export const GAME_COLOR: Record<string, string> = { crossword: '#1F7A8C', a_math: '#1E3A8A', kumkom: '#C81D4E', sudoku: '#7B4B9A' };
export const STATUS_STYLE: Record<string, string> = {
  open: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20', closed: 'bg-amber-50 text-amber-800 ring-1 ring-amber-600/20', upcoming: 'bg-blue-light text-navy ring-1 ring-navy/15', ended: 'bg-slate-100 text-slate-600 ring-1 ring-slate-500/15' };
export const STATUS_DOT: Record<string, string> = { open: 'bg-emerald-500', closed: 'bg-amber-500', upcoming: 'bg-navy-soft', ended: 'bg-slate-400' };
