import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, Clock, MapPin, Pin, Trophy } from 'lucide-react';
import type { CompetitionStatus, EventCardRow } from '../../types/db';
import { loc, useLang } from '../../i18n';
import { nb, STATUS_DOT, STATUS_STYLE } from '../../utils/labels';
import { bangkokToday, dateParts, daysBetween, fmtDate, fmtRange } from '../../lib/dates';
import { competitionStatus } from '../../services/publicService';
import { prefetchEvent } from '../../lib/prefetch';
import { CardImage, PinBadge } from '../news/NewsCard';

export function StatusBadge({ s, className = '' }: { s: CompetitionStatus; className?: string }) {
  const { t } = useLang();
  return <span className={`chip ${STATUS_STYLE[s]} ${className}`}><span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[s]} ${s === 'open' ? 'animate-pulse' : ''}`} />{t.events.status[s]}</span>;
}
export function GameChips({ games, max = Infinity }: { games: string[]; max?: number }) {
  const { t } = useLang();
  return <>{games.slice(0, max).map(g => <span key={g} className="chip bg-gray-light text-ink/80 ring-1 ring-line">{t.games[g] ?? g}</span>)}</>;
}

export default function EventCard({ e, row = false, index = 0 }: { e: EventCardRow; row?: boolean; index?: number }) {
  const { t, lang } = useLang();
  const today = bangkokToday(); const s = competitionStatus(e, today);
  const title = loc(e, 'title', lang), venue = loc(e, 'venue', lang); const dp = dateParts(e.start_date, lang);
  return (<li style={{ ['--i' as string]: index }} className={row ? 'sm:w-72 sm:shrink-0 sm:snap-start' : ''}>
    <Link to={`/events/${e.id}`} onMouseEnter={() => prefetchEvent(e.id)} onFocus={() => prefetchEvent(e.id)} onTouchStart={() => prefetchEvent(e.id)}
      className={`group card flex h-full overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-lift sm:flex-col ${e.is_pinned ? 'border-gold/70 ring-1 ring-gold/40' : ''}`}>
      <CardImage images={e.images} Icon={Trophy} compact={row}>
        <span className="absolute left-2.5 top-2.5 hidden flex-col items-center rounded-xl bg-white/95 px-2.5 py-1 text-center leading-none text-navy-dark shadow-md backdrop-blur sm:flex">
          <span className="font-display text-xl font-semibold leading-6">{dp.day}</span><span className="text-[11px] font-medium uppercase leading-4 text-muted">{dp.month}</span></span>
        {e.is_pinned && <span className="absolute right-2.5 top-2.5 hidden sm:block"><PinBadge label={t.common.pinned} /></span>}</CardImage>
      <div className={`flex min-w-0 flex-1 flex-col p-3 ${row ? 'sm:p-4' : 'sm:p-5'}`}>
        {/* status on its own line; every game on the next line */}
        <div className="flex items-center gap-1.5">{e.is_pinned && <Pin className="h-3.5 w-3.5 text-gold-dark sm:hidden" aria-label={t.common.pinned} />}<StatusBadge s={s} /></div>
        {e.games.length > 0 && <div className="mt-1.5 flex flex-wrap gap-1"><GameChips games={e.games} /></div>}
        <h3 className={`mt-1.5 line-clamp-2 text-[15px] font-semibold leading-6 text-navy-dark transition group-hover:text-navy ${row ? 'sm:mt-2 sm:min-h-[3.2rem] sm:text-base sm:leading-[1.6rem]' : 'sm:mt-3 sm:min-h-[3.8rem] sm:text-lg sm:leading-[1.9rem]'}`}>{nb(title)}</h3>
        <p className={`mt-1 flex items-start gap-1.5 text-xs text-muted sm:text-sm ${row ? 'sm:mt-1' : 'sm:mt-2'}`}><CalendarDays className="mt-[3px] h-3.5 w-3.5 shrink-0 sm:mt-1 sm:h-4 sm:w-4" />
          <span className="sm:hidden">{fmtRange(e.start_date, e.end_date, lang, 'medium')}</span><span className="hidden sm:inline">{fmtRange(e.start_date, e.end_date, lang)}</span></p>
        {!row && <p className="hidden min-h-[1.6rem] items-start gap-1.5 text-sm text-muted sm:flex">{venue && <><MapPin className="mt-1 h-4 w-4 shrink-0" /><span className="truncate">{nb(venue)}</span></>}</p>}
        {s === 'open' && <p className="mt-1 hidden items-center gap-1.5 text-xs font-medium text-emerald-700 sm:flex"><Clock className="h-3.5 w-3.5" />{t.events.deadline} {fmtDate(e.reg_close, lang, 'medium')} · {t.events.daysLeft(daysBetween(today, e.reg_close))}</p>}
        {!row && <span className="mt-auto hidden items-center gap-1 pt-4 text-sm font-medium text-navy sm:inline-flex">{t.common.viewDetails}<ArrowRight className="h-4 w-4 transition duration-300 group-hover:translate-x-1" /></span>}
      </div></Link></li>);
}
