import { useRef } from 'react';
import { FilterX } from 'lucide-react';
import { fetchNews, newsKey, PAGE_SIZE, type NewsQuery } from '../services/publicService';
import { useQuery } from '../lib/query';
import { usePageMeta } from '../hooks/usePublic';
import { useListParams } from '../hooks/useListParams';
import { useLang } from '../i18n';
import PageHeader from '../components/common/PageHeader';
import NewsCard from '../components/news/NewsCard';
import Pagination from '../components/common/Pagination';
import Segmented from '../components/common/Segmented';
import SearchInput from '../components/common/SearchInput';
import DateRangePicker from '../components/common/DateRangePicker';
import { CardSkeletons, EmptyState, ErrorState } from '../components/common/States';

export default function NewsPage() {
  const { t } = useLang();
  usePageMeta(t.news.title, t.news.desc);
  const p = useListParams(['general', 'competition']);
  const query: NewsQuery = { q: p.dq, category: p.filter, range: p.range, page: p.page };
  const res = useQuery(newsKey(query), () => fetchNews(query), { keepPrevious: true });
  const top = useRef<HTMLDivElement>(null);
  const goPage = (n: number) => { p.setPage(n); top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  return (<><PageHeader title={t.news.title} desc={t.news.desc} />
    <div ref={top} className="mx-auto max-w-6xl scroll-mt-20 px-4 py-8 md:py-10">
      <div className="card relative z-20 mb-6 flex flex-col gap-3 p-3 sm:p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center"><SearchInput value={p.q} onChange={p.setQ} placeholder={t.news.searchPh} /><DateRangePicker value={p.range} onChange={p.setRange} /></div>
        <Segmented label={t.news.categoryLabel} value={p.filter} onChange={p.setFilter}
          options={[{ value: '', label: t.common.all }, { value: 'general', label: t.news.categories.general }, { value: 'competition', label: t.news.categories.competition }]} /></div>
      <div className="mb-4 flex min-h-8 flex-wrap items-center justify-between gap-2 text-sm text-muted">
        <span aria-live="polite">{res.data && t.common.results(res.data.total)}</span>
        {p.active && <button onClick={p.clear} className="inline-flex animate-fade-in items-center gap-1.5 rounded-full px-3 py-1 text-navy hover:bg-blue-light"><FilterX className="h-4 w-4" />{t.common.clear}</button>}</div>
      {res.error ? <ErrorState onRetry={res.refetch} /> : !res.data ? <CardSkeletons count={6} /> : res.data.rows.length === 0 ? <EmptyState text={p.active ? t.news.emptyFiltered : t.news.empty} /> :
        <ul key={res.data.rows.map(r => r.id).join().slice(0, 120)} className={`stagger grid gap-3 transition-opacity sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 ${res.placeholder ? 'opacity-50' : ''}`}>
          {res.data.rows.map((n, i) => <NewsCard key={n.id} n={n} index={i} />)}</ul>}
      {res.data && <Pagination page={p.page} total={res.data.total} size={PAGE_SIZE} onChange={goPage} />}</div></>);
}
