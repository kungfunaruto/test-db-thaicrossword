import { Suspense, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { ExternalLink, LayoutDashboard, LogOut, Medal, Menu, MessageCircleQuestion, Newspaper, Trophy, X, type LucideIcon } from 'lucide-react';
import { ToastProvider } from '../../components/common/Toast';
import TopProgress from '../../components/common/TopProgress';
import { LoadingState } from '../../components/common/States';
import { fetchNewQuestionCount, signOut } from '../../services/adminService';
import { supabase } from '../../services/supabase';

const LINKS: [string, string, LucideIcon][] = [['/admin', 'แดชบอร์ด', LayoutDashboard], ['/admin/news', 'จัดการข่าว', Newspaper], ['/admin/events', 'จัดการการแข่งขัน', Trophy],
  ['/admin/rankings', 'นักกีฬาและอันดับ', Medal], ['/admin/qa', 'จัดการถาม-ตอบ (Q&A)', MessageCircleQuestion]];

/** Number of unanswered visitor questions, refreshed every 2 minutes and whenever the Q&A page changes it. */
export const QUESTIONS_CHANGED = 'tca-questions-changed';
function useNewQuestions() {
  const [n, setN] = useState(0);
  useEffect(() => {
    const load = () => { fetchNewQuestionCount().then(setN).catch(() => {}); };
    load(); const id = setInterval(load, 120_000); window.addEventListener(QUESTIONS_CHANGED, load);
    return () => { clearInterval(id); window.removeEventListener(QUESTIONS_CHANGED, load); };
  }, []);
  return n;
}

export default function AdminLayout() {
  const [open, setOpen] = useState(false); const [email, setEmail] = useState('');
  const { pathname } = useLocation(); const newQ = useNewQuestions();
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => { supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? '')); document.title = 'ระบบจัดการเว็บไซต์'; }, []);
  const cls = ({ isActive }: { isActive: boolean }) => `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-white/10 text-gold shadow-inset' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`;
  const nav = (<nav aria-label="เมนูผู้ดูแล" className="flex flex-col gap-1">{LINKS.map(([to, label, Icon]) => (
    <NavLink key={to} to={to} end={to === '/admin'} className={cls}><Icon className="h-[18px] w-[18px] shrink-0 transition group-hover:scale-110" /><span className="flex-1">{label}</span>
      {to === '/admin/qa' && newQ > 0 && <span className="animate-pop rounded-full bg-flame px-2 text-xs font-semibold text-white" title="คำถามใหม่จากผู้ใช้">{newQ}</span>}</NavLink>))}</nav>);
  const side = (<div className="flex h-full flex-col gap-6 p-4">
    <Link to="/admin" className="flex items-center gap-3 px-1"><img src="/logo/tca-logo-256.webp" alt="" className="h-10 w-auto" /><span><span className="block font-display font-medium leading-5 text-white">ระบบจัดการเว็บไซต์</span><span className="text-xs text-slate-400">TCA Admin</span></span></Link>
    {nav}
    <div className="mt-auto space-y-1 border-t border-white/10 pt-4 text-sm">
      {email && <p className="truncate px-3 pb-2 text-xs text-slate-400">{email}</p>}
      <a href="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl px-3 py-2 text-slate-300 hover:bg-white/5 hover:text-white"><ExternalLink className="h-4 w-4" />ดูหน้าเว็บไซต์</a>
      <button onClick={() => signOut()} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-slate-300 hover:bg-white/5 hover:text-white"><LogOut className="h-4 w-4" />ออกจากระบบ</button></div></div>);
  return (<ToastProvider><TopProgress /><div className="min-h-screen bg-surface md:flex">
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 bg-navy-deep md:block">{side}</aside>
    <div className="sticky top-0 z-30 flex items-center justify-between bg-navy-deep px-4 py-2.5 md:hidden">
      <span className="flex items-center gap-2 font-display text-white"><img src="/logo/tca-logo-256.webp" alt="" className="h-8 w-auto" />ระบบจัดการเว็บไซต์</span>
      <button onClick={() => setOpen(true)} aria-label="เปิดเมนู" className="relative grid h-10 w-10 place-items-center rounded-full text-white hover:bg-white/10"><Menu />{newQ > 0 && <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-flame" />}</button></div>
    {open && <div className="fixed inset-0 z-50 md:hidden"><div className="absolute inset-0 animate-fade-in bg-black/50" onClick={() => setOpen(false)} />
      <aside className="absolute inset-y-0 left-0 w-72 animate-[slide-down_.25s_ease] bg-navy-deep shadow-2xl"><button onClick={() => setOpen(false)} aria-label="ปิดเมนู" className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full text-white hover:bg-white/10"><X className="h-5 w-5" /></button>{side}</aside></div>}
    <main className="min-w-0 flex-1 p-4 md:p-8"><Suspense fallback={<LoadingState text="กำลังโหลด..." />}><div key={pathname} className="animate-fade-in"><Outlet /></div></Suspense></main></div></ToastProvider>);
}
