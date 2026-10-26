import { useState } from 'react';
import { fetchNews, NEWS_PAGE } from '../services/publicService';
import PageHeader from '../components/common/PageHeader';
import { useAsync, useDebounced, usePageMeta } from '../hooks/usePublic';
import NewsCard from '../components/news/NewsCard';
import Pagination from '../components/common/Pagination';
import { EmptyState, ErrorState, LoadingState } from '../components/common/States';
import { NEWS_CATEGORIES } from '../utils/labels';
export default function NewsPage() {
  usePageMeta('ข่าวประชาสัมพันธ์', 'ข่าวและประกาศของสมาคม');
  const [q, setQ] = useState(''); const [cat, setCat] = useState(''); const [oldest, setOldest] = useState(false); const [page, setPage] = useState(1);
  const dq = useDebounced(q);
  const { data, error } = useAsync(() => fetchNews({ q: dq, category: cat, oldest, page }), [dq, cat, oldest, page]);
  const f = 'rounded border border-slate-300 bg-white p-2.5';
  return (<><PageHeader title="ข่าวประชาสัมพันธ์" desc="ข่าวสาร ประกาศ และผลการแข่งขันจากสมาคม" /><div className="mx-auto max-w-6xl px-4 py-10">
    <div className="mb-8 flex flex-wrap gap-2 rounded-lg bg-gray-light p-3">
      <input aria-label="ค้นหาหัวข้อข่าว" placeholder="ค้นหาหัวข้อข่าว" value={q} onChange={e => { setQ(e.target.value); setPage(1); }} className={f} />
      <select aria-label="หมวดหมู่" value={cat} onChange={e => { setCat(e.target.value); setPage(1); }} className={f}><option value="">ทุกหมวดหมู่</option>{NEWS_CATEGORIES.map(c => <option key={c}>{c}</option>)}</select>
      <select aria-label="เรียงลำดับ" value={oldest ? 'old' : 'new'} onChange={e => { setOldest(e.target.value === 'old'); setPage(1); }} className={f}><option value="new">ใหม่สุดก่อน</option><option value="old">เก่าสุดก่อน</option></select></div>
    {error ? <ErrorState /> : !data ? <LoadingState /> : data.rows.length === 0 ? <EmptyState text="ยังไม่มีข่าวประชาสัมพันธ์" /> :
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{data.rows.map(n => <NewsCard key={n.id} n={n} />)}</ul>}
    {data && <Pagination page={page} total={data.total} size={NEWS_PAGE} onChange={setPage} />}</div></>);
}
