import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Calculator, Grid3x3, LayoutGrid, Medal, MessageSquareQuote, Newspaper, Trophy, type LucideIcon } from 'lucide-react';
import Th from '../components/common/Th';
import FloatingTiles from '../components/common/FloatingTiles';
import { fetchHomeEvents, fetchHomeNews, HOME_EVENTS_KEY, HOME_NEWS_KEY } from '../services/publicService';
import { useQuery, type QueryState } from '../lib/query';
import { usePageMeta } from '../hooks/usePublic';
import { useLang } from '../i18n';
import NewsCard from '../components/news/NewsCard';
import EventCard from '../components/events/EventCard';
import CardRow from '../components/common/CardRow';
import SectionTitle from '../components/common/SectionTitle';
import Leaderboard from '../components/rankings/Leaderboard';
import { CardSkeletons, EmptyState, ErrorState } from '../components/common/States';
import { Logo } from '../components/layout/MainLayout';
import { GAME_COLOR, GAME_SLUG, RANKED_GAMES } from '../utils/labels';
import { prefetchRoute } from '../lib/prefetch';

const GAMES: [string, LucideIcon][] = [['crossword', LayoutGrid], ['a_math', Calculator], ['kumkom', MessageSquareQuote], ['sudoku', Grid3x3]];

function Row<T extends { id: string }>({ q, empty, label, render }: { q: QueryState<T[]>; empty: string; label: string; render: (x: T, i: number) => JSX.Element }) {
  if (q.error) return <ErrorState onRetry={q.refetch} />;
  if (!q.data) return <CardSkeletons count={4} row />;
  if (q.data.length === 0) return <EmptyState text={empty} />;
  return <CardRow label={label}>{q.data.map(render)}</CardRow>;
}

export default function HomePage() {
  const { t } = useLang();
  usePageMeta(t.nav.home, t.site.metaDesc);
  const news = useQuery(HOME_NEWS_KEY, () => fetchHomeNews());
  const events = useQuery(HOME_EVENTS_KEY, () => fetchHomeEvents());
  return (<>
    <section className="relative overflow-hidden bg-gradient-to-br from-navy-deep via-navy-dark to-navy text-white">
      <div className="grid-pattern absolute inset-0" aria-hidden="true" /><div className="hero-glow absolute inset-0" aria-hidden="true" />
      <FloatingTiles className="hidden lg:block" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-20 pt-12 md:grid-cols-[1fr_auto] md:pb-28 md:pt-20">
        <div>
          <p className="inline-flex animate-fade-up items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium tracking-wide text-gold ring-1 ring-white/15"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold" />{t.home.kicker}</p>
          <h1 className="mt-4 max-w-3xl animate-fade-up text-3xl leading-[1.35] text-white md:text-5xl md:leading-[1.3]" style={{ animationDelay: '60ms' }}><Th parts={t.site.parts} /></h1>
          <p className="mt-5 max-w-2xl animate-fade-up text-lg text-slate-200" style={{ animationDelay: '120ms' }}><Th parts={t.home.lead} /></p>
          <div className="mt-8 flex animate-fade-up flex-wrap gap-3" style={{ animationDelay: '180ms' }}>
            <Link to="/events" onMouseEnter={() => prefetchRoute('/events')} className="btn-gold"><Trophy className="h-4 w-4" />{t.home.ctaEvents}</Link>
            <Link to="/news" onMouseEnter={() => prefetchRoute('/news')} className="btn-ghost-light"><Newspaper className="h-4 w-4" />{t.home.ctaNews}</Link></div></div>
        <div className="relative mx-auto hidden animate-fade-in md:block" aria-hidden="true">
          <div className="absolute inset-[-14%] animate-spin-slow rounded-full border border-dashed border-gold/30" />
          <div className="absolute inset-[-4%] rounded-full bg-gold/15 blur-3xl" />
          <Logo className="relative h-56 drop-shadow-[0_18px_40px_rgba(0,0,0,.45)] lg:h-64" /></div></div>
      <svg className="absolute -bottom-px left-0 w-full text-surface" viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true"><path fill="currentColor" d="M0 60h1440V24C1180 58 940 4 700 16S220 52 0 20z" /></svg>
    </section>

    <section className="mx-auto max-w-6xl px-4 pt-12 md:pt-16"><SectionTitle title={t.home.latestNews} icon={<Newspaper className="h-5 w-5" />} to="/news" more={t.home.allNews} onIntent={() => prefetchRoute('/news')} />
      <Row q={news} label={t.home.latestNews} empty={t.home.emptyNews} render={(n, i) => <NewsCard key={n.id} n={n} row index={i} />} /></section>

    <section className="mt-16 bg-gradient-to-b from-white to-surface py-16"><div className="mx-auto max-w-6xl px-4">
      <SectionTitle title={t.home.competitions} icon={<Trophy className="h-5 w-5" />} to="/events" more={t.home.allCompetitions} onIntent={() => prefetchRoute('/events')} />
      <Row q={events} label={t.home.competitions} empty={t.home.emptyEvents} render={(e, i) => <EventCard key={e.id} e={e} row index={i} />} /></div></section>

    <section className="mx-auto max-w-6xl px-4 pt-12"><SectionTitle title={t.home.rankingsTitle} sub={t.home.rankingsSub} icon={<Medal className="h-5 w-5" />} />
      <div className="grid gap-6 md:grid-cols-2">{RANKED_GAMES.map(g => <Leaderboard key={g} game={g} />)}</div></section>

    <section className="mx-auto max-w-6xl px-4 pt-16"><SectionTitle title={t.home.gamesTitle} sub={t.home.gamesSub} icon={<BookOpen className="h-5 w-5" />} to="/games" more={t.home.allGames} onIntent={() => prefetchRoute('/games')} />
      <ul className="stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{GAMES.map(([code, Icon], i) => { const to = GAME_SLUG[code] ? `/games/${GAME_SLUG[code]}` : '/games'; return (
        <li key={code} style={{ ['--i' as string]: i }}><Link to={to} onMouseEnter={() => prefetchRoute(to)} className="group card relative flex h-full flex-col overflow-hidden p-6 transition duration-300 hover:-translate-y-1 hover:shadow-lift">
          <span className="absolute inset-x-0 top-0 h-1.5 origin-left scale-x-50 transition duration-500 group-hover:scale-x-100" style={{ background: GAME_COLOR[code] }} />
          <span className="grid h-14 w-14 place-items-center rounded-2xl text-white shadow-md transition duration-300 group-hover:rotate-[-6deg] group-hover:scale-110" style={{ background: GAME_COLOR[code] }}><Icon className="h-7 w-7" /></span>
          <span className="mt-4 font-display text-xl font-medium text-navy-dark">{t.games[code]}</span>
          <span className="mt-1 flex-1 text-sm text-muted">{t.home.gameDesc[code]}</span>
          <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-navy">{GAME_SLUG[code] ? t.home.viewRules : t.home.allGames}<ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span></Link></li>); })}</ul></section>
  </>);
}
