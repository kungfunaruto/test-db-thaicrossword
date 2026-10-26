import { NavLink, Outlet } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { ToastProvider } from '../../components/common/Toast';
import { signOut } from '../../services/adminService';
const links = [['/admin', 'แดชบอร์ด'], ['/admin/news', 'จัดการข่าว'], ['/admin/events', 'จัดการกิจกรรม'], ['/admin/rankings', 'นักกีฬาและอันดับ'], ['/admin/qa', 'จัดการถาม-ตอบ (Q&A)']];
export default function AdminLayout() {
  const cls = ({ isActive }: { isActive: boolean }) =>
    `whitespace-nowrap rounded px-3 py-2 text-sm ${isActive ? 'bg-navy text-gold' : 'text-white hover:text-gold'}`;
  return (<ToastProvider><div className="flex min-h-screen flex-col md:flex-row">
    <aside className="bg-navy-dark p-3 md:w-60 md:shrink-0">
      <p className="whitespace-nowrap px-3 py-2 font-semibold text-white">ระบบจัดการเว็บไซต์</p>
      <nav aria-label="เมนูผู้ดูแล" className="flex gap-1 overflow-x-auto md:flex-col">
        {links.map(([to, label]) => <NavLink key={to} to={to} end={to === '/admin'} className={cls}>{label}</NavLink>)}
        <button onClick={() => signOut()} className="flex items-center gap-2 whitespace-nowrap px-3 py-2 text-sm text-white hover:text-gold"><LogOut className="h-4 w-4" />ออกจากระบบ</button>
      </nav></aside>
    <main className="min-w-0 flex-1 bg-gray-light p-4 md:p-8"><Outlet /></main></div></ToastProvider>);
}
