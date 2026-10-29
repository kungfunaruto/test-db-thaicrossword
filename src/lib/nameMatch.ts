// Name matching for rating imports: exact match after tidying, plus "looks similar" suggestions that catch typos
// (wrong tone mark, missing letter, extra space, title prefix) before a duplicate athlete is created.
const INVISIBLE = /[​-‍⁠﻿]/g;
// Titles at the start of a name. Only removed when followed by a space or a Thai consonant (so a name that merely starts with these letters stays intact).
const PREFIX = /^(?:นางสาว|น\.ส\.|นาง|นาย|เด็กชาย|เด็กหญิง|ด\.ช\.|ด\.ญ\.|ดช\.|ดญ\.|mr\.?|mrs\.?|ms\.?|miss)(?=\s|[ก-ฮ])\s*/i;
const TONES = /[็-๎]/g; // ็ ่ ้ ๊ ๋ ์ ํ ๎
export const tidy = (s: string) => s.normalize('NFC').replace(INVISIBLE, '').replace(/\s+/g, ' ').trim();
/** Key used for exact matching: no title, no spaces, lower case. */
export const nameKey = (s: string) => tidy(s).replace(PREFIX, '').replace(/\s/g, '').toLowerCase();
const loose = (s: string) => nameKey(s).replace(TONES, '');
export const hasThai = (s: string) => /[฀-๿]/.test(s);

function lev(a: string, b: string): number {
  if (a === b) return 0; if (!a.length) return b.length; if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[b.length];
}
/** 0..1 similarity of two names (1 = same after tidying). */
export function similarity(a: string, b: string): number {
  const ka = nameKey(a), kb = nameKey(b);
  if (!ka || !kb) return 0;
  if (ka === kb) return 1;
  if (loose(a) === loose(b)) return 0.97;               // only tone marks differ
  const r = 1 - lev(ka, kb) / Math.max(ka.length, kb.length);
  const [fa, ...la] = tidy(a).replace(PREFIX, '').split(' '), [fb, ...lb] = tidy(b).replace(PREFIX, '').split(' ');
  const sa = nameKey(la.join('')), sb = nameKey(lb.join(''));
  const surname = sa && sb ? 1 - lev(sa, sb) / Math.max(sa.length, sb.length) : 0;
  const sameFirst = fa && fb && nameKey(fa) === nameKey(fb) && surname >= 0.5 ? 0.8 : 0; // same first name, surname spelled a bit differently
  const contains = (ka.length >= 4 && kb.includes(ka)) || (kb.length >= 4 && ka.includes(kb)) ? 0.82 : 0; // e.g. surname missing
  return Math.max(r, sameFirst, contains);
}
export interface Person { id: string; full_name: string; full_name_en: string | null }
/** Which of the athlete's names matched: their Thai name or their English name. */
export type Via = 'th' | 'en';
export interface Match<T extends Person> { exact: { person: T; via: Via }[]; similar: { person: T; score: number; via: Via; swapped?: boolean }[] }
const swap = (s: string) => tidy(s).replace(PREFIX, '').split(' ').reverse().join(' ');
/**
 * Index of people for fast exact lookup on BOTH their Thai and English names. Similar names are scored on demand against
 * both names too; a name written surname-first ("Jaidee Somchai") is offered as a similar match, never accepted silently.
 */
export function buildIndex<T extends Person>(people: T[]) {
  const byKey = new Map<string, { person: T; via: Via }[]>();
  const add = (k: string, person: T, via: Via) => { const l = byKey.get(k) ?? []; if (!l.some(x => x.person === person)) l.push({ person, via }); byKey.set(k, l); };
  for (const p of people) { add(nameKey(p.full_name), p, 'th'); if (p.full_name_en) add(nameKey(p.full_name_en), p, 'en'); }
  return (name: string, threshold = 0.74): Match<T> => {
    const exact = byKey.get(nameKey(name)) ?? [];
    if (exact.length) return { exact, similar: [] };
    const reversed = nameKey(swap(name));
    const similar = people.map(p => {
      const th = similarity(name, p.full_name), en = p.full_name_en ? similarity(name, p.full_name_en) : 0;
      const sw = name.includes(' ') && (reversed === nameKey(p.full_name) || (!!p.full_name_en && reversed === nameKey(p.full_name_en)));
      if (sw) return { person: p, score: 0.95, via: (reversed === nameKey(p.full_name) ? 'th' : 'en') as Via, swapped: true };
      return { person: p, score: Math.max(th, en), via: (en > th ? 'en' : 'th') as Via };
    }).filter(x => x.score >= threshold).sort((x, y) => y.score - x.score).slice(0, 3);
    return { exact, similar };
  };
}
