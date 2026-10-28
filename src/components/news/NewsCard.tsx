import { Link } from 'react-router-dom';
import { CalendarDays, Newspaper, Pin } from 'lucide-react';
import type { NewsRow } from '../../types/db';
import { nb, thDate, thDateShort } from '../../utils/labels';
export const PinBadge = () => <span className="inline-flex items-center gap-1 rounded bg-gold/25 px-1.5 py-0.5 text-xs font-medium text-navy-dark"><Pin className="h-3 w-3" aria-hidden="true" />ปักหมุด</span>;
/** Phone: compact horizontal card (thumbnail, title, date). sm and up: the original vertical card. `row` = fixed-width card inside the horizontal carousel. */
export default function NewsCard({ n, row = false }: { n: NewsRow; row?: boolean }) {
  return (<li className={`group relative flex overflow-hidden rounded-lg border bg-white shadow-card transition duration-200 sm:flex-col sm:hover:-translate-y-0.5 sm:hover:shadow-lg ${n.is_pinned ? 'border-gold' : 'border-slate-200'} ${row ? 'sm:w-64 sm:shrink-0 sm:snap-start' : ''}`}>
    <div className="h-[88px] w-[88px] shrink-0 overflow-hidden bg-gradient-to-br from-blue-light to-slate-200 sm:aspect-video sm:h-auto sm:w-full">
      {n.image_url ? <img src={n.image_url} alt="" loading="lazy" className="h-full w-full object-cover transition duration-300 sm:group-hover:scale-105" /> :
        <div className="grid h-full place-items-center text-navy/30" aria-hidden="true"><Newspaper className="h-8 w-8 sm:h-12 sm:w-12" /></div>}</div>
    <div className="flex min-w-0 flex-1 flex-col p-2.5 sm:p-5">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">{n.is_pinned && <PinBadge />}<span className="rounded bg-blue-light px-1.5 py-0.5 font-medium text-navy sm:px-2">{n.category}</span>
        <span className="inline-flex items-center gap-1 text-muted"><CalendarDays className="h-3.5 w-3.5" /><span className="sm:hidden">{thDateShort(n.published_at)}</span><span className="hidden sm:inline">{thDate(n.published_at)}</span></span></div>
      <h3 className="mt-1 line-clamp-2 text-base sm:mt-3 sm:text-lg"><Link to={`/news/${n.id}`} className="max-sm:after:absolute max-sm:after:inset-0">{nb(n.title)}</Link></h3>
      {n.excerpt && <p className="mt-2 line-clamp-3 hidden text-sm text-muted sm:block">{nb(n.excerpt)}</p>}
      <Link to={`/news/${n.id}`} className="mt-auto hidden pt-4 font-medium text-navy hover:text-gold sm:block">อ่านต่อ →</Link></div></li>);
}
