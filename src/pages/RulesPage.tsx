import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, Clock, Download, ExternalLink, FileText, Hand, Info, Layers, LayoutGrid, Star, Users, type LucideIcon } from 'lucide-react';
import { RULE_GAMES } from '../content/rules';
import { usePageMeta } from '../hooks/usePublic';
import { useLang } from '../i18n';
import { nb } from '../utils/labels';
import PageHeader from '../components/common/PageHeader';
import BlockView from '../components/rules/BlockView';
import { TocChips, TocSidebar } from '../components/rules/Toc';
import NotFoundPage from './NotFoundPage';

const ICONS: Record<string, LucideIcon> = { users: Users, grid: LayoutGrid, tiles: Layers, clock: Clock, hand: Hand, star: Star };

export default function RulesPage() {
  const { slug = '' } = useParams();
  const { t, lang } = useLang();
  const g = RULE_GAMES[lang].find(x => x.slug === slug);
  usePageMeta(g?.title ?? '', g?.tagline);
  useEffect(() => { const id = window.location.hash.slice(1); if (id) setTimeout(() => document.getElementById(id)?.scrollIntoView(), 120); }, [slug]);
  if (!g) return <NotFoundPage />;
  const toc = [...g.sections.map(s => ({ id: s.id, title: s.title })), { id: 'pdf', title: t.rules.pdfTitle }];
  const others = RULE_GAMES[lang].filter(x => x.slug !== g.slug);
  const card = 'card scroll-mt-32 p-5 md:p-7 lg:scroll-mt-24';
  return (<><PageHeader title={g.title} desc={`${g.brand} · ${g.version}`} kicker={t.rules.title} />
    <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
      <p className="max-w-3xl text-lg text-muted">{nb(g.tagline)}</p>
      <ul className="stagger mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">{g.facts.map((f, i) => { const Icon = ICONS[f.icon]; return (
        <li key={f.label} style={{ ['--i' as string]: i }} className="card p-4 text-center transition hover:-translate-y-0.5 hover:shadow-lift">
          <span className="mx-auto grid h-10 w-10 place-items-center rounded-xl text-white shadow-sm" style={{ background: g.accent }}><Icon className="h-5 w-5" /></span>
          <p className="mt-2 text-xs text-muted">{f.label}</p><p className="font-display text-2xl font-semibold text-navy-dark">{nb(f.value)}</p>{f.sub && <p className="text-xs text-muted">{nb(f.sub)}</p>}</li>); })}</ul>
      <div className="mt-8 flex gap-8">
        <aside className="hidden w-64 shrink-0 lg:block"><TocSidebar items={toc} accent={g.accent} /></aside>
        <div className="min-w-0 flex-1 space-y-6">
          <TocChips items={toc} accent={g.accent} />
          <div className="flex gap-3 rounded-xl border border-blue-100 bg-blue-light p-4 text-sm text-navy-dark"><Info className="mt-0.5 h-5 w-5 shrink-0" /><p>{t.rules.summaryNote(g.version)}</p></div>
          {g.sections.map((s, i) => (<section key={s.id} id={s.id} aria-labelledby={`h-${s.id}`} className={card}>
            <div className="mb-4 flex items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl font-display font-semibold text-white shadow-sm" style={{ background: g.accent }}>{i + 1}</span>
              <h2 id={`h-${s.id}`} className="text-xl md:text-2xl">{nb(s.title)}</h2></div>
            {s.blocks.map((b, n) => <BlockView key={n} b={b} accent={g.accent} />)}</section>))}
          <section id="pdf" aria-labelledby="h-pdf" className={card}>
            <div className="flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-white" style={{ background: g.accent }}><FileText className="h-6 w-6" /></span>
              <div><h2 id="h-pdf" className="text-xl md:text-2xl">{t.rules.pdfTitle}</h2><p className="mt-1 text-sm text-muted">{nb(g.pdf.label)} · {g.version}</p></div></div>
            <div className="mt-5 flex flex-wrap gap-3">
              <a href={g.pdf.url} download className="btn-primary"><Download className="h-4 w-4" />{t.rules.pdfDownload}</a>
              <a href={g.pdf.url} target="_blank" rel="noopener noreferrer" className="btn-outline"><ExternalLink className="h-4 w-4" />{t.rules.pdfOpen}</a></div>
            <iframe title={g.pdf.label} src={`${g.pdf.url}#view=FitH`} loading="lazy" className="mt-5 hidden h-[720px] w-full rounded-xl border border-line md:block" />
            <p className="mt-3 text-xs text-muted md:hidden">{t.rules.pdfMobile}</p></section>
          <section aria-label={t.rules.otherGames} className="grid gap-3 sm:grid-cols-2">{others.map(o => (
            <Link key={o.slug} to={`/games/${o.slug}`} className="group card flex items-center justify-between gap-3 p-5 transition hover:-translate-y-0.5 hover:border-gold hover:shadow-lift">
              <span className="flex items-center gap-3"><span className="h-10 w-1.5 rounded-full" style={{ background: o.accent }} />
                <span><span className="block text-xs text-muted">{t.rules.otherGames}</span><span className="block font-display text-lg font-medium text-navy-dark">{nb(o.name)}</span><span className="block text-sm text-muted">{o.brand}</span></span></span>
              <ArrowRight className="h-5 w-5 text-navy transition group-hover:translate-x-1 group-hover:text-gold-dark" /></Link>))}</section>
        </div></div></div></>);
}
