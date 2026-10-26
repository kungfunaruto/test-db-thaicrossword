import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchRankings, RANK_PAGE } from '../services/publicService';
import { useAsync, useDebounced, usePageMeta } from '../hooks/usePublic';
import PageHeader from '../components/common/PageHeader';
import Pagination from '../components/common/Pagination';
import { EmptyState, ErrorState, LoadingState } from '../components/common/States';
import { GAME_LABEL, RANKED_GAMES, thDate } from '../utils/labels';
const medal = (r: number) => r === 1 ? 'bg-gold text-navy-dark' : r === 2 ? 'bg-slate-300 text-navy-dark' : r === 3 ? 'bg-amber-700 text-white' : 'bg-blue-light text-navy';
export default function RankingsPage() {
  usePageMeta('อันดับนักกีฬาระดับประเทศ', 'เรตติ้งและอันดับนักกีฬาของสมาคม แยกตามประเภทเกม');
  const [sp] = useSearchParams(); const initial = sp.get('game') ?? '';
  const [game, setGame] = useState<string>((RANKED_GAMES as readonly string[]).includes(initial) ? initial : RANKED_GAMES[0]);
  const [q, setQ] = useState(''); const [page, setPage] = useState(1);
  const dq = useDebounced(q);
  const { data, error } = useAsync(() => fetchRankings({ game, q: dq, page }), [game, dq, page]);
  return (<><PageHeader title="อันดับนักกีฬาระดับประเทศ" desc={['จัดอันดับแยกตามประเภทเกม ', 'นักกีฬาที่มีเรตติ้งเท่ากัน', 'จะได้อันดับเดียวกัน']} />
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div role="group" aria-label="ประเภทเกม" className="flex flex-wrap gap-2">{RANKED_GAMES.map(g =>
        <button key={g} aria-pressed={g === game} onClick={() => { setGame(g); setPage(1); }}
          className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-medium transition ${g === game ? 'bg-navy text-white shadow' : 'border border-slate-300 hover:border-navy'}`}>{GAME_LABEL[g]}</button>)}</div>
      <input aria-label="ค้นหาชื่อนักกีฬา" placeholder="ค้นหาชื่อนักกีฬา" value={q} onChange={e => { setQ(e.target.value); setPage(1); }} className="my-6 w-full max-w-sm rounded border border-slate-300 p-2.5" />
      {error ? <ErrorState /> : !data ? <LoadingState /> : data.rows.length === 0 ? <EmptyState text="ยังไม่มีข้อมูลอันดับของเกมนี้" /> :
        <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-card"><table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-navy-dark text-white"><tr>{['อันดับ', 'ชื่อ-นามสกุล', 'โรงเรียน/สังกัด', 'จังหวัด', 'เรตติ้ง', 'ณ วันที่'].map(h => <th key={h} className="whitespace-nowrap p-3 font-medium">{h}</th>)}</tr></thead>
          <tbody>{data.rows.map(r => <tr key={r.athlete_id} className="border-t border-slate-100 even:bg-gray-light">
            <td className="p-3"><span className={`grid h-8 w-8 place-items-center rounded-full text-sm font-bold ${medal(r.rank)}`}>{r.rank}</span></td>
            <td className="p-3 font-medium text-navy-dark">{r.full_name}</td><td className="p-3">{r.school_name ?? '—'}</td><td className="whitespace-nowrap p-3">{r.province ?? '—'}</td>
            <td className="p-3 text-base font-semibold text-navy">{r.rating_value}</td><td className="whitespace-nowrap p-3">{thDate(r.effective_date)}</td></tr>)}</tbody></table></div>}
      {data && <Pagination page={page} total={data.total} size={RANK_PAGE} onChange={setPage} />}</div></>);
}
