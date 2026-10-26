import { Link } from 'react-router-dom';
import { BookOpen, Calculator, Grid3x3, LayoutGrid, Medal, MessageSquareQuote, Newspaper, Trophy, type LucideIcon } from 'lucide-react';
import { nameParts } from '../config/site';
import Th from '../components/common/Th';
import { fetchLatestNews, fetchUpcomingEvents } from '../services/publicService';
import { useAsync, usePageMeta } from '../hooks/usePublic';
import NewsCard from '../components/news/NewsCard';
import EventCard from '../components/events/EventCard';
import SectionTitle from '../components/common/SectionTitle';
import { EmptyState, ErrorState, LoadingState } from '../components/common/States';
import { GAME_LABEL, RANKED_GAMES } from '../utils/labels';

const quick: { to: string; label: string; sub: string; Icon: LucideIcon }[] = [
  { to: '/news', label: 'ข่าวประชาสัมพันธ์', sub: 'ข่าวสารและประกาศล่าสุด', Icon: Newspaper },
  { to: '/events', label: 'การแข่งขัน', sub: 'รายการและกิจกรรมของสมาคม', Icon: Trophy },
  { to: '/rankings', label: 'อันดับนักกีฬา', sub: 'เรตติ้งแยกตามประเภทเกม', Icon: Medal },
  { to: '/games', label: 'เกมและกติกา', sub: 'ข้อมูลและกติกาการแข่งขัน', Icon: BookOpen }];
const games: [string, LucideIcon][] = [['crossword', LayoutGrid], ['a_math', Calculator], ['kumkom', MessageSquareQuote], ['sudoku', Grid3x3]];

function List<T>({ state, empty, render }: { state: { data: T[] | null; error: boolean }; empty: string; render: (x: T) => JSX.Element }) {
  return state.error ? <ErrorState /> : !state.data ? <LoadingState /> : state.data.length === 0 ? <EmptyState text={empty} /> :
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{state.data.map(render)}</ul>;
}
export default function HomePage() {
  usePageMeta('หน้าแรก', 'ข่าวสาร การแข่งขัน และอันดับนักกีฬาของสมาคม');
  const news = useAsync(() => fetchLatestNews(6), []);
  const events = useAsync(() => fetchUpcomingEvents(3), []);
  return (<>
    <section className="relative overflow-hidden bg-gradient-to-br from-navy-dark via-navy-dark to-navy text-white">
      <div className="grid-pattern absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-14 sm:pb-24 md:pb-28 md:pt-20">
        <span className="mb-4 block h-1 w-16 rounded bg-gold" />
        <h1 className="max-w-3xl text-3xl text-white md:text-5xl"><Th parts={nameParts} /></h1>
        <p className="mt-5 max-w-2xl text-lg text-slate-200"><Th parts={['ติดตามข่าวสาร ', 'รายการแข่งขัน ', 'และอันดับนักกีฬา', 'ในทุกประเภทเกมของสมาคม', 'ได้ในที่เดียว']} /></p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/news" className="rounded bg-gold px-6 py-3 font-semibold text-navy-dark transition hover:brightness-110">ดูข่าวประชาสัมพันธ์</Link>
          <Link to="/events" className="rounded border border-white/70 px-6 py-3 font-semibold transition hover:bg-white/10">ดูรายการแข่งขัน</Link></div></div></section>
    <section className="relative z-10 mx-auto -mt-12 hidden max-w-6xl px-4 sm:block"><ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {quick.map(({ to, label, sub, Icon }) => (<li key={to}><Link to={to} className="group flex h-full items-start gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:border-gold hover:shadow-lg">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-blue-light text-navy group-hover:bg-navy group-hover:text-gold"><Icon className="h-6 w-6" /></span>
        <span><span className="block font-semibold text-navy-dark">{label}</span><span className="block text-sm text-muted">{sub}</span></span></Link></li>))}</ul></section>
    <section className="mx-auto max-w-6xl px-4 pt-16"><SectionTitle title="ข่าวล่าสุด" to="/news" more="ดูข่าวทั้งหมด" />
      <List state={news} empty="ยังไม่มีข่าวประชาสัมพันธ์" render={n => <NewsCard key={n.id} n={n} />} /></section>
    <section className="mt-16 bg-gray-light py-16"><div className="mx-auto max-w-6xl px-4"><SectionTitle title="การแข่งขันที่กำลังจะมาถึง" to="/events" more="ดูทั้งหมด" />
      <List state={events} empty="ยังไม่มีรายการแข่งขันที่กำลังจะมาถึง" render={e => <EventCard key={e.id} e={e} />} /></div></section>
    <section className="mx-auto max-w-6xl px-4 pt-16"><SectionTitle title="ประเภทเกมของสมาคม" />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{games.map(([code, Icon]) => {
        const ranked = (RANKED_GAMES as readonly string[]).includes(code);
        const body = (<><span className="grid h-16 w-16 place-items-center rounded-full bg-navy text-gold"><Icon className="h-8 w-8" /></span>
          <span className="mt-4 font-serif text-xl font-bold text-navy-dark">{GAME_LABEL[code]}</span>{ranked && <span className="mt-1 text-sm text-muted group-hover:text-navy">ดูอันดับ →</span>}</>);
        return (<li key={code}>{ranked ? <Link to={`/rankings?game=${code}`} className="group flex h-full flex-col items-center rounded-lg border border-slate-200 p-6 text-center transition hover:border-gold hover:shadow-card">{body}</Link>
          : <div className="flex h-full flex-col items-center rounded-lg border border-slate-200 p-6 text-center">{body}</div>}</li>);
      })}</ul></section>
  </>);
}
