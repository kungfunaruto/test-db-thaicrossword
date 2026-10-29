import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Crown } from 'lucide-react';
import { fetchRankings, RANK_PAGE, rankingsKey, type RankQuery } from '../services/publicService';
import { useQuery } from '../lib/query';
import { useDebounced, usePageMeta } from '../hooks/usePublic';
import { loc, useLang } from '../i18n';
import { GAME_COLOR, RANKED_GAMES } from '../utils/labels';
import { fmtDate } from '../lib/dates';
import PageHeader from '../components/common/PageHeader';
import Pagination from '../components/common/Pagination';
import Segmented from '../components/common/Segmented';
import SearchInput from '../components/common/SearchInput';
import Avatar from '../components/rankings/Avatar';
import { MEDAL } from '../components/rankings/Leaderboard';
import { EmptyState, ErrorState } from '../components/common/States';

const fmt = (v: number) => Number(v).toLocaleString('en-US', { maximumFractionDigits: 2 });

export default function RankingsPage() {
  const { t, lang } = useLang();
  usePageMeta(t.rankings.title, t.rankings.metaDesc);
  const [sp, setSp] = useSearchParams();
  const g0 = sp.get('game') ?? ''; const game = (RANKED_GAMES as readonly string[]).includes(g0) ? g0 : RANKED_GAMES[0];
  const [q, setQ] = useState(''); const [page, setPage] = useState(1);
  const dq = useDebounced(q);
  const query: RankQuery = { game, q: dq, page };
  const res = useQuery(rankingsKey(query), () => fetchRankings(query), { keepPrevious: true });
  const setGame = (g: string) => { setSp({ game: g }, { replace: true }); setPage(1); };
  const color = GAME_COLOR[game];
  const podium = !dq && page === 1 && res.data && !res.placeholder ? res.data.rows.slice(0, 3) : [];
  const rest = res.data ? res.data.rows.slice(podium.length) : [];
  return (<><PageHeader title={t.rankings.title} desc={t.rankings.desc} />
    <div className="mx-auto max-w-5xl px-4 py-8 md:py-10">
      <div className="card relative z-10 flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <Segmented label={t.rankings.gameLabel} value={game} onChange={setGame} options={RANKED_GAMES.map(g => ({ value: g, label: t.games[g] }))} />
        <SearchInput value={q} onChange={v => { setQ(v); setPage(1); }} placeholder={t.rankings.searchPh} /></div>
      {res.data && <p className="mt-4 text-sm text-muted">{t.rankings.athletes(res.data.total)}</p>}
      {res.error ? <div className="mt-6"><ErrorState onRetry={res.refetch} /></div> : !res.data ? (
        <div className="mt-6 space-y-2" aria-hidden="true">{Array.from({ length: 8 }, (_, i) => <div key={i} className="skeleton h-16 w-full rounded-2xl" />)}</div>
      ) : res.data.rows.length === 0 ? <div className="mt-6"><EmptyState text={dq ? t.rankings.emptySearch : t.rankings.empty} /></div> : (<>
        {podium.length > 0 && <div key={game} className="mt-6 grid gap-3 sm:grid-cols-3">{podium.map((r, i) => { const name = loc(r, 'full_name', lang); return (
          <div key={r.athlete_id} style={{ animationDelay: `${i * 90}ms` }} className={`card relative flex animate-fade-up items-center gap-4 overflow-hidden p-4 sm:flex-col sm:p-6 sm:text-center ${i === 0 ? 'sm:order-2 sm:-translate-y-3 sm:shadow-lift' : i === 1 ? 'sm:order-1' : 'sm:order-3'}`}>
            <span className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${MEDAL[i]}`} />
            <div className="relative">{i === 0 && <Crown className="absolute -top-5 left-1/2 hidden h-6 w-6 -translate-x-1/2 animate-pop fill-gold text-gold-dark sm:block" />}
              <span className={`block rounded-full bg-gradient-to-b p-[3px] ${MEDAL[i]}`}><Avatar src={r.photo_url} alt={name} size={i === 0 ? 88 : 72} ring="ring-2 ring-white" /></span>
              <span className={`absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full bg-gradient-to-b text-sm font-bold text-navy-deep shadow ring-2 ring-white sm:-bottom-2 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 ${MEDAL[i]}`}>{r.rank}</span></div>
            <div className="min-w-0 sm:mt-3"><p className="font-semibold text-navy-dark">{name}</p>
              <p className="font-display text-2xl font-semibold" style={{ color }}>{fmt(r.rating_value)}</p><p className="text-xs text-muted">{t.rankings.asOf} {fmtDate(r.effective_date, lang, 'medium')}</p></div></div>); })}</div>}
        {rest.length > 0 && <div className={`card mt-6 overflow-hidden transition-opacity ${res.placeholder ? 'opacity-50' : ''}`}>
          <div className="hidden grid-cols-[4.5rem_1fr_7rem_9rem] gap-3 bg-navy-dark px-4 py-3 text-sm font-medium text-white sm:grid"><span>{t.rankings.rank}</span><span>{t.rankings.name}</span><span className="text-right">{t.rankings.rating}</span><span className="text-right">{t.rankings.asOf}</span></div>
          <ol key={`${game}|${page}|${dq}`} className="stagger divide-y divide-line">{rest.map((r, k) => { const name = loc(r, 'full_name', lang); const sub = lang === 'th' ? r.full_name_en : r.full_name; return (
            <li key={r.athlete_id} style={{ ['--i' as string]: k }} className="grid grid-cols-[3rem_1fr_auto] items-center gap-3 px-4 py-3 transition hover:bg-gray-light sm:grid-cols-[4.5rem_1fr_7rem_9rem]">
              <span className={`grid h-9 w-9 place-items-center rounded-full text-sm font-bold ${r.rank <= 3 ? `bg-gradient-to-b text-navy-deep ${MEDAL[r.rank - 1]}` : 'bg-blue-light text-navy'}`}>{r.rank}</span>
              <span className="flex min-w-0 items-center gap-3"><Avatar src={r.photo_url} alt={name} size={40} /><span className="min-w-0"><span className="block truncate font-medium text-navy-dark">{name}</span>
                {sub && sub !== name && <span className="block truncate text-xs text-muted">{sub}</span>}</span></span>
              <span className="text-right font-display text-lg font-semibold" style={{ color }}>{fmt(r.rating_value)}</span>
              <span className="hidden text-right text-sm text-muted sm:block">{fmtDate(r.effective_date, lang, 'medium')}</span></li>); })}</ol></div>}</>)}
      {res.data && <Pagination page={page} total={res.data.total} size={RANK_PAGE} onChange={p => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />}</div></>);
}
