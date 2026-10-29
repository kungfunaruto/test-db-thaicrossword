import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Activity, CalendarDays, Clock, Eye, Globe2, Medal, MessageCircleQuestion, MonitorSmartphone, Newspaper, RefreshCw, Trophy, Users, type LucideIcon } from 'lucide-react';
import { fetchAnalytics, fetchCounts, type Analytics, type Counts } from '../../services/adminService';
import { ErrorState } from '../../components/common/States';
import { fmtDate } from '../../lib/dates';
import { BarList, compact, HourColumns, LineChart, SplitBar } from './charts';
import { AdminHeader, Pills } from './ui';

const PAGE_NAMES: Record<string, string> = { '/': 'หน้าแรก', '/about': 'เกี่ยวกับสมาคม', '/news': 'ข่าวประชาสัมพันธ์', '/events': 'การแข่งขัน', '/games': 'เกมและกติกา',
  '/games/crossword': 'กติกาครอสเวิร์ด', '/games/a-math': 'กติกาเอแม็ท', '/games/kumkom': 'กติกาคำคม', '/rankings': 'อันดับนักกีฬา', '/qa': 'ถาม-ตอบ' };
const DEVICE: Record<string, string> = { mobile: 'มือถือ', desktop: 'คอมพิวเตอร์', tablet: 'แท็บเล็ต', unknown: 'ไม่ทราบ' };

function Tile({ label, value, Icon, to, sub, tone = 'navy' }: { label: string; value: number | string; Icon: LucideIcon; to?: string; sub?: ReactNode; tone?: 'navy' | 'live' }) {
  const body = (<><div className="flex items-center justify-between"><p className="text-sm text-muted">{label}</p>
    <span className={`grid h-9 w-9 place-items-center rounded-xl ${tone === 'live' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-light text-navy'}`}><Icon className="h-[18px] w-[18px]" /></span></div>
    <p className="mt-2 font-sans text-3xl font-semibold text-navy-dark">{typeof value === 'number' ? value.toLocaleString() : value}</p>{sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}</>);
  const cls = 'card block p-5 transition hover:-translate-y-0.5 hover:shadow-lift';
  return to ? <Link to={to} className={cls}>{body}</Link> : <div className={cls}>{body}</div>;
}
const Card = ({ title, Icon, children, className = '' }: { title: string; Icon: LucideIcon; children: ReactNode; className?: string }) => (
  <section className={`card p-5 ${className}`}><h2 className="mb-4 flex items-center gap-2 font-sans text-base font-semibold"><Icon className="h-4 w-4 text-gold-dark" />{title}</h2>{children}</section>);

