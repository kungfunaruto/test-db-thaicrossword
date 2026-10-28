import { ChevronDown } from 'lucide-react';
import type { FormatItem } from '../../content/rules/types';
import { nb } from '../../utils/labels';

const rows: [keyof FormatItem, string][] = [['how', 'ทำงานอย่างไร'], ['pairing', 'จับคู่อย่างไร'], ['example', 'ตัวอย่าง'], ['useWhen', 'ใช้เมื่อไร']];
export default function FormatsBlock({ items, accent }: { items: FormatItem[]; accent: string }) {
  return (<ul className="mt-4 space-y-3">{items.map((f, i) => (<li key={f.name}><details className="group rounded-lg border border-slate-200 bg-white open:border-gold open:shadow-card">
    <summary className="flex cursor-pointer list-none items-start gap-3 p-4 [&::-webkit-details-marker]:hidden">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-semibold text-white" style={{ background: accent }}>{i + 1}</span>
      <span className="min-w-0 flex-1"><span className="block font-semibold text-navy-dark">{nb(f.name)}{f.alias && <span className="ml-2 text-sm font-normal text-muted">{nb(f.alias)}</span>}</span><span className="block text-sm text-muted">{nb(f.summary)}</span></span>
      <ChevronDown className="mt-1 h-5 w-5 shrink-0 text-navy transition group-open:rotate-180" /></summary>
    <dl className="space-y-3 border-t border-slate-100 p-4 text-sm">{rows.map(([k, label]) => f[k] ? (<div key={k} className={k === 'example' ? 'rounded-lg bg-blue-light p-3' : ''}><dt className="text-xs font-semibold text-muted">{label}</dt><dd className="mt-0.5">{nb(f[k] as string)}</dd></div>) : null)}</dl>
  </details></li>))}</ul>);
}
