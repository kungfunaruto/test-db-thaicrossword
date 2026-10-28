import { Link } from 'react-router-dom';
import { CalendarDays, MapPin, Trophy } from 'lucide-react';
import type { EventRow } from '../../types/db';
import { GAME_LABEL, STATUS_LABEL, STATUS_STYLE, dateRange, nb, thDateShort } from '../../utils/labels';
import { PinBadge } from '../news/NewsCard';
export const StatusBadge = ({ s }: { s: string }) => <span className={`whitespace-nowrap rounded px-1.5 py-0.5 text-xs font-medium sm:px-2 ${STATUS_STYLE[s] ?? ''}`}>{STATUS_LABEL[s] ?? s}</span>;
export default function EventCard({ e, row = false }: { e: EventRow; row?: boolean }) {
  return (<li className={`group relative flex overflow-hidden rounded-lg border bg-white shadow-card transition duration-200 sm:flex-col sm:hover:-translate-y-0.5 sm:hover:shadow-lg ${e.is_pinned ? 'border-gold' : 'border-slate-200'} ${row ? 'sm:w-64 sm:shrink-0 sm:snap-start' : ''}`}>
    <div className="h-[88px] w-[88px] shrink-0 overflow-hidden bg-gradient-to-br from-blue-light to-slate-200 sm:aspect-video sm:h-auto sm:w-full">
      {e.image_url ? <img src={e.image_url} alt="" loading="lazy" className="h-full w-full object-cover transition duration-300 sm:group-hover:scale-105" /> :
        <div className="grid h-full place-items-center text-navy/30" aria-hidden="true"><Trophy className="h-8 w-8 sm:h-12 sm:w-12" /></div>}</div>
    <div className="flex min-w-0 flex-1 flex-col p-2.5 sm:p-5">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">{e.is_pinned && <PinBadge />}<StatusBadge s={e.competition_status} /><span className="hidden text-xs text-muted sm:inline">{GAME_LABEL[e.game_type] ?? e.game_type}</span></div>
      <h3 className="mt-1 line-clamp-2 text-base sm:mt-3 sm:text-lg"><Link to={`/events/${e.id}`} className="max-sm:after:absolute max-sm:after:inset-0">{nb(e.title)}</Link></h3>
      <p className="mt-1 flex items-start gap-1.5 text-xs text-muted sm:mt-2 sm:text-sm"><CalendarDays className="mt-1 h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
        <span className="sm:hidden">{thDateShort(e.start_date)}{e.end_date && e.end_date !== e.start_date ? ` – ${thDateShort(e.end_date)}` : ''}</span><span className="hidden sm:inline">{dateRange(e.start_date, e.end_date)}</span></p>
      {e.venue && <p className="hidden items-start gap-1.5 text-sm text-muted sm:flex"><MapPin className="mt-1 h-4 w-4 shrink-0" />{nb(e.venue)}</p>}
      <Link to={`/events/${e.id}`} className="mt-auto hidden pt-4 font-medium text-navy hover:text-gold sm:block">ดูรายละเอียด →</Link></div></li>);
}
