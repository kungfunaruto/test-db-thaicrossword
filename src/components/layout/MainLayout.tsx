import { Suspense, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { ArrowUp, Facebook, Menu, X } from 'lucide-react';
import Th from '../common/Th';
import TopProgress from '../common/TopProgress';
import { site } from '../../config/site';
import { useLang } from '../../i18n';
import { prefetchRoute } from '../../lib/prefetch';
import { trackPageView } from '../../lib/analytics';
import { LoadingState } from '../common/States';

/** Transparent emblem (background removed). Only the height is set; width follows the image's aspect ratio. */
export function Logo({ className }: { className: string }) {
  const { t } = useLang();
  return <img src="/logo/tca-logo-256.webp" alt={t.site.logoAlt} width={315} height={256} className={`${className} w-auto max-w-full shrink-0 object-contain drop-shadow-sm`} />;
}

const NAV = ['/', '/about', '/news', '/games', '/events', '/rankings', '/qa'] as const;
const navKey = { '/': 'home', '/about': 'about', '/news': 'news', '/games': 'games', '/events': 'events', '/rankings': 'rankings', '/qa': 'qa' } as const;

function LangSwitch({ dark = false }: { dark?: boolean }) {
  const { lang, setLang, t } = useLang();
  return (<div role="group" aria-label="Language / ภาษา" className={`relative inline-flex rounded-full p-0.5 text-xs font-semibold ${dark ? 'bg-white/10 ring-1 ring-white/20' : 'bg-gray-light ring-1 ring-line'}`}>
    <span aria-hidden="true" className={`absolute bottom-0.5 top-0.5 w-[calc(50%-2px)] rounded-full bg-gold shadow transition-transform duration-300 ${lang === 'en' ? 'translate-x-full' : ''}`} />
    {(['th', 'en'] as const).map(l => <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)} title={l === lang ? undefined : t.switchAria}
      className={`relative z-10 w-10 rounded-full py-1 transition-colors ${lang === l ? 'text-navy-deep' : dark ? 'text-white/80 hover:text-white' : 'text-muted hover:text-navy'}`}>{l.toUpperCase()}</button>)}</div>);
}

function Header() {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => { const on = () => setScrolled(window.scrollY > 90); on(); window.addEventListener('scroll', on, { passive: true }); return () => window.removeEventListener('scroll', on); }, []);
  const link = ({ isActive }: { isActive: boolean }) =>
    `relative block whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-medium transition-colors xl:px-4 ${isActive ? 'bg-white/10 text-gold' : 'text-white/90 hover:bg-white/5 hover:text-white'}`;
  return (<>
    <div className="hidden border-b border-line bg-white lg:block"><div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-3">
      <Link to="/" className="flex min-w-0 items-center gap-4"><Logo className="h-[68px] transition duration-300 hover:scale-[1.03]" />
        <span className="min-w-0"><span className="block font-display text-[1.35rem] font-medium leading-8 text-navy-dark"><Th parts={t.site.parts} /></span>
          <span className="block text-sm text-muted">{t.site.secondary}</span></span></Link>
      <div className="flex shrink-0 items-center gap-3">
        {site.social[0] && <a href={site.social[0].url} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="grid h-9 w-9 place-items-center rounded-full bg-gray-light text-navy ring-1 ring-line transition hover:bg-[#1877F2] hover:text-white"><Facebook className="h-4 w-4" /></a>}
        <LangSwitch /></div></div></div>
    <header className={`sticky top-0 z-30 border-b-2 border-gold bg-navy-dark/95 backdrop-blur transition-shadow ${scrolled ? 'shadow-lg' : ''}`}>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2 lg:hidden">
        <Link to="/" aria-label={t.nav.home} className="flex min-w-0 items-center gap-2.5"><Logo className="h-10" />
          <span className="truncate font-display text-sm font-medium text-white">{t.site.short}</span></Link>
        <div className="flex items-center gap-2"><LangSwitch dark />
          <button className="grid h-10 w-10 place-items-center rounded-full text-white transition hover:bg-white/10" aria-label={open ? t.nav.close : t.nav.open} aria-expanded={open} onClick={() => setOpen(!open)}>
            <span className="relative h-6 w-6">{open ? <X className="absolute inset-0 animate-scale-in" /> : <Menu className="absolute inset-0 animate-scale-in" />}</span></button></div></div>
      <nav aria-label={t.nav.main} className={`${open ? 'grid' : 'hidden'} lg:block`}>
        <ul className="mx-auto max-w-6xl animate-slide-down px-3 pb-3 lg:flex lg:animate-none lg:items-center lg:gap-1 lg:px-4 lg:py-1.5">
          <li className={`hidden transition-all duration-300 lg:block ${scrolled ? 'mr-2 w-9 opacity-100' : 'w-0 overflow-hidden opacity-0'}`}><Link to="/" aria-label={t.nav.home} tabIndex={scrolled ? 0 : -1}><Logo className="h-9" /></Link></li>
          {NAV.map((to, i) => <li key={to} style={{ animationDelay: `${i * 30}ms` }} className="animate-fade-up lg:animate-none">
            <NavLink to={to} end={to === '/'} className={link} onMouseEnter={() => prefetchRoute(to)} onFocus={() => prefetchRoute(to)} onTouchStart={() => prefetchRoute(to)}>{t.nav[navKey[to]]}</NavLink></li>)}</ul></nav></header></>);
}

