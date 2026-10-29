import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLang } from '../../i18n';
/** Phone: vertical stack of compact cards. sm and up: ONE horizontal row that never wraps, scrollable with arrows, touch or trackpad. */
export default function CardRow({ children, label }: { children: ReactNode; label: string }) {
  const { t } = useLang();
  const ref = useRef<HTMLUListElement>(null);
  const [edge, setEdge] = useState({ left: false, right: false });
  const update = useCallback(() => {
    const el = ref.current; if (!el) return;
    setEdge({ left: el.scrollLeft > 4, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
  }, []);
  useEffect(() => {
    update(); const el = ref.current; if (!el) return;
    const ro = new ResizeObserver(update); ro.observe(el); window.addEventListener('resize', update);
    return () => { ro.disconnect(); window.removeEventListener('resize', update); };
  }, [update, children]);
  const go = (dir: 1 | -1) => { const el = ref.current; if (el) el.scrollBy({ left: dir * Math.max(288, el.clientWidth * 0.8), behavior: 'smooth' }); };
  const btn = 'absolute top-[38%] z-10 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-line bg-white/95 text-navy shadow-lift backdrop-blur transition hover:scale-105 hover:text-gold-dark sm:grid';
  return (<div className="relative">
    <ul ref={ref} onScroll={update} aria-label={label} className="stagger scrollbar-none flex flex-col gap-3 sm:-mx-2 sm:snap-x sm:snap-mandatory sm:flex-row sm:flex-nowrap sm:gap-5 sm:overflow-x-auto sm:scroll-smooth sm:px-2 sm:pb-4 sm:pt-2">{children}</ul>
    {edge.left && <button type="button" aria-label={t.common.scrollLeft} onClick={() => go(-1)} className={`${btn} -left-5 animate-fade-in`}><ChevronLeft className="h-5 w-5" /></button>}
    {edge.right && <button type="button" aria-label={t.common.scrollRight} onClick={() => go(1)} className={`${btn} -right-5 animate-fade-in`}><ChevronRight className="h-5 w-5" /></button>}</div>);
}
