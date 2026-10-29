import { Link } from 'react-router-dom';
import { ArrowRight, Download, Network } from 'lucide-react';
import { FORMATS, RULE_GAMES } from '../content/rules';
import { usePageMeta } from '../hooks/usePublic';
import { useLang } from '../i18n';
import { nb } from '../utils/labels';
import PageHeader from '../components/common/PageHeader';
import BlockView from '../components/rules/BlockView';
import { prefetchRoute } from '../lib/prefetch';

export default function GamesPage() {
  const { t, lang } = useLang();
  usePageMeta(t.rules.title, t.rules.metaDesc);
  const games = RULE_GAMES[lang]; const formats = FORMATS[lang];
  return (<><PageHeader title={t.rules.title} desc={t.rules.desc} />
    <div className="mx-auto max-w-6xl px-4 py-10">
      <ul className="stagger grid gap-6 md:grid-cols-3">{games.map((g, i) => (<li key={g.slug} style={{ ['--i' as string]: i }}>
        <div className="group card flex h-full flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-lift">
          <div className="relative h-24 overflow-hidden" style={{ background: `linear-gradient(120deg, ${g.accent}, #0F2A47)` }}>
            <div className="grid-pattern absolute inset-0 opacity-60" /><span className="absolute -bottom-6 right-4 font-display text-[6rem] font-semibold leading-none text-white/10 transition duration-500 group-hover:-translate-y-2">{g.name.slice(0, 1)}</span>
            <p className="absolute bottom-3 left-6 text-sm text-white/80">{g.brand}</p></div>
          <div className="flex flex-1 flex-col p-6"><h2 className="text-2xl">{nb(g.name)}</h2><p className="mt-2 min-h-[5.2rem] text-sm text-muted">{nb(g.tagline)}</p>
            <dl className="mt-5 grid grid-cols-3 gap-2 text-center">{g.facts.filter(f => ['grid', 'tiles', 'clock'].includes(f.icon)).map(f => (<div key={f.label} className="rounded-xl bg-gray-light p-2"><dt className="text-xs text-muted">{f.label}</dt><dd className="font-semibold text-navy-dark">{nb(f.value)}</dd></div>))}</dl>
            <div className="mt-auto flex flex-wrap gap-2 pt-6"><Link to={`/games/${g.slug}`} onMouseEnter={() => prefetchRoute(`/games/${g.slug}`)} className="btn-primary btn-sm">{t.rules.viewRules}<ArrowRight className="h-4 w-4" /></Link>
              <a href={g.pdf.url} download className="btn-outline btn-sm"><Download className="h-4 w-4" />{t.rules.pdf}</a></div></div></div></li>))}</ul>

      <section className="mt-14"><h2 className="text-2xl md:text-3xl">{t.rules.compare}</h2><span className="mt-2 block h-1 w-12 rounded-full bg-gradient-to-r from-gold to-flame" />
        <div className="card mt-6 overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm">
          <thead className="bg-navy-dark text-white"><tr><th className="p-3 font-medium">{t.rules.compareTopic}</th>{games.map(g => <th key={g.slug} className="p-3 font-medium"><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ background: g.accent }} />{nb(g.name)}</th>)}</tr></thead>
          <tbody>{t.rules.compareRows.map(r => <tr key={r[0]} className="border-t border-line transition even:bg-gray-light hover:bg-blue-light/60"><td className="p-3 font-medium text-navy-dark">{r[0]}</td><td className="p-3">{r[1]}</td><td className="p-3">{r[2]}</td><td className="p-3">{r[3]}</td></tr>)}</tbody></table></div>
        <p className="mt-3 text-xs text-muted">{t.rules.compareNote}</p></section>

      <section id="formats" aria-labelledby="h-formats" className="mt-16 scroll-mt-24">
        <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-navy text-gold shadow-sm"><Network className="h-5 w-5" /></span>
          <div><p className="text-xs font-medium uppercase tracking-wide text-gold-dark">{t.rules.formatsKicker}</p><h2 id="h-formats" className="text-2xl md:text-3xl">{formats.title}</h2></div></div>
        <div className="card mt-6 p-5 md:p-7">{formats.blocks.map((b, n) => <BlockView key={n} b={b} accent="#163A63" />)}</div></section>
    </div></>);
}
