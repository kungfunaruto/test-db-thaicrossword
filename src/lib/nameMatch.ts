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
export interface Match<T extends Person> { exact: T[]; similar: { person: T; score: number }[] }
/** Index of people for fast exact lookup; similar names are scored on demand. */
export function buildIndex<T extends Person>(people: T[]) {
  const byKey = new Map<string, T[]>();
  for (const p of people) for (const n of [p.full_name, p.full_name_en]) { if (!n) continue; const k = nameKey(n); const l = byKey.get(k) ?? []; if (!l.includes(p)) l.push(p); byKey.set(k, l); }
  return (name: string, threshold = 0.74): Match<T> => {
    const exact = byKey.get(nameKey(name)) ?? [];
    if (exact.length) return { exact, similar: [] };
    const similar = people.map(p => ({ person: p, score: Math.max(similarity(name, p.full_name), p.full_name_en ? similarity(name, p.full_name_en) : 0) }))
      .filter(x => x.score >= threshold).sort((x, y) => y.score - x.score).slice(0, 3);
    return { exact, similar };
  };
}
