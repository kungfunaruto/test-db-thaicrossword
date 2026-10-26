import { Link } from 'react-router-dom';
import { CalendarDays, MapPin, Trophy } from 'lucide-react';
import type { EventRow } from '../../types/db';
import { nb, GAME_LABEL, STATUS_LABEL, STATUS_STYLE, dateRange } from '../../utils/labels';
export const StatusBadge = ({ s }: { s: string }) => <span className={`whitespace-nowrap rounded px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[s] ?? ''}`}>{STATUS_LABEL[s] ?? s}</span>;
export default function EventCard({ e }: { e: EventRow }) {
  return (<li className="group flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-lg">
    <div className="aspect-video overflow-hidden bg-gradient-to-br from-blue-light to-slate-200">
      {e.image_url ? <img src={e.image_url} alt={e.title} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" /> :
        <div className="grid h-full place-items-center text-navy/30" aria-hidden="true"><Trophy className="h-12 w-12" /></div>}</div>
    <div className="flex flex-1 flex-col p-5">
      <div className="flex items-center justify-between gap-2"><StatusBadge s={e.competition_status} /><span className="text-xs text-muted">{GAME_LABEL[e.game_type] ?? e.game_type}</span></div>
      <h3 className="mt-3 text-lg">{nb(e.title)}</h3>
      <p className="mt-2 flex items-start gap-1.5 text-sm text-muted"><CalendarDays className="mt-1 h-4 w-4 shrink-0" />{dateRange(e.start_date, e.end_date)}</p>
      {e.venue && <p className="flex items-start gap-1.5 text-sm text-muted"><MapPin className="mt-1 h-4 w-4 shrink-0" />{nb(e.venue)}</p>}
      <Link to={`/events/${e.id}`} className="mt-auto pt-4 font-medium text-navy hover:text-gold">ดูรายละเอียด →</Link></div></li>);
}
