import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
export default function SectionTitle({ title, to, more }: { title: string; to?: string; more?: string }) {
  return (<div className="mb-8 flex flex-wrap items-end justify-between gap-3">
    <div><h2 className="text-2xl md:text-3xl">{title}</h2><span className="mt-2 block h-1 w-14 rounded bg-gold" /></div>
    {to && <Link to={to} className="inline-flex items-center gap-1 whitespace-nowrap font-medium text-navy hover:text-gold">{more}<ArrowRight className="h-4 w-4" /></Link>}</div>);
}
