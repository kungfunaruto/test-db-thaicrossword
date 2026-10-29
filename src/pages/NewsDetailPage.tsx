import { Link, useParams } from 'react-router-dom';
import { CalendarDays, ExternalLink, Newspaper } from 'lucide-react';
import { fetchNewsDetail, newsDetailKey } from '../services/publicService';
import { useQuery } from '../lib/query';
import { usePageMeta } from '../hooks/usePublic';
import { loc, useLang } from '../i18n';
import { nb } from '../utils/labels';
import { fmtDate } from '../lib/dates';
import NewsCard, { CATEGORY_STYLE } from '../components/news/NewsCard';
import Gallery from '../components/common/Gallery';
import EditedBadge from '../components/common/EditedBadge';
import ShareButtons from '../components/common/ShareButtons';
import { EmptyState, ErrorState } from '../components/common/States';
import BackLink from '../components/common/BackLink';

function DetailSkeleton() {
  return (<div className="mx-auto max-w-6xl px-4 py-10" aria-hidden="true"><div className="skeleton h-5 w-32" /><div className="skeleton mt-6 h-10 w-3/4" /><div className="skeleton mt-3 h-10 w-1/2" />
    <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_300px]"><div className="space-y-3"><div className="skeleton aspect-[16/10] w-full rounded-2xl" />{[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-5 w-full" />)}</div><div className="skeleton h-56 rounded-2xl" /></div></div>);
}
export default function NewsDetailPage() {
  const { id = '' } = useParams();
  const { t, lang } = useLang();
  const q = useQuery(newsDetailKey(id), () => fetchNewsDetail(id));
  const n = q.data?.news;
  const title = loc(n, 'title', lang), excerpt = loc(n, 'excerpt', lang), content = loc(n, 'content', lang);
  usePageMeta(title, excerpt || content, n?.images[0]);
  const back = <BackLink to="/news" label={t.news.backToList} />;
  if (q.error) return <div className="mx-auto max-w-3xl space-y-4 px-4 py-10">{back}<ErrorState onRetry={q.refetch} /></div>;
  if (q.data === undefined) return <DetailSkeleton />;
  if (!n) return <div className="mx-auto max-w-3xl space-y-4 px-4 py-10"><EmptyState text={t.news.notFound} />{back}</div>;
  const d = q.data!;
  return (<article className="mx-auto max-w-6xl px-4 py-8 md:py-10">
    {back}
    <header className="mt-6 max-w-4xl animate-fade-up">
      <div className="flex flex-wrap items-center gap-2 text-sm"><span className={`chip text-sm ${CATEGORY_STYLE[n.category]}`}>{t.news.categories[n.category]}</span>
        <span className="inline-flex items-center gap-1.5 text-muted"><CalendarDays className="h-4 w-4" />{t.news.publishedOn} {fmtDate(n.published_at, lang)}</span>
        <EditedBadge revisions={d.revisions} /></div>
      <h1 className="mt-4 text-3xl leading-[1.35] md:text-[2.6rem] md:leading-[1.3]">{nb(title)}</h1>
      {excerpt && <p className="mt-4 border-l-4 border-gold pl-4 text-lg text-muted">{nb(excerpt)}</p>}</header>
    <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0 animate-fade-up space-y-8" style={{ animationDelay: '80ms' }}>
        <Gallery images={n.images} alt={title} />
        <div className="card p-6 md:p-8"><div className="prose-th">{nb(content)}</div>
          {n.external_url && <a href={n.external_url} target="_blank" rel="noopener noreferrer" className="btn-primary mt-8"><ExternalLink className="h-4 w-4" />{t.common.openLink}</a>}
          <div className="mt-8 border-t border-line pt-5"><ShareButtons title={title} /></div></div></div>
      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        {d.related.length > 0 && <section className="card p-5"><h2 className="mb-4 flex items-center gap-2 font-sans text-base font-semibold"><Newspaper className="h-4 w-4 text-gold-dark" />{t.news.related}</h2>
          <ul className="space-y-3">{d.related.map(r => (<li key={r.id}><Link to={`/news/${r.id}`} className="group flex gap-3">
            <span className="h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-navy to-navy-deep">{r.images[0] && <img src={r.images[0]} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />}</span>
            <span className="min-w-0"><span className="line-clamp-2 text-sm font-medium leading-5 text-ink transition group-hover:text-navy">{nb(loc(r, 'title', lang))}</span>
              <span className="mt-1 block text-xs text-muted">{fmtDate(r.published_at, lang, 'medium')}</span></span></Link></li>))}</ul></section>}
      </aside></div>
    {d.related.length > 0 && <section className="mt-14 lg:hidden"><h2 className="mb-4 text-xl">{t.news.related}</h2>
      <ul className="stagger grid gap-3 sm:grid-cols-2">{d.related.map((r, i) => <NewsCard key={r.id} n={r} index={i} />)}</ul></section>}
  </article>);
}
