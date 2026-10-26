import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Clock, Download, ExternalLink, FileText, Hand, Info, Layers, LayoutGrid, Star, TriangleAlert, Users, type LucideIcon } from 'lucide-react';
import type { Block, RuleGame } from '../../content/rules/types';
import { RULE_GAMES } from '../../content/rules';
import { usePageMeta } from '../../hooks/usePublic';
import { nb } from '../../utils/labels';
import PageHeader from '../common/PageHeader';

const ICONS: Record<string, LucideIcon> = { users: Users, grid: LayoutGrid, tiles: Layers, clock: Clock, hand: Hand, star: Star };

function BlockView({ b, accent }: { b: Block; accent: string }) {
  switch (b.t) {
    case 'h': return <h3 className="mb-1 mt-7 font-sans text-lg font-semibold text-navy">{nb(b.text)}</h3>;
    case 'p': return <p className="mt-3 first:mt-0">{nb(b.text)}</p>;
    case 'ul': return <ul className="mt-3 space-y-2">{b.items.map((i, n) => <li key={n} className="flex gap-2.5"><Check className="mt-1.5 h-4 w-4 shrink-0" style={{ color: accent }} />{nb(i)}</li>)}</ul>;
    case 'ol': return <ol className="mt-3 space-y-3">{b.items.map((i, n) => <li key={n} className="flex gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm font-semibold text-white" style={{ background: accent }}>{n + 1}</span><span className="pt-0.5">{nb(i)}</span></li>)}</ol>;
    case 'cards': return (<div className="mt-4 grid gap-3 sm:grid-cols-2">{b.items.map((c, n) => (<div key={n} className="flex gap-3 rounded-lg border border-slate-200 bg-gray-light p-4">
      {c.color && <span className="mt-1 h-7 w-7 shrink-0 rounded shadow-sm" style={{ background: c.color }} aria-hidden="true" />}
      <div className="min-w-0"><p className="font-semibold text-navy-dark">{nb(c.title)}</p><p className="mt-1 text-sm text-muted">{nb(c.text)}</p></div></div>))}</div>);
    case 'table': return (<>
      <div className="mt-4 hidden overflow-x-auto rounded-lg border border-slate-200 sm:block"><table className="w-full text-left text-sm">
        <thead className="bg-navy-dark text-white"><tr>{b.head.map((x, n) => <th key={n} className="p-3 font-medium">{nb(x)}</th>)}</tr></thead>
        <tbody>{b.rows.map((r, i) => <tr key={i} className="border-t border-slate-100 align-top even:bg-gray-light">{r.map((c, j) => <td key={j} className={`whitespace-pre-line p-3 ${j === 0 ? 'font-medium text-navy-dark' : ''}`}>{nb(c)}</td>)}</tr>)}</tbody></table></div>
      <ul className="mt-4 space-y-3 sm:hidden">{b.rows.map((r, i) => (<li key={i} className="rounded-lg border border-slate-200 bg-gray-light p-4">
        <p className="font-semibold text-navy-dark">{nb(r[0])}</p>
        <dl className="mt-2 space-y-2 text-sm">{r.slice(1).map((c, j) => <div key={j}><dt className="text-xs font-medium text-muted">{nb(b.head[j + 1])}</dt><dd className="whitespace-pre-line">{nb(c)}</dd></div>)}</dl></li>))}</ul></>);
    case 'note': { const w = b.tone === 'warn'; const Icon = w ? TriangleAlert : Info;
      return <div className={`mt-4 flex gap-3 rounded-lg border p-4 text-sm ${w ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-blue-100 bg-blue-light text-navy-dark'}`}><Icon className="mt-0.5 h-5 w-5 shrink-0" /><p>{nb(b.text)}</p></div>; }
  }
}

