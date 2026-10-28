import { Link, useParams } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { fetchNewsById, fetchRelatedNews } from '../services/publicService';
import { useAsync, usePageMeta } from '../hooks/usePublic';
import NewsCard from '../components/news/NewsCard';
import { EmptyState, ErrorState, LoadingState } from '../components/common/States';
import { nb, thDate } from '../utils/labels';
export default function NewsDetailPage() {
  const { id = '' } = useParams();
  const { data, error } = useAsync(async () => { const n = await fetchNewsById(id); return { n, related: n ? await fetchRelatedNews(n) : [] }; }, [id]);
  usePageMeta(data?.n?.title ?? '', data?.n?.excerpt ?? data?.n?.content, data?.n?.image_url);
  const back = <Link to="/news" className="text-navy underline">← กลับไปหน้าข่าว</Link>;
  if (error) return <div className="mx-auto max-w-3xl px-4 py-10"><ErrorState /></div>;
  if (!data) return <LoadingState />;
  const n = data.n;
  if (!n) return <div className="mx-auto max-w-3xl space-y-4 px-4 py-10"><EmptyState text="ไม่พบข่าวที่ต้องการ หรือข่าวนี้ไม่เปิดเผยแล้ว" />{back}</div>;
  return (<article className="mx-auto max-w-3xl px-4 py-10">{back}
    <p className="mt-6 text-sm text-muted">{n.category} · {thDate(n.published_at)}</p><h1 className="mt-1 text-3xl">{nb(n.title)}</h1>
    {n.image_url && <img src={n.image_url} alt={n.title} className="mt-6 w-full rounded" />}
    <div className="mt-6 whitespace-pre-line leading-8">{nb(n.content)}</div>
    {n.external_url && <a href={n.external_url} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 rounded bg-navy px-5 py-2.5 text-white"><ExternalLink className="h-4 w-4" />เปิดลิงก์ที่เกี่ยวข้อง</a>}
    {data.related.length > 0 && <section className="mt-12"><h2 className="mb-4 text-xl">ข่าวที่เกี่ยวข้อง</h2><ul className="grid gap-2.5 sm:grid-cols-3 sm:gap-6">{data.related.map(r => <NewsCard key={r.id} n={r} />)}</ul></section>}
  </article>);
}
