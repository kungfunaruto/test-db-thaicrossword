import { ChevronDown } from 'lucide-react';
import type { FormatItem } from '../../content/rules/types';
import { nb } from '../../utils/labels';
import { useLang } from '../../i18n';

const ROWS: (keyof FormatItem)[] = ['how', 'pairing', 'example', 'useWhen'];

function Card({ f, n, accent }: { f: FormatItem; n: number; accent: string }) {
  const { t } = useLang();
  return (<li><details className="group rounded-xl border border-line bg-white transition open:border-gold open:shadow-card hover:border-slate-300">
    <summary className="flex cursor-pointer list-none items-start gap-3 p-4 [&::-webkit-details-marker]:hidden">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-sm font-semibold text-white shadow-sm transition group-open:rotate-[-8deg]" style={{ background: accent }}>{n}</span>
      <span className="min-w-0 flex-1"><span className="block font-semibold text-navy-dark">{nb(f.name)}{f.alias && <span className="ml-2 text-sm font-normal text-muted">{nb(f.alias)}</span>}</span><span className="block text-sm text-muted">{nb(f.summary)}</span></span>
      <ChevronDown className="mt-1 h-5 w-5 shrink-0 text-navy transition duration-300 group-open:rotate-180" /></summary>
    <dl className="animate-slide-down space-y-3 border-t border-line p-4 text-sm">{ROWS.map(k => f[k] ? (<div key={k} className={k === 'example' ? 'rounded-lg bg-blue-light p-3' : ''}><dt className="text-xs font-semibold text-muted">{t.rules.formatRows[k]}</dt><dd className="mt-0.5">{nb(f[k] as string)}</dd></div>) : null)}</dl>
  </details></li>);
}

/**
 * Phone/tablet: one list (1, 2, 3 …). Desktop: two independent columns (odd numbers left, even right, so each row still reads 1-2, 3-4 …).
 * Opening a card only grows its own column; the card beside it keeps its size.
 */
export default function FormatsBlock({ items, accent }: { items: FormatItem[]; accent: string }) {
  const numbered = items.map((f, i) => ({ f, n: i + 1 }));
  const col = (odd: boolean) => numbered.filter(x => (x.n % 2 === 1) === odd);
  return (<>
    <ul className="mt-4 space-y-3 lg:hidden">{numbered.map(x => <Card key={x.f.name} f={x.f} n={x.n} accent={accent} />)}</ul>
    <div className="mt-4 hidden items-start gap-3 lg:grid lg:grid-cols-2">{[true, false].map(odd => (
      <ul key={String(odd)} className="space-y-3">{col(odd).map(x => <Card key={x.f.name} f={x.f} n={x.n} accent={accent} />)}</ul>))}</div>
  </>);
}
