import { Link } from 'react-router-dom';
import { ArrowRight, Crown } from 'lucide-react';
import type { RankingRow } from '../../types/db';
import { loc, useLang } from '../../i18n';
import { GAME_COLOR } from '../../utils/labels';
import { useQuery } from '../../lib/query';
import { fetchTopRatings, topRatingsKey } from '../../services/publicService';
import { prefetchRoute } from '../../lib/prefetch';
import Avatar from './Avatar';
import { ErrorState } from '../common/States';

export const MEDAL = ['from-[#F6D776] to-[#C99A2E]', 'from-[#E4E8EE] to-[#A9B2BF]', 'from-[#E7A86B] to-[#A8622B]'];
const fmt = (v: number) => Number(v).toLocaleString('en-US', { maximumFractionDigits: 2 });

function Podium({ rows }: { rows: RankingRow[] }) {
  const { lang } = useLang();
  const order = [1, 0, 2].filter(i => rows[i]); // 2nd, 1st, 3rd
  return (<div className="flex items-end justify-center gap-2 px-2 pt-2 sm:gap-4">{order.map(i => { const r = rows[i]; const first = i === 0; const name = loc(r, 'full_name', lang);
    return (<div key={r.athlete_id} className="flex min-w-0 flex-1 animate-fade-up flex-col items-center text-center" style={{ animationDelay: `${(first ? 0 : i) * 120}ms` }}>
      <div className="relative">{first && <Crown className="absolute -top-5 left-1/2 h-5 w-5 -translate-x-1/2 animate-pop fill-gold text-gold-dark" />}
        <span className={`block rounded-full bg-gradient-to-b p-[3px] shadow-md ${MEDAL[i]}`}><Avatar src={r.photo_url} alt={name} size={first ? 72 : 56} ring="ring-2 ring-white" /></span>
        <span className={`absolute -bottom-2 left-1/2 grid h-6 min-w-6 -translate-x-1/2 place-items-center rounded-full bg-gradient-to-b px-1.5 text-xs font-bold text-navy-deep shadow ring-2 ring-white ${MEDAL[i]}`}>{r.rank}</span></div>
      <p className="mt-3 line-clamp-2 w-full text-sm font-semibold leading-5 text-navy-dark">{name}</p>
      <p className="font-display text-lg font-semibold text-navy">{fmt(r.rating_value)}</p>
      <div className={`mt-1 w-full rounded-t-xl bg-gradient-to-b ${MEDAL[i]} opacity-25 ${first ? 'h-16' : i === 1 ? 'h-11' : 'h-7'}`} /></div>); })}</div>);
}

/** Top-10 card for one game: podium for the top 3, compact rows for 4–10. */
export default function Leaderboard({ game }: { game: string }) {
  const { t, lang } = useLang();
  const q = useQuery(topRatingsKey(game), () => fetchTopRatings(game, 10), { staleMs: 5 * 60_000 });
  const color = GAME_COLOR[game];
  return (<section className="card flex flex-col overflow-hidden" aria-label={`${t.home.rankingsTitle}: ${t.games[game]}`}>
    <header className="relative flex items-center justify-between gap-2 overflow-hidden px-5 py-4 text-white" style={{ background: `linear-gradient(120deg, ${color}, #0F2A47)` }}>
      <div className="grid-pattern absolute inset-0 opacity-50" aria-hidden="true" />
      <div className="relative"><p className="text-xs uppercase tracking-wider text-white/70">Top 10</p><h3 className="font-display text-xl font-medium text-white">{t.games[game]}</h3></div>
      <Link to={`/rankings?game=${game}`} onMouseEnter={() => prefetchRoute(`/rankings?game=${game}`)} className="relative inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur transition hover:bg-white/25">
        {t.home.fullRankings}<ArrowRight className="h-3.5 w-3.5" /></Link></header>
    {q.error ? <div className="p-5"><ErrorState onRetry={q.refetch} /></div> : !q.data ? (
      <div className="space-y-3 p-5" aria-hidden="true"><div className="flex justify-center gap-6">{[56, 72, 56].map((s, i) => <div key={i} className="skeleton rounded-full" style={{ width: s, height: s }} />)}</div>
        {Array.from({ length: 5 }, (_, i) => <div key={i} className="skeleton h-9 w-full" />)}</div>
    ) : q.data.length === 0 ? <p className="p-10 text-center text-muted">{t.home.emptyRanking}</p> : (<>
      <div className="bg-gradient-to-b from-blue-light/60 to-white pt-6"><Podium rows={q.data.slice(0, 3)} /></div>
      <ol className="stagger divide-y divide-line/70 px-3 pb-3">{q.data.slice(3).map((r, k) => { const name = loc(r, 'full_name', lang); return (
        <li key={r.athlete_id} style={{ ['--i' as string]: k }} className="flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-gray-light">
          <span className="w-7 text-center font-display text-sm font-semibold text-muted">{r.rank}</span><Avatar src={r.photo_url} alt={name} size={32} />
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{name}</span><span className="font-display font-semibold text-navy">{fmt(r.rating_value)}</span></li>); })}</ol></>)}
  </section>);
}
