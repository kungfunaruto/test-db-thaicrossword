import { useEffect, useRef, useState } from 'react';
import { ListOrdered } from 'lucide-react';
import { nb } from '../../utils/labels';
import { useLang } from '../../i18n';

/** Highlights the section currently being read (the last section whose top has passed ~30% of the screen). */
export function useScrollSpy(ids: string[]) {
  const [active, setActive] = useState(ids[0] ?? '');
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let raf = 0;
    const run = () => {
      raf = 0; const line = window.innerHeight * 0.3; let cur = ids[0];
      for (const id of ids) { const el = document.getElementById(id); if (el && el.getBoundingClientRect().top - line <= 0) cur = id; }
      const atEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      setActive(atEnd ? ids[ids.length - 1] : cur);
      const first = document.getElementById(ids[0]), last = document.getElementById(ids[ids.length - 1]);
      if (first && last) { const start = first.offsetTop - line, end = last.offsetTop + last.offsetHeight - window.innerHeight; setProgress(Math.min(1, Math.max(0, (window.scrollY - start) / Math.max(1, end - start)))); }
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(run); };
    run(); window.addEventListener('scroll', on, { passive: true }); window.addEventListener('resize', on);
    return () => { window.removeEventListener('scroll', on); window.removeEventListener('resize', on); cancelAnimationFrame(raf); };
  }, [ids.join('|')]); // eslint-disable-line react-hooks/exhaustive-deps
  return { active, progress };
}
const go = (id: string) => { const el = document.getElementById(id); if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); history.replaceState(null, '', `#${id}`); } };

/** Desktop: sticky side panel with numbered items, a moving highlight and a reading-progress bar. */
export function TocSidebar({ items, accent }: { items: { id: string; title: string }[]; accent: string }) {
  const { t } = useLang();
  const { active, progress } = useScrollSpy(items.map(i => i.id));
  return (<nav aria-label={t.rules.toc} className="card sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto p-4">
    <p className="mb-1 flex items-center gap-2 font-semibold text-navy-dark"><ListOrdered className="h-4 w-4" style={{ color: accent }} />{t.rules.toc}</p>
    <div className="mb-3 flex items-center gap-2 text-xs text-muted"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-light"><div className="h-full rounded-full transition-[width] duration-200" style={{ width: `${progress * 100}%`, background: accent }} /></div>{Math.round(progress * 100)}%</div>
    <ol className="relative space-y-0.5 border-l-2 border-line">{items.map((s, i) => { const on = s.id === active; return (<li key={s.id}>
      <a href={`#${s.id}`} onClick={e => { e.preventDefault(); go(s.id); }} aria-current={on ? 'location' : undefined}
        className={`-ml-0.5 flex gap-2 border-l-2 py-1.5 pl-3 pr-2 text-sm transition-all duration-300 ${on ? 'translate-x-0.5 font-semibold text-navy-dark' : 'border-transparent text-muted hover:text-navy'}`} style={on ? { borderColor: accent, background: `${accent}12` } : undefined}>
        <span className={`w-5 shrink-0 text-right tabular-nums ${on ? '' : 'text-slate-400'}`} style={on ? { color: accent } : undefined}>{i + 1}</span><span>{nb(s.title)}</span></a></li>); })}</ol></nav>);
}

/** Phone/tablet: sticky chip bar under the header; the active chip scrolls into view automatically. */
export function TocChips({ items, accent }: { items: { id: string; title: string }[]; accent: string }) {
  const { t } = useLang();
  const { active, progress } = useScrollSpy(items.map(i => i.id));
  const bar = useRef<HTMLUListElement>(null);
  useEffect(() => { const el = bar.current?.querySelector<HTMLElement>(`[data-id="${active}"]`); if (el && bar.current) bar.current.scrollTo({ left: el.offsetLeft - bar.current.clientWidth / 2 + el.offsetWidth / 2, behavior: 'smooth' }); }, [active]);
  return (<nav aria-label={t.rules.toc} className="sticky top-[58px] z-20 -mx-4 border-b border-line bg-surface/90 px-4 pb-2 pt-2 backdrop-blur lg:hidden">
    <ul ref={bar} className="scrollbar-none flex gap-2 overflow-x-auto">{items.map((s, i) => { const on = s.id === active; return (<li key={s.id} data-id={s.id} className="shrink-0">
      <a href={`#${s.id}`} onClick={e => { e.preventDefault(); go(s.id); }} aria-current={on ? 'location' : undefined}
        className={`block whitespace-nowrap rounded-full border px-3 py-1.5 text-sm transition ${on ? 'border-transparent text-white shadow' : 'border-line bg-white text-ink'}`} style={on ? { background: accent } : undefined}>{i + 1}. {nb(s.title)}</a></li>); })}</ul>
    <div className="absolute inset-x-0 bottom-0 h-0.5"><div className="h-full transition-[width] duration-200" style={{ width: `${progress * 100}%`, background: accent }} /></div></nav>);
}
