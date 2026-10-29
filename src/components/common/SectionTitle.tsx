import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
export default function SectionTitle({ title, sub, to, more, icon, onIntent }: { title: string; sub?: string; to?: string; more?: string; icon?: ReactNode; onIntent?: () => void }) {
  return (<div className="mb-7 flex flex-wrap items-end justify-between gap-3">
    <div className="flex items-center gap-3">{icon && <span className="grid h-11 w-11 place-items-center rounded-xl bg-navy text-gold shadow-sm">{icon}</span>}
      <div><h2 className="text-2xl md:text-3xl">{title}</h2>{sub ? <p className="text-sm text-muted">{sub}</p> : <span className="mt-1.5 block h-1 w-12 rounded-full bg-gradient-to-r from-gold to-flame" />}</div></div>
    {to && <Link to={to} onMouseEnter={onIntent} onFocus={onIntent} onTouchStart={onIntent} className="group inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-line bg-white px-4 py-1.5 text-sm font-medium text-navy shadow-sm transition hover:border-gold hover:text-navy-dark">
      {more}<ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" /></Link>}</div>);
}