function Footer() {
  const { t } = useLang();
  return (<footer className="relative mt-24 overflow-hidden bg-navy-deep text-sm text-slate-300">
    <div className="h-1 bg-gradient-to-r from-gold via-flame to-gold" />
    <div className="grid-pattern absolute inset-0 opacity-40" aria-hidden="true" />
    <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-[1.4fr_1fr]">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center"><Logo className="h-24" />
        <div><p className="font-display text-lg font-medium text-white"><Th parts={t.site.parts} /></p><p className="mt-1 text-xs text-slate-400">{t.site.secondary}</p>
          <p className="mt-3 text-slate-400">{t.footer.about}</p></div></div>
      <div><p className="mb-3 font-semibold text-white">{t.footer.contact}</p>
        {site.contact ? <div className="space-y-1">{site.contact.address && <p>{site.contact.address}</p>}{site.contact.phone && <p>{site.contact.phone}</p>}{site.contact.email && <p>{site.contact.email}</p>}</div>
          : <p className="text-slate-400">{t.footer.pending}</p>}
        {site.social.map(s => <a key={s.url} className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 ring-1 ring-white/10 transition hover:bg-[#1877F2] hover:text-white" href={s.url} target="_blank" rel="noopener noreferrer">
          <Facebook className="h-4 w-4" />{t.footer.facebook}</a>)}</div></div>
    <p className="relative border-t border-white/10 px-16 py-5 text-center text-xs text-slate-400 sm:px-4">© {new Date().getFullYear()} {t.site.name}</p></footer>);
}

function BackToTop() {
  const { t } = useLang();
  const [show, setShow] = useState(false);
  useEffect(() => { const on = () => setShow(window.scrollY > 700); window.addEventListener('scroll', on, { passive: true }); return () => window.removeEventListener('scroll', on); }, []);
  return (<button type="button" aria-label={t.common.backToTop} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    className={`fixed bottom-5 right-5 z-30 grid h-11 w-11 place-items-center rounded-full bg-navy text-gold shadow-lift transition duration-300 hover:-translate-y-0.5 ${show ? 'opacity-100' : 'pointer-events-none translate-y-4 opacity-0'}`}><ArrowUp className="h-5 w-5" /></button>);
}

/** Scroll to top on page change, record the page view, and fade each page in. */
export default function MainLayout() {
  const { pathname } = useLocation(); const { lang } = useLang();
  useEffect(() => { window.scrollTo(0, 0); trackPageView(pathname, lang).catch(() => {}); }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps
  return (<div className="flex min-h-screen flex-col"><TopProgress /><Header />
    <main className="flex-1"><Suspense fallback={<div className="py-24"><LoadingState /></div>}><div key={pathname} className="animate-fade-in"><Outlet /></div></Suspense></main>
    <Footer /><BackToTop /></div>);
}
