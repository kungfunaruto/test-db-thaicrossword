import { useRef, useState, type FormEvent } from 'react';
import { CheckCircle2, ExternalLink, Info, Loader2, Search, XCircle } from 'lucide-react';
import { collins, dictionaries } from '../../content/rules/tools';
import { loadWordSet, normalizeInput, shapeError, type Lang } from '../../utils/wordCheck';

type Result = { kind: 'found' | 'missing'; word: string } | { kind: 'error'; text: string } | null;
export default function WordChecker({ lang }: { lang: Lang }) {
  const d = dictionaries[lang];
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
    if (!w) { setResult({ kind: 'error', text: 'กรุณาพิมพ์คำที่ต้องการตรวจ' }); return; }
    const err = shapeError(w, lang); if (err) { setResult({ kind: 'error', text: err }); return; }
    const s = await ensure(); if (!s) { setResult(null); return; }
    setResult({ kind: s.has(w) ? 'found' : 'missing', word: lang === 'en' ? w.toUpperCase() : w });
  }
  const ok = result?.kind === 'found';
  return (<div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-card">
    <h4 className="flex items-center gap-2 font-sans text-lg font-semibold text-navy"><Search className="h-5 w-5" />{d.title}</h4>
    <div className="mt-3 flex gap-2 rounded-lg bg-blue-light p-3 text-sm text-navy-dark"><Info className="mt-0.5 h-4 w-4 shrink-0" />
      {lang === 'en'
        ? <p>ตัวตรวจนี้ใช้ <b>ENABLE</b> ซึ่งเป็นพจนานุกรมอ้างอิงสาธารณสมบัติ <b>ไม่ใช่</b> Collins Official SCRABBLE™ Words (2024) ที่ใช้ตัดสินในการแข่งขัน รายการคำของ Collins มีลิขสิทธิ์จึงไม่ได้นำมาฝังในเว็บไซต์นี้ คำที่ถูกต้องใน Collins อาจไม่อยู่ใน ENABLE (เช่น QI) จึงควรยืนยันผลทางการด้วยโปรแกรมหรือหน้า CHECK ของ Collins</p>
        : <p>ตรวจจากฐานคำศัพท์คำคมที่สมาคมจัดเตรียม ใช้ฐานคำชุดเดียวกับโปรแกรม Challenge คำคม การตัดสินอย่างเป็นทางการในการแข่งขันให้ยึดกรรมการ</p>}</div>
    <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-2 sm:flex-row">
      <label className="sr-only" htmlFor={`wc-${lang}`}>{d.title}</label>
      <input id={`wc-${lang}`} value={value} onChange={e => setValue(e.target.value)} onFocus={() => { void ensure(); }} placeholder={d.placeholder} maxLength={40} autoComplete="off" autoCapitalize="none" spellCheck={false}
        lang={lang} className="min-w-0 flex-1 rounded border border-slate-300 p-3 text-lg" />
      <button type="submit" aria-busy={busy} className="inline-flex items-center justify-center gap-2 rounded bg-navy px-6 py-3 font-medium text-white">{busy && <Loader2 className="h-4 w-4 animate-spin" />}ตรวจคำ</button></form>
    <div aria-live="polite" className="mt-4 min-h-[1rem]">
      {busy && !result && <p className="text-sm text-muted">กำลังโหลดฐานคำ กรุณารอสักครู่...</p>}
      {failed && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">โหลดฐานคำไม่สำเร็จ กรุณาลองใหม่อีกครั้ง</p>}
      {result?.kind === 'error' && <p role="alert" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{result.text}</p>}
      {result && result.kind !== 'error' && (<div className={`flex gap-3 rounded-lg border p-4 ${ok ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
        {ok ? <CheckCircle2 className="h-8 w-8 shrink-0 text-emerald-700" /> : <XCircle className="h-8 w-8 shrink-0 text-red-700" />}
        <div className="min-w-0"><p className={`font-semibold ${ok ? 'text-emerald-800' : 'text-red-800'}`}>{ok ? d.found : d.missing}</p>
          <p className="break-all font-serif text-2xl font-bold text-navy-dark">{result.word}</p><p className="mt-1 text-sm text-slate-700">{ok ? d.foundNote : d.missingNote}</p></div></div>)}</div>
    <p className="mt-3 text-xs text-muted">{count !== null ? `ฐานคำที่ใช้ตรวจ: ${d.name} (${count.toLocaleString('th-TH')} คำ)${lang === 'en' ? ' · Enhanced North American Benchmark LExicon (สาธารณสมบัติ)' : ''}` : `ฐานคำที่ใช้ตรวจ: ${d.name}`}</p>
    {lang === 'en' && <a href={collins.check} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 rounded border border-navy px-4 py-2 text-sm font-medium text-navy hover:bg-blue-light"><ExternalLink className="h-4 w-4" />ตรวจกับหน้า CHECK ของ Collins (เว็บไซต์ทางการ)</a>}</div>);
}
