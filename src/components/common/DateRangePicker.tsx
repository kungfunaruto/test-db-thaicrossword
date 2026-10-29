import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useLang } from '../../i18n';
import type { DateRange } from '../../services/publicService';
import { addDays, bangkokToday, fmtDate, monthTitle, parseYmd, toYmd } from '../../lib/dates';

type Preset = { key: string; label: string; range: () => DateRange };
/**
 * Date-range filter: quick presets plus a one-month calendar (tap a start day, then an end day).
 * Desktop: dropdown panel. Phone: bottom sheet. Thai shows Buddhist-era years.
 */
export default function DateRangePicker({ value, onChange, future = false }: { value: DateRange | null; onChange: (r: DateRange | null) => void; future?: boolean }) {
  const { t, lang } = useLang();
  const [open, setOpen] = useState(false);
  const today = bangkokToday();
  const [month, setMonth] = useState(() => parseYmd((value?.from ?? today).slice(0, 8) + '01'));
  const [draft, setDraft] = useState<{ from: string | null; to: string | null }>({ from: value?.from ?? null, to: value?.to ?? null });
  const [hover, setHover] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);

  const presets: Preset[] = useMemo(() => {
    const y = today.slice(0, 4), m = today.slice(0, 7);
    const list: Preset[] = [
      { key: '7', label: t.date.last7, range: () => ({ from: addDays(today, -6), to: today }) },
      { key: '30', label: t.date.last30, range: () => ({ from: addDays(today, -29), to: today }) },
      { key: 'm', label: t.date.thisMonth, range: () => ({ from: `${m}-01`, to: toYmd(new Date(+y, +today.slice(5, 7), 0)) }) },
      { key: '90', label: t.date.last3m, range: () => ({ from: addDays(today, -89), to: today }) },
      { key: 'y', label: t.date.thisYear, range: () => ({ from: `${y}-01-01`, to: `${y}-12-31` }) }];
    if (future) list.splice(2, 0, { key: 'n30', label: t.date.next30, range: () => ({ from: today, to: addDays(today, 30) }) });
    return list;
  }, [t, today, future]);

  useEffect(() => {
    if (!open) return;
    setDraft({ from: value?.from ?? null, to: value?.to ?? null }); setMonth(parseYmd((value?.from ?? today).slice(0, 8) + '01'));
    const onDoc = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node) && window.matchMedia('(min-width: 640px)').matches) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc); window.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); window.removeEventListener('keydown', onKey); };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const label = value ? (value.from === value.to ? fmtDate(value.from, lang, 'medium') : `${fmtDate(value.from, lang, 'medium')} – ${fmtDate(value.to, lang, 'medium')}`) : t.date.any;
  const pick = (d: string) => {
    if (!draft.from || draft.to) setDraft({ from: d, to: null });
    else setDraft(d < draft.from ? { from: d, to: draft.from } : { from: draft.from, to: d });
  };
  const apply = (r: DateRange | null) => { onChange(r); setOpen(false); };
  const activePreset = value ? presets.find(p => { const r = p.range(); return r.from === value.from && r.to === value.to; })?.key : 'any';

  // calendar grid (weeks start on Sunday)
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = new Date(first); start.setDate(1 - first.getDay());
  const days = Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  const lo = draft.from, hi = draft.to ?? (draft.from && hover ? (hover > draft.from ? hover : draft.from) : null);
  const lo2 = draft.from && !draft.to && hover && hover < draft.from ? hover : lo;

  const panel = (<div className="flex flex-col gap-4 sm:flex-row">
    <div className="sm:w-40 sm:border-r sm:border-line sm:pr-4"><p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">{t.date.quick}</p>
      <div className="flex flex-wrap gap-2 sm:flex-col sm:gap-1">
        <button type="button" onClick={() => apply(null)} className={`rounded-lg px-3 py-1.5 text-left text-sm transition ${activePreset === 'any' ? 'bg-navy text-white' : 'bg-gray-light hover:bg-blue-light sm:bg-transparent'}`}>{t.date.any}</button>
        {presets.map(p => <button key={p.key} type="button" onClick={() => apply(p.range())} className={`rounded-lg px-3 py-1.5 text-left text-sm transition ${activePreset === p.key ? 'bg-navy text-white' : 'bg-gray-light hover:bg-blue-light sm:bg-transparent'}`}>{p.label}</button>)}</div></div>
    <div className="min-w-0 flex-1">
      <div className="mb-2 flex items-center justify-between">
        <button type="button" aria-label={t.date.prevMonth} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="grid h-9 w-9 place-items-center rounded-full hover:bg-blue-light"><ChevronLeft className="h-5 w-5" /></button>
        <p key={month.toISOString()} className="animate-fade-in font-display font-medium text-navy-dark">{monthTitle(month, lang)}</p>
        <button type="button" aria-label={t.date.nextMonth} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="grid h-9 w-9 place-items-center rounded-full hover:bg-blue-light"><ChevronRight className="h-5 w-5" /></button></div>
      <div className="grid grid-cols-7 text-center text-xs text-muted">{t.date.weekdays.map(w => <span key={w} className="py-1">{w}</span>)}</div>
      <div className="grid grid-cols-7 gap-y-1" onMouseLeave={() => setHover(null)}>{days.map(d => {
        const s = toYmd(d); const inMonth = d.getMonth() === month.getMonth();
        const isEdge = s === lo2 || s === hi || s === draft.from; const inRange = !!(lo2 && hi && s > lo2 && s < hi);
        return (<button key={s} type="button" onClick={() => pick(s)} onMouseEnter={() => setHover(s)} aria-pressed={isEdge} aria-label={fmtDate(s, lang)}
          className={`relative mx-auto grid h-9 w-full place-items-center text-sm transition ${inRange ? 'bg-navy/10' : ''} ${s === lo2 && hi && hi !== lo2 ? 'rounded-l-full bg-navy/10' : ''} ${s === hi && lo2 && hi !== lo2 ? 'rounded-r-full bg-navy/10' : ''}`}>
          <span className={`grid h-9 w-9 place-items-center rounded-full transition ${isEdge ? 'animate-pop bg-navy font-semibold text-white shadow' : inMonth ? 'text-ink hover:bg-blue-light' : 'text-slate-300 hover:bg-gray-light'} ${s === today && !isEdge ? 'ring-2 ring-gold' : ''}`}>{d.getDate()}</span></button>);
      })}</div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
        <p className="text-sm text-muted">{draft.from ? (draft.to ? `${fmtDate(draft.from, lang, 'medium')} – ${fmtDate(draft.to, lang, 'medium')}` : `${fmtDate(draft.from, lang, 'medium')} → ${t.date.pickEnd}`) : t.date.pickStart}</p>
        <div className="flex gap-2"><button type="button" className="btn-outline btn-sm" onClick={() => setOpen(false)}>{t.common.cancel}</button>
          <button type="button" className="btn-primary btn-sm" disabled={!draft.from} onClick={() => draft.from && apply({ from: draft.from, to: draft.to ?? draft.from })}>{t.common.apply}</button></div></div></div></div>);

  return (<div ref={box} className="relative">
    <div className={`inline-flex items-center rounded-xl border bg-white shadow-sm transition ${value ? 'border-navy/40 ring-4 ring-navy/5' : 'border-line'}`}>
      <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open} aria-haspopup="dialog" className="inline-flex items-center gap-2 whitespace-nowrap px-3.5 py-2.5 text-sm">
        <CalendarDays className="h-4 w-4 text-navy" /><span className="text-muted">{t.date.label}:</span><span className="font-medium text-navy-dark">{label}</span></button>
      {value && <button type="button" onClick={() => onChange(null)} aria-label={t.common.clear} className="mr-1.5 grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-gray-light hover:text-ink"><X className="h-4 w-4" /></button>}</div>
    {open && <>
      <div className="fixed inset-0 z-40 animate-fade-in bg-black/40 sm:hidden" onClick={() => setOpen(false)} />
      <div role="dialog" aria-label={t.date.label} className="fixed inset-x-0 bottom-0 z-50 max-h-[90vh] animate-slide-up overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:absolute sm:inset-x-auto sm:bottom-auto sm:left-0 sm:top-full sm:mt-2 sm:w-[560px] sm:animate-scale-in sm:rounded-2xl sm:border sm:border-line">
        <span className="mx-auto mb-3 block h-1.5 w-10 rounded-full bg-slate-200 sm:hidden" />{panel}</div></>}
  </div>);
}
