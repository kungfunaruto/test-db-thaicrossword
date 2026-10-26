import { useState } from 'react';
import { fetchEvents, EVENTS_PAGE } from '../services/publicService';
import PageHeader from '../components/common/PageHeader';
import { useAsync, useDebounced, usePageMeta } from '../hooks/usePublic';
import EventCard from '../components/events/EventCard';
import Pagination from '../components/common/Pagination';
import { EmptyState, ErrorState, LoadingState } from '../components/common/States';
import { STATUS_LABEL } from '../utils/labels';
export default function EventsPage() {
  usePageMeta('การแข่งขันและกิจกรรม', 'รายการแข่งขันและกิจกรรมของสมาคม');
  const [q, setQ] = useState(''); const [status, setStatus] = useState(''); const [oldest, setOldest] = useState(false); const [page, setPage] = useState(1);
  const dq = useDebounced(q);
  const { data, error } = useAsync(() => fetchEvents({ q: dq, status, oldest, page }), [dq, status, oldest, page]);
  const f = 'rounded border border-slate-300 bg-white p-2.5';
  return (<><PageHeader title="การแข่งขันและกิจกรรม" desc="รายการแข่งขันและกิจกรรมทั้งหมดของสมาคม" /><div className="mx-auto max-w-6xl px-4 py-10">
    <div className="mb-8 flex flex-wrap gap-2 rounded-lg bg-gray-light p-3">
      <input aria-label="ค้นหาชื่อกิจกรรม" placeholder="ค้นหาชื่อกิจกรรม" value={q} onChange={e => { setQ(e.target.value); setPage(1); }} className={f} />
      <select aria-label="สถานะ" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className={f}><option value="">ทุกสถานะ</option>
        {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
      <select aria-label="เรียงลำดับ" value={oldest ? 'old' : 'new'} onChange={e => { setOldest(e.target.value === 'old'); setPage(1); }} className={f}><option value="new">ใหม่สุดก่อน</option><option value="old">เก่าสุดก่อน</option></select></div>
    {error ? <ErrorState /> : !data ? <LoadingState /> : data.rows.length === 0 ? <EmptyState text="ยังไม่มีรายการแข่งขันหรือกิจกรรม" /> :
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{data.rows.map(e => <EventCard key={e.id} e={e} />)}</ul>}
    {data && <Pagination page={page} total={data.total} size={EVENTS_PAGE} onChange={setPage} />}</div></>);
}
