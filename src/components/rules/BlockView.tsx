import { Check, ExternalLink, Info, TriangleAlert } from 'lucide-react';
import type { Block } from '../../content/rules/types';
import { nb } from '../../utils/labels';
import ToolBlock from './ToolBlocks';
import FormatsBlock from './FormatsBlock';

export default function BlockView({ b, accent }: { b: Block; accent: string }) {
  switch (b.t) {
    case 'h': return <h3 className="mb-1 mt-8 flex items-center gap-2 font-sans text-lg font-semibold text-navy"><span className="h-5 w-1 rounded-full" style={{ background: accent }} />{nb(b.text)}</h3>;
    case 'p': return <p className="mt-3 leading-8 first:mt-0">{nb(b.text)}</p>;
    case 'ul': return <ul className="mt-3 space-y-2.5">{b.items.map((i, n) => <li key={n} className="flex gap-3"><span className="mt-1.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-white" style={{ background: accent }}><Check className="h-3 w-3" strokeWidth={3} /></span><span>{nb(i)}</span></li>)}</ul>;
    case 'ol': return <ol className="mt-3 space-y-3">{b.items.map((i, n) => <li key={n} className="flex gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-sm font-semibold text-white shadow-sm" style={{ background: accent }}>{n + 1}</span><span className="pt-0.5">{nb(i)}</span></li>)}</ol>;
    case 'cards': return (<div className="mt-4 grid gap-3 sm:grid-cols-2">{b.items.map((c, n) => (<div key={n} className="flex gap-3 rounded-xl border border-line bg-gray-light/70 p-4 transition hover:border-slate-300 hover:bg-white hover:shadow-card">
      {c.color && <span className="mt-1 h-8 w-8 shrink-0 rounded-lg shadow-inner ring-1 ring-black/10" style={{ background: c.color }} aria-hidden="true" />}
      <div className="min-w-0"><p className="font-semibold text-navy-dark">{nb(c.title)}</p><p className="mt-1 text-sm text-muted">{nb(c.text)}</p></div></div>))}</div>);
    case 'table': return (<>
      <div className="mt-4 hidden overflow-x-auto rounded-xl border border-line sm:block"><table className="w-full text-left text-sm">
        <thead className="bg-navy-dark text-white"><tr>{b.head.map((x, n) => <th key={n} className="p-3 font-medium">{nb(x)}</th>)}</tr></thead>
        <tbody>{b.rows.map((r, i) => <tr key={i} className="border-t border-line align-top transition even:bg-gray-light hover:bg-blue-light/60">{r.map((c, j) => <td key={j} className={`whitespace-pre-line p-3 ${j === 0 ? 'font-medium text-navy-dark' : ''}`}>{nb(c)}</td>)}</tr>)}</tbody></table></div>
      <ul className="mt-4 space-y-3 sm:hidden">{b.rows.map((r, i) => (<li key={i} className="rounded-xl border border-line bg-gray-light p-4">
        <p className="font-semibold text-navy-dark">{nb(r[0])}</p>
        <dl className="mt-2 space-y-2 text-sm">{r.slice(1).map((c, j) => <div key={j}><dt className="text-xs font-medium text-muted">{nb(b.head[j + 1])}</dt><dd className="whitespace-pre-line">{nb(c)}</dd></div>)}</dl></li>))}</ul></>);
    case 'tool': return <ToolBlock tool={b.tool} accent={accent} />;
    case 'formats': return <FormatsBlock items={b.items} accent={accent} />;
    case 'links': return <ul className="mt-3 space-y-1.5 text-sm">{b.items.map((l, n) => <li key={n}><a href={l.url} target="_blank" rel="noopener noreferrer" className="link-underline inline-flex items-center gap-1 text-navy">{l.label}<ExternalLink className="h-3.5 w-3.5" /></a></li>)}</ul>;
    case 'note': { const w = b.tone === 'warn'; const Icon = w ? TriangleAlert : Info;
      return <div className={`mt-4 flex gap-3 rounded-xl border p-4 text-sm ${w ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-blue-100 bg-blue-light text-navy-dark'}`}><Icon className="mt-0.5 h-5 w-5 shrink-0" /><p>{nb(b.text)}</p></div>; }
  }
}
