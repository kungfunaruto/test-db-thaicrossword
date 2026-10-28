import { dictionaries } from '../content/rules/tools';
export type Lang = 'en' | 'th';
export const normalizeInput = (s: string, lang: Lang) => { const t = s.normalize('NFC').replace(/[\u200B-\u200D\u2060\uFEFF]/g, '').trim(); return lang === 'en' ? t.toLowerCase() : t; };
/** Returns a Thai error message when the input is not a single word of the expected alphabet, otherwise null. */
export function shapeError(w: string, lang: Lang): string | null {
  if (/\s/.test(w)) return 'กรุณาใส่ทีละ 1 คำ (ห้ามมีช่องว่าง)';
  if (lang === 'en' && !/^[a-z]+$/.test(w)) return 'กรุณาใช้ตัวอักษร A–Z เท่านั้น';
  if (lang === 'th' && !/^[\u0E00-\u0E7F]+$/.test(w)) return 'กรุณาใช้ตัวอักษรภาษาไทยเท่านั้น';
  return null;
}
const cache: Partial<Record<Lang, Promise<Set<string>>>> = {};
export function loadWordSet(lang: Lang): Promise<Set<string>> {
  cache[lang] ??= fetch(dictionaries[lang].url).then(async r => {
    if (!r.ok) throw new Error(`dictionary ${r.status}`);
    const set = new Set<string>();
    for (const line of (await r.text()).split(/\r?\n/)) { const w = normalizeInput(line, lang); if (w && !w.startsWith('#')) set.add(w); }
    return set;
  }).catch(e => { delete cache[lang]; throw e; });
  return cache[lang]!;
}
