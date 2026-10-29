import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, Images, Newspaper, Pin } from 'lucide-react';
import type { NewsCardRow } from '../../types/db';
import { loc, useLang } from '../../i18n';
import { nb } from '../../utils/labels';
import { fmtDate } from '../../lib/dates';
import { prefetchNews } from '../../lib/prefetch';
import SmartImage from '../common/SmartImage';

export const PinBadge = ({ label }: { label: string }) => <span className="chip bg-gold text-navy-deep shadow-sm"><Pin className="h-3 w-3" aria-hidden="true" />{label}</span>;
export const CATEGORY_STYLE: Record<string, string> = { general: 'bg-blue-light text-navy', competition: 'bg-orange-50 text-orange-800' };

/** `compact` = home-page rows: a lower image so the card is shorter. */
export function CardImage({ images, Icon, children, compact = false }: { images: string[]; Icon: typeof Newspaper; children?: React.ReactNode; compact?: boolean }) {
  return (<div className={`relative min-h-24 w-24 shrink-0 self-stretch overflow-hidden sm:h-auto sm:w-full sm:self-auto ${compact ? 'sm:aspect-[2/1]' : 'sm:aspect-[16/10]'}`}>
    {images[0] ? <SmartImage src={images[0]} className="h-full w-full transition-transform duration-500" zoom /> :
      <div className="grid h-full w-full place-items-center bg-gradient-to-br from-navy via-navy-dark to-navy-deep text-gold/60" aria-hidden="true">
        <div className="grid-pattern absolute inset-0 opacity-60" /><Icon className="relative h-8 w-8 transition duration-500 group-hover:scale-110 sm:h-12 sm:w-12" /></div>}
    {images.length > 1 && <span className="absolute bottom-1.5 right-1.5 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur sm:bottom-2.5 sm:right-2.5">
      <Images className="h-3 w-3" aria-hidden="true" />{images.length}</span>}
    {children}</div>);
}

/** Whole card is one link. Fixed-height title/excerpt areas keep every card the same size however long the text is. */
export default function NewsCard({ n, row = false, index = 0 }: { n: NewsCardRow; row?: boolean; index?: number }) {
  const { t, lang } = useLang();
  const title = loc(n, 'title', lang), excerpt = loc(n, 'excerpt', lang);
  return (<li style={{ ['--i' as string]: index }} className={row ? 'sm:w-72 sm:shrink-0 sm:snap-start' : ''}>
    <Link to={`/news/${n.id}`} onMouseEnter={() => prefetchNews(n.id)} onFocus={() => prefetchNews(n.id)} onTouchStart={() => prefetchNews(n.id)}
      className={`group card flex h-full overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-lift sm:flex-col ${n.is_pinned ? 'border-gold/70 ring-1 ring-gold/40' : ''}`}>
      <CardImage images={n.images} Icon={Newspaper} compact={row}>{n.is_pinned && <span className="absolute left-2.5 top-2.5 hidden sm:block"><PinBadge label={t.common.pinned} /></span>}</CardImage>
      <div className={`flex min-w-0 flex-1 flex-col p-3 ${row ? 'sm:p-4' : 'sm:p-5'}`}>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          {n.is_pinned && <Pin className="h-3.5 w-3.5 text-gold-dark sm:hidden" aria-label={t.common.pinned} />}
          <span className={`chip ${CATEGORY_STYLE[n.category] ?? 'bg-blue-light text-navy'}`}>{t.news.categories[n.category] ?? n.category}</span>
          <span className="inline-flex items-center gap-1 text-muted"><CalendarDays className="h-3.5 w-3.5" />{fmtDate(n.published_at, lang, 'medium')}</span></div>
        <h3 className={`mt-1.5 line-clamp-2 text-[15px] font-semibold leading-6 text-navy-dark transition group-hover:text-navy ${row ? 'sm:mt-2 sm:min-h-[3.2rem] sm:text-base sm:leading-[1.6rem]' : 'sm:mt-3 sm:min-h-[3.8rem] sm:text-lg sm:leading-[1.9rem]'}`}>{nb(title)}</h3>
        <p className={`hidden text-sm text-muted sm:block ${row ? 'mt-1 min-h-[1.6rem]' : 'mt-1.5 min-h-[3.2rem]'}`}><span className={row ? 'line-clamp-1' : 'line-clamp-2'}>{excerpt ? nb(excerpt) :' '}</span></p>
        <span className={`mt-auto hidden items-center gap-1 text-sm font-medium text-navy sm:inline-flex ${row ? 'pt-2' : 'pt-4'}`}>{t.common.readMore}<ArrowRight className="h-4 w-4 transition duration-300 group-hover:translate-x-1" /></span>
      </div></Link></li>);
}
