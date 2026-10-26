import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchDashboard, type Dashboard, type Recent } from '../../services/adminService';
import { ErrorState, LoadingState } from '../../components/common/States';

const Stat = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-lg border border-slate-200 bg-white p-4"><p className="text-sm text-muted">{label}</p><p className="mt-1 text-3xl font-semibold text-navy">{value}</p></div>);
const List = ({ title, items }: { title: string; items: Recent[] }) => (
  <section className="min-w-0 rounded-lg border border-slate-200 bg-white p-4"><h2 className="mb-2 font-sans text-base">{title}</h2>
    {items.length === 0 ? <p className="text-sm text-muted">ยังไม่มีข้อมูล</p> : <ul className="space-y-1 text-sm">{items.map(i => <li key={i.id} className="truncate">{i.title}</li>)}</ul>}</section>);

export default function AdminDashboardPage() {
  const [d, setD] = useState<Dashboard | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => { fetchDashboard().then(setD).catch(() => setFailed(true)); }, []);
  return (<div className="mx-auto max-w-5xl space-y-6"><h1 className="text-2xl">แดชบอร์ด</h1>
    <div className="flex flex-wrap gap-2">
      {[['/admin/news?new=1', 'เพิ่มข่าว'], ['/admin/events?new=1', 'เพิ่มกิจกรรม'], ['/admin/rankings?new=1', 'เพิ่มนักกีฬา'], ['/admin/qa?new=1', 'เพิ่มคำถาม Q&A']].map(([to, t]) =>
        <Link key={to} to={to} className="whitespace-nowrap rounded bg-navy px-4 py-2 text-sm text-white">{t}</Link>)}</div>
    {failed ? <ErrorState /> : !d ? <LoadingState /> : <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Stat label="ข่าวทั้งหมด" value={d.counts.news} /><Stat label="ข่าวที่เผยแพร่" value={d.counts.newsPublished} />
        <Stat label="กิจกรรมทั้งหมด" value={d.counts.events} /><Stat label="กิจกรรมที่กำลังจะมาถึง" value={d.counts.eventsUpcoming} />
        <Stat label="นักกีฬาในระบบ" value={d.counts.athletes} /><Stat label="คำถาม Q&A" value={d.counts.faqs} /></div>
      <div className="grid gap-3 md:grid-cols-3">
        <List title="ข่าวล่าสุด" items={d.recent.news} /><List title="กิจกรรมล่าสุด" items={d.recent.events} /><List title="นักกีฬาที่เพิ่มล่าสุด" items={d.recent.athletes} /></div></>}
  </div>);
}
