// Thai → English machine translation for the admin forms (Google Translate's free web endpoint).
// Order: 1) the admin's browser calls Google directly, 2) if that is blocked, our /api/translate proxy on Vercel.
// Every result stays editable in the form. To switch to an official API later, change only this file and api/translate.ts.
import { supabase } from '../services/supabase';

// Names Google would otherwise translate literally (e.g. คำคม → "quotes"). Longest first.
const TERMS: [string, string][] = [
  ['สมาคมครอสเวิร์ดเกม เอแม็ท คำคม และซูโดกุ แห่งประเทศไทย', 'Thailand Crossword Game A-Math Kumkom and Sudoku Association'],
  ['บางกอกครอสเวิร์ดคลับ', 'Bangkok Crossword Club'], ['ครอสเวิร์ดเกม', 'Crossword Game'], ['ครอสเวิร์ด', 'Crossword'],
  ['เอแม็ท', 'A-Math'], ['เอแมท', 'A-Math'], ['คำคม', 'Kumkom'], ['ซูโดกุ', 'Sudoku'],
  ['ไทยสมิธ', 'Thaismith'], ['แมทสมิธ', 'Mathsmith'], ['เวิร์ดสมิธ', 'Wordsmith'], ['ชาลเล้นจ์', 'challenge'],
];
const protect = (s: string) => TERMS.reduce((t, [th, en]) => t.split(th).join(` ${en} `), s).replace(/ {2,}/g, ' ');

const CHUNK = 1800;
/** Splits long text at line breaks (then sentence spaces) so each request stays small; joining the pieces restores the text. */
function chunks(text: string): string[] {
  const out: string[] = []; let cur = '';
  for (const line of text.split(/(?<=\n)/)) {
    if (cur.length + line.length > CHUNK && cur) { out.push(cur); cur = ''; }
    if (line.length > CHUNK) { for (let i = 0; i < line.length; i += CHUNK) out.push(line.slice(i, i + CHUNK)); continue; }
    cur += line;
  }
  if (cur) out.push(cur);
  return out;
}

async function googleDirect(text: string): Promise<string> {
  const r = await fetch('https://translate.googleapis.com/translate_a/single?client=gtx&sl=th&tl=en&dt=t', { method: 'POST', body: new URLSearchParams({ q: text }) });
  if (!r.ok) throw new Error(`google ${r.status}`);
  const j = (await r.json()) as [[string, string][]];
  return (j[0] ?? []).map(seg => seg[0]).join('');
}
async function viaProxy(texts: string[]): Promise<string[]> {
  const { data } = await supabase.auth.getSession();
  const r = await fetch('/api/translate', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session?.access_token ?? ''}` }, body: JSON.stringify({ texts }) });
  if (!r.ok) throw new Error(`proxy ${r.status}`);
  const j = (await r.json()) as { translations: string[] };
  if (!Array.isArray(j.translations) || j.translations.length !== texts.length) throw new Error('proxy shape');
  return j.translations;
}

let directBlocked = false; // after one CORS/429 failure, go straight to the proxy for this session
async function translatePieces(pieces: string[]): Promise<string[]> {
  if (!directBlocked) {
    try { const out: string[] = []; for (const p of pieces) out.push(await googleDirect(p)); return out; } catch { directBlocked = true; }
  }
  return viaProxy(pieces);
}

const tidy = (s: string) => s.replace(/[ \t]+\n/g, '\n').replace(/ {2,}/g, ' ').trim();

/** Translates each text (Thai → English). Empty input gives empty output. Throws if no translation route works. */
export async function translateToEnglish(texts: string[]): Promise<string[]> {
  const plan = texts.map(t => (t.trim() ? chunks(protect(t)) : []));
  const flat = plan.flat();
  if (!flat.length) return texts.map(() => '');
  const res = await translatePieces(flat);
  let i = 0;
  return plan.map(p => tidy(p.map(() => res[i++]).join('')));
}
