import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/** Right-side panel for add/edit forms (full screen on phones). */
export function Drawer({ title, badge, onClose, children, footer, busy }: { title: string; badge?: ReactNode; onClose: () => void; children: ReactNode; footer: ReactNode; busy?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !busy) onClose(); };
    window.addEventListener('keydown', onKey); const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose, busy]);
  return createPortal(<div className="fixed inset-0 z-50 flex justify-end">
    <div className="absolute inset-0 animate-fade-in bg-navy-deep/50 backdrop-blur-[2px]" onClick={busy ? undefined : onClose} />
    <div role="dialog" aria-modal="true" aria-label={title} className="relative flex h-full w-full max-w-5xl animate-[toast-in_.3s_cubic-bezier(.2,.8,.2,1)_both] flex-col bg-surface shadow-2xl">
      <header className="flex items-center justify-between gap-3 border-b border-line bg-white px-5 py-4"><div className="flex min-w-0 items-center gap-3"><h2 className="truncate font-sans text-xl font-semibold">{title}</h2>{badge}</div>
        <button onClick={onClose} disabled={busy} aria-label="ปิด" className="grid h-9 w-9 shrink-0 place-items-center rounded-full hover:bg-gray-light"><X className="h-5 w-5" /></button></header>
      <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
      <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-white px-5 py-3">{footer}</footer></div></div>, document.body);
}
export function Field({ label, required, hint, error, children, htmlFor }: { label: ReactNode; required?: boolean; hint?: ReactNode; error?: string; children: ReactNode; htmlFor?: string }) {
  return (<div><label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-ink">{label}{required && <span className="text-red-600"> *</span>}</label>{children}
    {hint && !error && <p className="mt-1 text-xs text-muted">{hint}</p>}{error && <p role="alert" className="mt-1 animate-fade-in text-sm text-red-700">{error}</p>}</div>);
}
export const Panel = ({ title, children, className = '' }: { title?: ReactNode; children: ReactNode; className?: string }) => (
  <section className={`card space-y-4 p-5 ${className}`}>{title && <h3 className="font-sans text-sm font-semibold uppercase tracking-wide text-muted">{title}</h3>}{children}</section>);

const PUB_STYLE: Record<string, [string, string]> = {
  published: ['เผยแพร่', 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'], draft: ['ฉบับร่าง', 'bg-slate-100 text-slate-600 ring-slate-500/20'],
  archived: ['จัดเก็บ', 'bg-slate-100 text-slate-600 ring-slate-500/20'], new: ['ใหม่', 'bg-orange-50 text-orange-700 ring-orange-600/20'], answered: ['ตอบแล้ว', 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'] };
export const PubBadge = ({ s }: { s: string }) => { const [label, cls] = PUB_STYLE[s] ?? [s, 'bg-slate-100']; return <span className={`chip ring-1 ${cls}`}><span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />{label}</span>; };

/** Small pill switcher for admin forms. */
export function Pills<T extends string>({ value, onChange, options, id }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; id?: string }) {
  return (<div id={id} role="group" className="flex flex-wrap gap-2">{options.map(o => <button key={o.value} type="button" aria-pressed={o.value === value} onClick={() => onChange(o.value)}
    className={`rounded-full border px-4 py-1.5 text-sm font-medium transition active:scale-95 ${o.value === value ? 'border-navy bg-navy text-white shadow' : 'border-line bg-white text-ink hover:border-navy/40'}`}>{o.label}</button>)}</div>);
}
export function Chips({ value, onChange, options }: { value: string[]; onChange: (v: string[]) => void; options: { value: string; label: string }[] }) {
  const toggle = (v: string) => onChange(value.includes(v) ? value.filter(x => x !== v) : [...value, v]);
  return (<div role="group" className="flex flex-wrap gap-2">{options.map(o => { const on = value.includes(o.value); return (
    <button key={o.value} type="button" aria-pressed={on} onClick={() => toggle(o.value)}
      className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition active:scale-95 ${on ? 'border-navy bg-navy text-white shadow' : 'border-line bg-white text-ink hover:border-navy/40'}`}>
      <span className={`grid h-4 w-4 place-items-center rounded-full border text-[10px] ${on ? 'border-gold bg-gold text-navy-deep' : 'border-slate-300'}`}>{on ? '✓' : ''}</span>{o.label}</button>); })}</div>);
}
export const AdminHeader = ({ title, sub, action }: { title: string; sub?: ReactNode; action?: ReactNode }) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-2xl md:text-3xl">{title}</h1>{sub && <p className="mt-1 text-sm text-muted">{sub}</p>}</div>{action}</div>);
