import type { ReactNode } from 'react';
import Th from './Th';
import { nb } from '../../utils/labels';
import FloatingTiles from './FloatingTiles';

export default function PageHeader({ title, desc, kicker, children }: { title: string; desc?: string | string[]; kicker?: string; children?: ReactNode }) {
  return (<section className="relative overflow-hidden bg-gradient-to-br from-navy-deep via-navy-dark to-navy text-white">
    <div className="grid-pattern absolute inset-0" aria-hidden="true" /><div className="hero-glow absolute inset-0" aria-hidden="true" />
    <FloatingTiles className="hidden md:block" />
    <div className="relative mx-auto max-w-6xl px-4 pb-12 pt-10 md:pb-16 md:pt-14">
      {kicker && <p className="mb-2 animate-fade-up text-sm font-medium tracking-wide text-gold">{kicker}</p>}
      <h1 className="animate-fade-up text-3xl text-white md:text-5xl">{nb(title)}</h1>
      <span className="mt-4 block h-1 w-16 origin-left animate-fade-up rounded-full bg-gradient-to-r from-gold to-flame" style={{ animationDelay: '80ms' }} />
      {desc && <p className="mt-4 max-w-2xl animate-fade-up text-slate-200 md:text-lg" style={{ animationDelay: '120ms' }}>{Array.isArray(desc) ? <Th parts={desc.map(nb)} /> : nb(desc)}</p>}
      {children}</div>
    <svg className="absolute -bottom-px left-0 w-full text-surface" viewBox="0 0 1440 40" preserveAspectRatio="none" aria-hidden="true"><path fill="currentColor" d="M0 40h1440V18C1200 38 960 0 720 10S240 34 0 14z" /></svg>
  </section>);
}
