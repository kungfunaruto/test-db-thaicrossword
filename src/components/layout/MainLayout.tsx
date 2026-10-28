import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { Menu, X, Landmark } from 'lucide-react';
import Th from '../common/Th';
import { nav, nameParts, site } from '../../config/site';

/** The official logo is shown as supplied: only height is set, width stays "auto" so the aspect ratio is never distorted. */
export function Logo({ className }: { className: string }) {
  return site.logoUrl
    ? <img src={site.logoUrl} alt={`ตราสัญลักษณ์ ${site.nameTh}`} width={site.logoSize.width} height={site.logoSize.height} className={`${className} w-auto shrink-0`} />
    : <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full border-2 border-dashed border-gold text-gold"><Landmark className="h-6 w-6" /></span>;
}
function Header() {
  const [open, setOpen] = useState(false);
  const link = ({ isActive }: { isActive: boolean }) =>
    `block whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${isActive ? 'border-gold text-gold' : 'border-transparent text-white hover:text-gold'}`;
  return (<>
    <div className="hidden bg-white lg:block"><div className="mx-auto max-w-6xl px-4 py-3">
      <Link to="/" className="flex min-w-0 items-center gap-4"><Logo className="h-16" />
        <span className="min-w-0"><span className="block font-serif text-xl font-bold text-navy-dark"><Th parts={nameParts} /></span>
          <span className="block text-sm text-muted">{site.nameEn}</span></span></Link></div></div>
    <header className="sticky top-0 z-30 border-b-4 border-gold bg-navy-dark shadow-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2 lg:hidden">
        <Link to="/" aria-label={`หน้าแรก ${site.nameTh}`} className="rounded-lg bg-white p-1"><Logo className="h-9" /></Link>
        <button className="rounded p-2 text-white" aria-label={open ? 'ปิดเมนู' : 'เปิดเมนู'} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button></div>
      <nav aria-label="เมนูหลัก" className={`${open ? 'block' : 'hidden'} lg:block`}>
        <ul className="mx-auto max-w-6xl px-2 pb-2 lg:flex lg:pb-0">{nav.map(n => <li key={n.to}><NavLink to={n.to} end={n.to === '/'} className={link} onClick={() => setOpen(false)}>{n.label}</NavLink></li>)}</ul></nav></header></>);
}
function Footer() {
  return (<footer className="mt-20 border-t-4 border-gold bg-navy-dark text-sm text-slate-300">
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-3">
      <div><span className="inline-block rounded-lg bg-white p-2"><Logo className="h-20" /></span>
        <p className="mt-4 font-serif text-lg font-bold text-white"><Th parts={nameParts} /></p><p className="mt-1 text-xs text-slate-400">{site.nameEn}</p></div>
      <div><p className="mb-3 font-semibold text-white">เมนูลัด</p><ul className="space-y-1">{nav.map(n => <li key={n.to}><Link className="hover:text-gold" to={n.to}>{n.label}</Link></li>)}</ul></div>
      <div><p className="mb-3 font-semibold text-white">ติดต่อและติดตามสมาคม</p>
        {site.contact ? <div className="space-y-1">{site.contact.address && <p>{site.contact.address}</p>}{site.contact.phone && <p>{site.contact.phone}</p>}{site.contact.email && <p>{site.contact.email}</p>}</div>
          : <p className="text-slate-400">ข้อมูลติดต่ออยู่ระหว่างรอการยืนยันจากสมาคม</p>}
        {site.social.length > 0 && <ul className="mt-3 space-y-1">{site.social.map(s => <li key={s.url}><a className="hover:text-gold" href={s.url} target="_blank" rel="noopener noreferrer">{s.label}</a></li>)}</ul>}</div></div>
    <p className="border-t border-navy py-4 text-center text-slate-400">© {new Date().getFullYear()} {site.nameTh}</p></footer>);
}
export default function MainLayout() {
  return (<div className="flex min-h-screen flex-col"><Header /><main className="flex-1"><Outlet /></main><Footer /></div>);
}
