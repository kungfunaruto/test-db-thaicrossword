import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, ExternalLink, Facebook, Info, Trophy } from 'lucide-react';
import * as TH from '../content/about';
import * as EN from '../content/about.en';
import { site } from '../config/site';
import { usePageMeta } from '../hooks/usePublic';
import { useLang } from '../i18n';
import { nb } from '../utils/labels';
import { Logo } from '../components/layout/MainLayout';
import SectionTitle from '../components/common/SectionTitle';
import FloatingTiles from '../components/common/FloatingTiles';
import Th from '../components/common/Th';

export default function AboutPage() {
  const { t, lang } = useLang();
  const C = lang === 'th' ? TH : EN;
  usePageMeta(t.nav.about, t.about.metaDesc);
  return (<>
    <section className="relative overflow-hidden bg-gradient-to-br from-navy-deep via-navy-dark to-navy text-white">
      <div className="grid-pattern absolute inset-0" aria-hidden="true" /><div className="hero-glow absolute inset-0" aria-hidden="true" /><FloatingTiles className="hidden lg:block" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 md:grid-cols-[1fr_auto] md:py-20">
        <div><p className="animate-fade-up text-sm font-medium tracking-wide text-gold">{t.about.kicker} · {site.abbreviation}</p>
          <h1 className="mt-3 animate-fade-up text-3xl leading-[1.35] text-white md:text-5xl md:leading-[1.3]"><Th parts={t.site.parts} /></h1><p className="mt-2 text-sm text-slate-300 md:text-base">{t.site.secondary}</p>
          <p className="mt-5 max-w-2xl animate-fade-up text-lg text-slate-200">{nb(t.about.lead)}</p>
          <div className="mt-7 flex flex-wrap gap-3"><Link to="/events" className="btn-gold"><Trophy className="h-4 w-4" />{t.about.ctaEvents}</Link>
            <Link to="/games" className="btn-ghost-light"><BookOpen className="h-4 w-4" />{t.about.ctaRules}</Link></div></div>
        <div className="relative mx-auto animate-fade-in"><div className="absolute inset-0 rounded-full bg-gold/20 blur-3xl" /><Logo className="relative h-44 drop-shadow-[0_18px_40px_rgba(0,0,0,.45)] md:h-60" /></div></div>
      <svg className="absolute -bottom-px left-0 w-full text-surface" viewBox="0 0 1440 40" preserveAspectRatio="none" aria-hidden="true"><path fill="currentColor" d="M0 40h1440V18C1200 38 960 0 720 10S240 34 0 14z" /></svg></section>

    <div className="mx-auto max-w-6xl space-y-16 px-4 pt-14">
      <section><SectionTitle title={t.about.gamesTitle} />
        <ul className="stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{C.games.map((g, i) => (<li key={g.name} style={{ ['--i' as string]: i }} className="card flex flex-col p-5 transition hover:-translate-y-1 hover:shadow-lift">
          <p className="text-xs text-muted">{g.brand}</p><h3 className="mt-1 font-display text-2xl font-medium text-navy-dark">{nb(g.name)}</h3><p className="mt-2 flex-1 text-sm text-muted">{nb(g.text)}</p>
          {g.to ? <Link to={g.to} className="group mt-4 inline-flex items-center gap-1 font-medium text-navy">{t.about.viewRules}<ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></Link> : <span className="mt-4 text-xs text-muted">{t.about.noRules}</span>}</li>))}</ul></section>

      <section><SectionTitle title={t.about.doingTitle} />
        <ul className="grid gap-4 md:grid-cols-2">{C.doing.map(d => (<li key={d.title} className="relative overflow-hidden rounded-2xl border border-line bg-white p-6 shadow-card"><span className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-gold to-flame" />
          <h3 className="text-lg">{nb(d.title)}</h3><p className="mt-2 text-muted">{nb(d.text)}</p>
          <a href={C.sources.find(s => s.id === d.src)?.url} className="link-underline mt-3 inline-flex items-center gap-1 text-sm text-navy" {...(d.src === 'rules' ? {} : { target: '_blank', rel: 'noopener noreferrer' })}>{t.about.source}</a></li>))}</ul></section>

      <section><SectionTitle title={t.about.timelineTitle} />
        <p className="-mt-4 mb-8 max-w-3xl text-muted">{t.about.timelineNote}</p>
        <ol className="relative space-y-6 border-l-2 border-gold/50 pl-6">{C.timeline.map(m => (<li key={m.year} className="relative">
          <span className="absolute -left-[2.15rem] top-1 grid h-5 w-5 place-items-center rounded-full bg-gold ring-4 ring-surface" aria-hidden="true" />
          <div className="card p-5 transition hover:shadow-lift"><p className="font-semibold text-navy">{t.about.year(m.yearBE, m.year)} <span className="font-normal text-muted">({t.about.yearSub(m.yearBE, m.year)})</span></p>
            <h3 className="mt-1 text-lg">{nb(m.title)}</h3><p className="mt-1 text-muted">{nb(m.text)}</p>
            <a href={m.src.url} target="_blank" rel="noopener noreferrer" className="link-underline mt-2 inline-flex items-center gap-1 text-sm text-navy">{t.about.newsSource}: {m.src.label}<ExternalLink className="h-3.5 w-3.5" /></a></div></li>))}</ol></section>

      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy-deep to-navy p-8 text-white shadow-lift"><div className="grid-pattern absolute inset-0 opacity-50" aria-hidden="true" />
        <div className="relative"><h2 className="text-2xl text-white">{t.about.joinTitle}</h2><p className="mt-2 max-w-2xl text-slate-300">{t.about.joinText}</p>
          <div className="mt-6 flex flex-wrap gap-3"><Link to="/news" className="btn-gold">{t.nav.news}</Link><Link to="/rankings" className="btn-ghost-light">{t.nav.rankings}</Link>
            <a href={site.social[0].url} target="_blank" rel="noopener noreferrer" className="btn-ghost-light"><Facebook className="h-4 w-4" />{t.about.facebook}</a></div></div></section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6"><h2 className="flex items-center gap-2 font-sans text-lg text-amber-900"><Info className="h-5 w-5" />{t.about.pendingTitle}</h2>
          <p className="mt-2 text-sm text-amber-900">{t.about.pendingText}</p><ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-amber-900">{C.pending.map(p => <li key={p}>{nb(p)}</li>)}</ul></div>
        <div className="card p-6"><h2 className="font-sans text-lg">{t.about.sourcesTitle}</h2>
          <ul className="mt-3 space-y-2 text-sm">{C.sources.map(s => <li key={s.id}><a href={s.url} className="link-underline text-navy" {...(s.url.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{s.label}</a></li>)}</ul></div></section>
    </div></>);
}