export default function RulesView({ game: g }: { game: RuleGame }) {
  usePageMeta(g.title, g.tagline);
  useEffect(() => { const id = window.location.hash.slice(1); if (id) setTimeout(() => document.getElementById(id)?.scrollIntoView(), 80); }, [g.slug]);
  const toc = [...g.sections.map(s => ({ id: s.id, title: s.title })), { id: 'pdf', title: 'เอกสารกติกาฉบับเต็ม (PDF)' }];
  const others = RULE_GAMES.filter(x => x.slug !== g.slug);
  const card = 'scroll-mt-28 rounded-xl border border-slate-200 bg-white p-5 shadow-card md:p-7';
  return (<><PageHeader title={g.title} desc={`${g.brand} · ${g.version}`} />
    <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
      <p className="max-w-3xl text-lg text-muted">{nb(g.tagline)}</p>
      <ul className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">{g.facts.map(f => { const Icon = ICONS[f.icon]; return (
        <li key={f.label} className="rounded-lg border border-slate-200 bg-white p-4 text-center shadow-card">
          <span className="mx-auto grid h-10 w-10 place-items-center rounded-full text-white" style={{ background: g.accent }}><Icon className="h-5 w-5" /></span>
          <p className="mt-2 text-xs text-muted">{f.label}</p><p className="font-serif text-2xl font-bold text-navy-dark">{nb(f.value)}</p>{f.sub && <p className="text-xs text-muted">{nb(f.sub)}</p>}</li>); })}</ul>
      <div className="mt-8 flex gap-8">
        <aside className="hidden w-60 shrink-0 lg:block"><nav aria-label="สารบัญ" className="sticky top-20 rounded-lg border border-slate-200 bg-white p-4">
          <p className="mb-2 font-semibold text-navy-dark">สารบัญ</p>
          <ol className="space-y-0.5">{toc.map((s, i) => <li key={s.id}><a href={`#${s.id}`} className="flex gap-2 rounded px-2 py-1.5 text-sm hover:bg-blue-light"><span className="text-muted">{i + 1}.</span><span>{nb(s.title)}</span></a></li>)}</ol></nav></aside>
        <div className="min-w-0 flex-1 space-y-6">
          <nav aria-label="สารบัญ" className="-mx-4 overflow-x-auto px-4 lg:hidden"><ul className="flex gap-2 pb-1">{toc.map((s, i) => <li key={s.id} className="shrink-0"><a href={`#${s.id}`} className="block whitespace-nowrap rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm">{i + 1}. {nb(s.title)}</a></li>)}</ul></nav>
          <div className="flex gap-3 rounded-lg border border-blue-100 bg-blue-light p-4 text-sm text-navy-dark"><Info className="mt-0.5 h-5 w-5 shrink-0" />
            <p>หน้านี้สรุปจากเอกสาร “กฎกติกามาตรฐานเพื่อใช้ในการแข่งขัน” ({g.version}) โดยบางกอกครอสเวิร์ดคลับ หากมีข้อสงสัยหรือข้อขัดแย้ง ให้ยึดเอกสาร PDF ฉบับเต็มท้ายหน้านี้</p></div>
          {g.sections.map((s, i) => (<section key={s.id} id={s.id} aria-labelledby={`h-${s.id}`} className={card}>
            <div className="mb-4 flex items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg font-semibold text-white" style={{ background: g.accent }}>{i + 1}</span>
              <h2 id={`h-${s.id}`} className="text-xl md:text-2xl">{nb(s.title)}</h2></div>
            {s.blocks.map((b, n) => <BlockView key={n} b={b} accent={g.accent} />)}</section>))}
          <section aria-label="เกมอื่น" className="grid gap-3 sm:grid-cols-2">{others.map(o => (
            <Link key={o.slug} to={`/games/${o.slug}`} className="group flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-card transition hover:border-gold">
              <span><span className="block text-xs text-muted">ดูกติกาเกมอื่น</span><span className="block font-serif text-lg font-bold text-navy-dark">{nb(o.name)}</span><span className="block text-sm text-muted">{o.brand}</span></span>
              <ArrowRight className="h-5 w-5 text-navy group-hover:text-gold" /></Link>))}</section>
          <section id="pdf" aria-labelledby="h-pdf" className={card}>
            <div className="flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg text-white" style={{ background: g.accent }}><FileText className="h-6 w-6" /></span>
              <div><h2 id="h-pdf" className="text-xl md:text-2xl">เอกสารกติกาฉบับเต็ม (PDF)</h2><p className="mt-1 text-sm text-muted">{nb(g.pdf.label)} · {g.version}</p></div></div>
            <div className="mt-5 flex flex-wrap gap-3">
              <a href={g.pdf.url} download className="inline-flex items-center gap-2 rounded bg-navy px-5 py-2.5 font-medium text-white hover:brightness-110"><Download className="h-4 w-4" />ดาวน์โหลด PDF</a>
              <a href={g.pdf.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded border border-navy px-5 py-2.5 font-medium text-navy hover:bg-blue-light"><ExternalLink className="h-4 w-4" />เปิดอ่านในแท็บใหม่</a></div>
            <iframe title={`เอกสาร${g.title}`} src={`${g.pdf.url}#view=FitH`} loading="lazy" className="mt-5 hidden h-[720px] w-full rounded-lg border border-slate-200 md:block" />
            <p className="mt-3 text-xs text-muted md:hidden">บนมือถือ กรุณากด “เปิดอ่านในแท็บใหม่” หรือ “ดาวน์โหลด PDF” เพื่ออ่านเอกสาร</p></section>
        </div></div></div></>);
}
