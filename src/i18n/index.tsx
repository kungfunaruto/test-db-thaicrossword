import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { th, type Dict } from './th';
import { en } from './en';

export type Lang = 'th' | 'en';
const DICTS: Record<Lang, Dict> = { th, en };
const KEY = 'tca-lang';

function initialLang(): Lang {
  try {
    const q = new URLSearchParams(window.location.search).get('lang');
    if (q === 'en' || q === 'th') return q;
    const s = localStorage.getItem(KEY);
    if (s === 'en' || s === 'th') return s;
  } catch { /* storage blocked: fall back to Thai */ }
  return 'th';
}

interface Ctx { lang: Lang; t: Dict; setLang: (l: Lang) => void }
const LangCtx = createContext<Ctx>({ lang: 'th', t: th, setLang: () => {} });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem(KEY, l); } catch { /* ignore */ }
  }, []);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  const value = useMemo(() => ({ lang, setLang, t: DICTS[lang] }), [lang, setLang]);
  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>;
}
export const useLang = () => useContext(LangCtx);

/** Picks the English column when the site is in English and that column has text; otherwise the Thai column. */
export function loc<T extends object>(row: T | null | undefined, field: keyof T & string, lang: Lang): string {
  if (!row) return '';
  const r = row as Record<string, unknown>;
  const en = r[`${field}_en`];
  if (lang === 'en' && typeof en === 'string' && en.trim()) return en;
  const v = r[field];
  return typeof v === 'string' ? v : '';
}
