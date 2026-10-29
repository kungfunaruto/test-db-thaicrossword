import { ChevronDown } from 'lucide-react';
import type { FormatItem } from '../../content/rules/types';
import { nb } from '../../utils/labels';
import { useLang } from '../../i18n';

const ROWS: (keyof FormatItem)[] = ['how', 'pairing', 'example', 'useWhen'];
export default function FormatsBlock({ items, accent }: { items: FormatItem[]; accent: string }) {
  const { t } = useLang();
  return (<ul className="mt-4 grid gap-3 lg:grid-cols-2">{items.map((f, i) => (<li key={f.name}><details className="group h-full rounded-xl border border-line bg-white transition open:border-gold open:shadow-card hover:border-slate-300">
    <summary className="flex cursor-pointer list-none items-start gap-3 p-4 [&::-webkit-details-marker]:hidden">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-sm font-semibold text-white shadow-sm transition group-open:rotate-[-8deg]" style={{ background: accent }}>{i + 1}</span>
      <span className="min-w-0 flex-1"><span className="block font-semibold text-navy-dark">{nb(f.name)}{f.alias && <span className="ml-2 text-sm font-normal text-muted">{nb(f.alias)}</span>}</span><span className="block text-sm text-muted">{nb(f.summary)}</span></span>
      <ChevronDown className="mt-1 h-5 w-5 shrink-0 text-navy transition duration-300 group-open:rotate-180" /></summary>
    <dl className="animate-slide-down space-y-3 border-t border-line p-4 text-sm">{ROWS.map(k => f[k] ? (<div key={k} className={k === 'example' ? 'rounded-lg bg-blue-light p-3' : ''}><dt className="text-xs font-semibold text-muted">{t.rules.formatRows[k]}</dt><dd className="mt-0.5">{nb(f[k] as string)}</dd></div>) : null)}</dl>
  </details></li>))}</ul>);
}
