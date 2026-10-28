import { Link } from 'react-router-dom';
import { ArrowRight, ExternalLink, Facebook, Info } from 'lucide-react';
import { doing, games, pending, sources, timeline } from '../content/about';
import { nameParts, site } from '../config/site';
import { usePageMeta } from '../hooks/usePublic';
import { nb } from '../utils/labels';
import { Logo } from '../components/layout/MainLayout';
import SectionTitle from '../components/common/SectionTitle';
import Th from '../components/common/Th';

export default function AboutPage() {
  usePageMeta('เกี่ยวกับสมาคม', 'ทำความรู้จักสมาคมครอสเวิร์ดเกม เอแม็ท คำคม และซูโดกุ แห่งประเทศไทย เกมกีฬาทางปัญญาและวิชาการสำหรับทุกวัย');
  return (<>
    <section className="relative overflow-hidden bg-gradient-to-br from-navy-dark via-navy-dark to-navy text-white">
      <div className="grid-pattern absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-4 py-12 md:grid-cols-[1fr_auto] md:py-16">
        <div><p className="text-sm font-medium tracking-wide text-gold">เกี่ยวกับสมาคม · {site.abbreviation}</p>
          <h1 className="mt-3 text-3xl text-white md:text-5xl"><Th parts={nameParts} /></h1><p className="mt-2 text-sm text-slate-300 md:text-base">{site.nameEn}</p>
          <p className="mt-5 max-w-2xl text-lg text-slate-200">สมาคมที่เป็นศูนย์กลางของเกมกีฬาทางปัญญาและวิชาการ 4 ประเภท ได้แก่ {nb('ครอสเวิร์ด')} {nb('เอแม็ท')} {nb('คำคม')} และ{nb('ซูโดกุ')} ร่วมจัดและรับรองการแข่งขันที่เปิดเวทีให้เยาวชนและประชาชนได้ฝึกคิด วางแผน และแข่งขันอย่างเป็นธรรม</p>
          <div className="mt-7 flex flex-wrap gap-3"><Link to="/events" className="rounded bg-gold px-6 py-3 font-semibold text-navy-dark hover:brightness-110">ดูรายการแข่งขัน</Link>
            <Link to="/games" className="rounded border border-white/70 px-6 py-3 font-semibold hover:bg-white/10">อ่านกติกา</Link></div></div>
        <div className="mx-auto rounded-2xl bg-white p-4 shadow-xl"><Logo className="h-40 md:h-56" /></div></div></section>

    <div className="mx-auto max-w-6xl space-y-16 px-4 pt-14">
      <section><SectionTitle title="เกมที่สมาคมส่งเสริม" />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{games.map(g => (<li key={g.name} className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <p className="text-xs text-muted">{g.brand}</p><h3 className="mt-1 font-serif text-2xl font-bold text-navy-dark">{nb(g.name)}</h3><p className="mt-2 flex-1 text-sm text-muted">{nb(g.text)}</p>
          {g.to ? <Link to={g.to} className="mt-4 inline-flex items-center gap-1 font-medium text-navy hover:text-gold">ดูกติกา<ArrowRight className="h-4 w-4" /></Link> : <span className="mt-4 text-xs text-muted">ยังไม่มีเอกสารกติกาบนเว็บไซต์</span>}</li>))}</ul></section>

      <section><SectionTitle title="สิ่งที่สมาคมทำ" />
        <ul className="grid gap-4 md:grid-cols-2">{doing.map(d => (<li key={d.title} className="rounded-xl border-l-4 border-gold bg-gray-light p-5"><h3 className="text-lg">{nb(d.title)}</h3><p className="mt-2 text-muted">{nb(d.text)}</p>
          <a href={sources.find(s => s.id === d.src)?.url} className="mt-3 inline-flex items-center gap-1 text-sm text-navy underline" {...(d.src === 'rules' ? {} : { target: '_blank', rel: 'noopener noreferrer' })}>แหล่งที่มา</a></li>))}</ul></section>

      <section><SectionTitle title="เส้นทางรายการแข่งขันที่ปรากฏในข่าวประชาสัมพันธ์" />
        <p className="-mt-4 mb-8 max-w-3xl text-muted">คัดเฉพาะรายการที่ข่าวประชาสัมพันธ์ระบุชื่อสมาคมเป็นผู้ร่วมจัดหรือผู้รับรอง ไม่ใช่รายการครบถ้วนของทุกปี</p>
        <ol className="relative space-y-6 border-l-2 border-gold/50 pl-6">{timeline.map(m => (<li key={m.year} className="relative">
          <span className="absolute -left-[2.15rem] top-1 grid h-5 w-5 place-items-center rounded-full bg-gold ring-4 ring-white" aria-hidden="true" />
          <p className="font-semibold text-navy">พ.ศ. {m.yearBE} <span className="font-normal text-muted">(ค.ศ. {m.year})</span></p>
          <h3 className="mt-1 text-lg">{nb(m.title)}</h3><p className="mt-1 text-muted">{nb(m.text)}</p>
          <a href={m.src.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm text-navy underline">แหล่งข่าว: {m.src.label}<ExternalLink className="h-3.5 w-3.5" /></a></li>))}</ol></section>

      <section className="rounded-2xl bg-navy-dark p-8 text-white"><h2 className="text-2xl text-white">ร่วมเป็นส่วนหนึ่งของวงการเกมกีฬาทางปัญญา</h2>
        <p className="mt-2 max-w-2xl text-slate-300">ติดตามข่าว รายการแข่งขัน และอันดับนักกีฬาได้บนเว็บไซต์นี้ และติดตามความเคลื่อนไหวล่าสุดผ่านเพจ Facebook ของสมาคม</p>
        <div className="mt-6 flex flex-wrap gap-3"><Link to="/news" className="rounded bg-gold px-5 py-2.5 font-semibold text-navy-dark">ข่าวประชาสัมพันธ์</Link><Link to="/rankings" className="rounded border border-white/70 px-5 py-2.5 font-semibold">อันดับนักกีฬา</Link>
          <a href={site.social[0].url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded border border-white/70 px-5 py-2.5 font-semibold"><Facebook className="h-4 w-4" />Facebook สมาคม</a></div></section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6"><h2 className="flex items-center gap-2 font-sans text-lg text-amber-900"><Info className="h-5 w-5" />ข้อมูลที่รอการยืนยันจากสมาคม</h2>
          <p className="mt-2 text-sm text-amber-900">เพื่อความถูกต้อง เรายังไม่เผยแพร่ข้อมูลต่อไปนี้จนกว่าสมาคมจะยืนยัน</p><ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-amber-900">{pending.map(p => <li key={p}>{nb(p)}</li>)}</ul></div>
        <div className="rounded-xl border border-slate-200 bg-white p-6"><h2 className="font-sans text-lg">แหล่งข้อมูลอ้างอิง</h2>
          <ul className="mt-3 space-y-2 text-sm">{sources.map(s => <li key={s.id}><a href={s.url} className="text-navy underline" {...(s.url.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{s.label}</a></li>)}</ul></div></section>
    </div></>);
}
