import { Link } from 'react-router-dom';
import { CalendarDays, Newspaper } from 'lucide-react';
import type { NewsRow } from '../../types/db';
import { nb, thDate } from '../../utils/labels';
export default function NewsCard({ n }: { n: NewsRow }) {
  return (<li className="group flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-lg">
    <div className="aspect-video overflow-hidden bg-gradient-to-br from-blue-light to-slate-200">
      {n.image_url ? <img src={n.image_url} alt={n.title} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" /> :
        <div className="grid h-full place-items-center text-navy/30" aria-hidden="true"><Newspaper className="h-12 w-12" /></div>}</div>
    <div className="flex flex-1 flex-col p-5">
      <div className="flex flex-wrap items-center gap-2 text-xs"><span className="rounded bg-blue-light px-2 py-0.5 font-medium text-navy">{n.category}</span>
        <span className="inline-flex items-center gap-1 text-muted"><CalendarDays className="h-3.5 w-3.5" />{thDate(n.published_at)}</span></div>
      <h3 className="mt-3 text-lg">{nb(n.title)}</h3>{n.excerpt && <p className="mt-2 line-clamp-3 text-sm text-muted">{nb(n.excerpt)}</p>}
      <Link to={`/news/${n.id}`} className="mt-auto pt-4 font-medium text-navy hover:text-gold">อ่านต่อ →</Link></div></li>);
}
