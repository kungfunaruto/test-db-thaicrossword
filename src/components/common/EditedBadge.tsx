import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { History, PenLine, X } from 'lucide-react';
import { useLang } from '../../i18n';
import type { Revision } from '../../types/db';
import { fmtDate, fmtDateTime } from '../../lib/dates';

const canHover = () => typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/**
 * "Last edited <date>" for published content. Shows the date of the LATEST edit; the full history (every edit and its note)
 * appears on hover (mouse) or in a popup when tapped (touch screens).
 */
export default function EditedBadge({ revisions }: { revisions: Revision[] }) {
  const { t, lang } = useLang();
  const [open, setOpen] = useState(false);
  const timer = useRef<number>();
  useEffect(() => () => window.clearTimeout(timer.current), []);
  if (!revisions.length) return null;
  const note = (r: Revision) => (lang === 'en' && r.note_en?.trim() ? r.note_en : r.note);
  const list = (<ol className="relative space-y-4 border-l-2 border-gold/40 pl-5">{revisions.map((r, i) => (<li key={r.id} className="relative">
    <span className={`absolute -left-[1.6rem] top-1.5 h-3 w-3 rounded-full ring-4 ring-white ${i === 0 ? 'bg-gold' : 'bg-slate-300'}`} />
    <p className="text-xs font-medium text-muted">{fmtDateTime(r.edited_at, lang)}</p><p className="whitespace-pre-line text-sm text-ink">{note(r)}</p></li>))}</ol>);
  const hover = canHover();
  return (<span className="relative inline-flex" onMouseEnter={() => { if (canHover()) { window.clearTimeout(timer.current); setOpen(true); } }}
    onMouseLeave={() => { if (canHover()) timer.current = window.setTimeout(() => setOpen(false), 150); }}>
    <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open} title={hover ? undefined : t.edited.tapHint}
      className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 ring-1 ring-amber-600/20 transition hover:bg-amber-100">
      <PenLine className="h-3.5 w-3.5" />{t.edited.label} {fmtDate(revisions[0].edited_at, lang, 'medium')}
      {revisions.length > 1 && <span className="rounded-full bg-amber-200/70 px-1.5 text-[10px]">{revisions.length}</span>}</button>
    {open && hover && <div role="tooltip" className="absolute left-0 top-full z-30 w-80 max-w-[85vw] pt-2"><div className="max-h-80 animate-scale-in overflow-y-auto rounded-2xl border border-line bg-white p-4 shadow-lift">
      <p className="mb-3 flex items-center gap-2 font-medium text-navy-dark"><History className="h-4 w-4" />{t.edited.history} <span className="text-xs font-normal text-muted">({t.edited.count(revisions.length)})</span></p>{list}</div></div>}
    {open && !hover && createPortal(<div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={t.edited.history}>
      <div className="absolute inset-0 animate-fade-in bg-black/45" onClick={() => setOpen(false)} />
      <div className="relative max-h-[80vh] w-full animate-slide-up overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-md sm:animate-scale-in sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between"><p className="flex items-center gap-2 font-display text-lg font-medium text-navy-dark"><History className="h-5 w-5" />{t.edited.history}</p>
          <button onClick={() => setOpen(false)} aria-label={t.common.close} className="grid h-9 w-9 place-items-center rounded-full hover:bg-gray-light"><X className="h-5 w-5" /></button></div>
        <p className="mb-4 text-xs text-muted">{t.edited.count(revisions.length)}</p>{list}</div></div>, document.body)}
  </span>);
}