export default function AdminDashboardPage() {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [days, setDays] = useState<'7' | '30' | '90'>('30');
  const [a, setA] = useState<Analytics | null>(null); const [err, setErr] = useState(false); const [loading, setLoading] = useState(false);
  const load = () => { setLoading(true); setErr(false); fetchAnalytics(Number(days)).then(setA).catch(() => setErr(true)).finally(() => setLoading(false)); };
  useEffect(() => { fetchCounts().then(setCounts).catch(() => {}); }, []);
  useEffect(load, [days]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const id = setInterval(load, 60_000); return () => clearInterval(id); }, [days]); // eslint-disable-line react-hooks/exhaustive-deps
  const pageName = (path: string) => { const m = /^\/(news|events)\/(.+)$/.exec(path);
    if (m) { const list = m[1] === 'news' ? a?.top_news : a?.top_events; const hit = list?.find(x => x.id === m[2]); return `${m[1] === 'news' ? 'ข่าว' : 'การแข่งขัน'}: ${hit?.title ?? 'รายการ'}`; }
    return PAGE_NAMES[path] ?? path; };
  const pagesPerVisit = a && a.range.sessions ? (a.range.views / a.range.sessions).toFixed(1) : '—';
  return (<div className="mx-auto max-w-6xl space-y-8">
    <AdminHeader title="แดชบอร์ด" sub="ภาพรวมข้อมูลในระบบและสถิติผู้เข้าชมเว็บไซต์" />
    <section className="stagger grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Tile label="ข่าวทั้งหมด" value={counts?.news ?? '—'} Icon={Newspaper} to="/admin/news" /><Tile label="การแข่งขันทั้งหมด" value={counts?.events ?? '—'} Icon={Trophy} to="/admin/events" />
      <Tile label="นักกีฬาในระบบ" value={counts?.athletes ?? '—'} Icon={Medal} to="/admin/rankings" /><Tile label="คำถาม Q&A" value={counts?.faqs ?? '—'} Icon={MessageCircleQuestion} to="/admin/qa" /></section>

    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-2xl"><Activity className="h-6 w-6 text-gold-dark" />สถิติผู้เข้าชม</h2>
        <div className="flex items-center gap-2"><Pills value={days} onChange={setDays} options={[{ value: '7', label: '7 วัน' }, { value: '30', label: '30 วัน' }, { value: '90', label: '90 วัน' }]} />
          <button onClick={load} aria-label="รีเฟรช" className="grid h-9 w-9 place-items-center rounded-full border border-line bg-white text-navy hover:bg-gray-light"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></button></div></div>
      {err && !a ? <ErrorState text="โหลดสถิติไม่สำเร็จ (ตรวจว่ารัน migration ล่าสุดแล้ว)" onRetry={load} /> : !a ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-hidden="true">{Array.from({ length: 8 }, (_, i) => <div key={i} className={`skeleton rounded-2xl ${i > 3 ? 'col-span-2 h-64' : 'h-28'}`} />)}</div>) : (
        <div className={`space-y-4 transition-opacity ${loading ? 'opacity-60' : ''}`}>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Tile tone="live" label="กำลังออนไลน์" value={a.online_now} Icon={Users} sub={<span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />ใน 5 นาทีล่าสุด</span>} />
            <Tile label="ผู้เข้าชมวันนี้" value={a.today.visitors} Icon={Eye} sub={`${a.today.views.toLocaleString()} หน้า · ${a.today.sessions.toLocaleString()} ครั้งที่เข้าชม`} />
            <Tile label="ผู้เข้าชมเดือนนี้" value={a.month.visitors} Icon={CalendarDays} sub={`${a.month.views.toLocaleString()} หน้า`} />
            <Tile label="ผู้เข้าชมทั้งหมด" value={a.all_time.visitors} Icon={Globe2} sub={`${compact(a.all_time.views)} หน้า${a.all_time.since ? ` · ตั้งแต่ ${fmtDate(a.all_time.since, 'th', 'medium')}` : ''}`} /></div>
          <Card title={`ผู้เข้าชมรายวัน (${a.days} วันล่าสุด)`} Icon={Activity}>
            <div className="mb-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">{[[`ผู้เข้าชม`, a.range.visitors], ['ผู้เข้าชมใหม่', a.range.new_visitors], ['หน้าที่ถูกเปิด', a.range.views], ['หน้าต่อการเข้าชม', pagesPerVisit]].map(([l, v]) => (
              <div key={String(l)} className="rounded-xl bg-gray-light px-3 py-2"><p className="text-xs text-muted">{l}</p><p className="text-lg font-semibold text-ink">{typeof v === 'number' ? v.toLocaleString() : v}</p></div>))}</div>
            <LineChart names={['ผู้เข้าชม (คน)', 'หน้าที่ถูกเปิด']} points={a.daily.map(d => ({ label: fmtDate(d.day, 'th', 'short').replace(/\s?\d{2,4}$/, ''), full: fmtDate(d.day, 'th'), values: [d.visitors, d.views] }))} /></Card>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="หน้าที่มีคนเข้าชมมากที่สุด" Icon={Eye}><BarList rows={a.top_pages.map(p => ({ key: p.path, label: pageName(p.path), value: p.views, sub: `${p.visitors} คน` }))} /></Card>
            <Card title="ช่วงเวลาที่มีคนเข้าชม (เวลาไทย)" Icon={Clock}><HourColumns hours={a.hours} /></Card>
            <Card title="ข่าวยอดนิยม" Icon={Newspaper}><BarList rows={a.top_news.map(n => ({ key: n.id, label: n.title ?? '(ข่าวที่ถูกลบ)', value: n.views, sub: `${n.visitors} คน` }))} empty="ยังไม่มีการเปิดอ่านข่าว" /></Card>
            <Card title="การแข่งขันยอดนิยม" Icon={Trophy}><BarList rows={a.top_events.map(n => ({ key: n.id, label: n.title ?? '(รายการที่ถูกลบ)', value: n.views, sub: `${n.visitors} คน` }))} empty="ยังไม่มีการเปิดดูการแข่งขัน" /></Card>
            <Card title="อุปกรณ์ที่ใช้" Icon={MonitorSmartphone}><SplitBar parts={['mobile', 'desktop', 'tablet'].map(d => ({ label: DEVICE[d], value: a.devices.find(x => x.device === d)?.visitors ?? 0 }))} /></Card>
            <Card title="ภาษาที่เลือกดู / แหล่งที่มา" Icon={Globe2}>
              <SplitBar parts={[{ label: 'ภาษาไทย', value: a.languages.find(l => l.lang === 'th')?.views ?? 0 }, { label: 'English', value: a.languages.find(l => l.lang === 'en')?.views ?? 0 }]} />
              <p className="mb-2 mt-5 text-xs font-medium text-muted">เข้ามาจาก (จำนวนการเข้าชม)</p>
              <BarList rows={a.referrers.map(r => ({ key: r.referrer || 'direct', label: r.referrer || 'เข้าโดยตรง / ไม่ทราบที่มา', value: r.sessions }))} /></Card></div>
          <p className="text-xs text-muted">นับแบบไม่ระบุตัวตน: ไม่เก็บ IP ไม่เก็บชื่อ ไม่นับการเข้าชมของผู้ดูแลที่ล็อกอินอยู่ · "ผู้เข้าชม" นับตามเบราว์เซอร์ · "การเข้าชม" สิ้นสุดเมื่อไม่มีการใช้งาน 30 นาที · อัปเดตอัตโนมัติทุก 1 นาที</p>
        </div>)}
    </section>
  </div>);
}
