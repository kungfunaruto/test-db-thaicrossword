import { useRef, useState, type FormEvent } from 'react';
import { CheckCircle2, ExternalLink, Info, Loader2, Search, XCircle } from 'lucide-react';
import { collins } from '../../content/rules/tools';
import { loadWordSet, normalizeInput, shapeError, type Lang } from '../../utils/wordCheck';
import { useLang } from '../../i18n';

type Result = { kind: 'found' | 'missing'; word: string } | { kind: 'error'; text: string } | null;
export default function WordChecker({ lang }: { lang: Lang }) {
  const { t } = useLang(); const c = t.tools.checker; const d = c[lang];
  const [value, setValue] = useState(''); const [busy, setBusy] = useState(false); const [failed, setFailed] = useState(false);
  const [count, setCount] = useState<number | null>(null); const [result, setResult] = useState<Result>(null);
  const words = useRef<Set<string> | null>(null);
  async function ensure() {
    if (words.current) return words.current;
    setBusy(true); setFailed(false);
    try { const s = await loadWordSet(lang); words.current = s; setCount(s.size); return s; } catch { setFailed(true); return null; } finally { setBusy(false); }
  }
  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const w = normalizeInput(value, lang);
    if (!w) { setResult({ kind: 'error', text: c.empty }); return; }
    if (shapeError(w, lang)) { setResult({ kind: 'error', text: lang === 'en' ? c.onlyEnglish : c.onlyThai }); return; }
    const s = await ensure(); if (!s) { setResult(null); return; }
    setResult({ kind: s.has(w) ? 'found' : 'missing', word: lang === 'en' ? w.toUpperCase() : w });
  }
  const ok = result?.kind === 'found';
  return (<div className="mt-4 rounded-2xl border border-line bg-white p-5 shadow-card">
    <h4 className="flex items-center gap-2 font-sans text-lg font-semibold text-navy"><Search className="h-5 w-5" />{d.title}</h4>
    <div className="mt-3 flex gap-2 rounded-xl bg-blue-light p-3 text-sm text-navy-dark"><Info className="mt-0.5 h-4 w-4 shrink-0" /><p>{d.info}</p></div>
    <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-2 sm:flex-row">
      <label className="sr-only" htmlFor={`wc-${lang}`}>{d.title}</label>
      <input id={`wc-${lang}`} value={value} onChange={e => setValue(e.target.value)} onFocus={() => { void ensure(); }} placeholder={d.placeholder} maxLength={40} autoComplete="off" autoCapitalize="none" spellCheck={false}
        lang={lang} className="input min-w-0 flex-1 py-3 text-lg" />
      <button type="submit" aria-busy={busy} className="btn-primary py-3">{busy && <Loader2 className="h-4 w-4 animate-spin" />}{c.check}</button></form>
    <div aria-live="polite" className="mt-4 min-h-[1rem]">
      {busy && !result && <p className="text-sm text-muted">{c.loadingWords}</p>}
      {failed && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{c.loadFailed}</p>}
      {result?.kind === 'error' && <p role="alert" className="animate-fade-in rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{result.text}</p>}
      {result && result.kind !== 'error' && (<div key={result.word + result.kind} className={`flex animate-scale-in gap-3 rounded-xl border p-4 ${ok ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
        {ok ? <CheckCircle2 className="h-8 w-8 shrink-0 animate-pop text-emerald-700" /> : <XCircle className="h-8 w-8 shrink-0 animate-pop text-red-700" />}
        <div className="min-w-0"><p className={`font-semibold ${ok ? 'text-emerald-800' : 'text-red-800'}`}>{ok ? d.found : d.missing}</p>
          <p className="break-all font-display text-2xl font-semibold text-navy-dark">{result.word}</p><p className="mt-1 text-sm text-slate-700">{ok ? d.foundNote : d.missingNote}</p></div></div>)}</div>
    <p className="mt-3 text-xs text-muted">{c.source(d.name, count)}{lang === 'en' && count !== null ? c.enableCredit : ''}</p>
    {lang === 'en' && <a href={collins.check} target="_blank" rel="noopener noreferrer" className="btn-outline btn-sm mt-3"><ExternalLink className="h-4 w-4" />{c.collinsCheck}</a>}</div>);
}
