import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
/** Phone: vertical stack of compact cards. sm and up: ONE horizontal row that never wraps, scrollable with arrows, touch or trackpad. */
export default function CardRow({ children, label }: { children: ReactNode; label: string }) {
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
  const go = (dir: 1 | -1) => { const el = ref.current; if (el) el.scrollBy({ left: dir * Math.max(256, el.clientWidth * 0.8), behavior: 'smooth' }); };
  const btn = 'absolute top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-slate-200 bg-white text-navy shadow-md hover:text-gold sm:grid';
  return (<div className="relative">
    <ul ref={ref} onScroll={update} aria-label={label} className="flex flex-col gap-2.5 sm:snap-x sm:snap-mandatory sm:flex-row sm:flex-nowrap sm:gap-4 sm:overflow-x-auto sm:scroll-smooth sm:pb-3">{children}</ul>
    {edge.left && <button type="button" aria-label="เลื่อนไปทางซ้าย" onClick={() => go(-1)} className={`${btn} -left-4`}><ChevronLeft className="h-5 w-5" /></button>}
    {edge.right && <button type="button" aria-label="เลื่อนไปทางขวา" onClick={() => go(1)} className={`${btn} -right-4`}><ChevronRight className="h-5 w-5" /></button>}</div>);
}
