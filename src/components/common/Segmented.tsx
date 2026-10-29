import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
/** Pill-style option switcher with an animated sliding highlight. Scrolls sideways on small screens. */
export default function Segmented<T extends string>({ value, onChange, options, label, size = 'md' }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode; dot?: string }[]; label: string; size?: 'sm' | 'md' }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null);
  useLayoutEffect(() => {
    const measure = () => { const el = wrap.current?.querySelector<HTMLButtonElement>('[aria-pressed="true"]'); if (el) setPill({ left: el.offsetLeft, width: el.offsetWidth }); };
    measure(); const ro = new ResizeObserver(measure); if (wrap.current) ro.observe(wrap.current); document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  }, [value, options.length]);
  const pad = size === 'sm' ? 'px-3 py-1 text-xs' : 'px-4 py-1.5 text-sm';
  return (<div className="scrollbar-none -mx-1 max-w-full overflow-x-auto px-1 py-0.5">
    <div ref={wrap} role="group" aria-label={label} className="relative inline-flex rounded-full border border-line bg-white p-1 shadow-sm">
      {pill && <span aria-hidden="true" className="absolute bottom-1 top-1 rounded-full bg-navy shadow transition-all duration-300 ease-out" style={{ left: pill.left, width: pill.width }} />}
      {options.map(o => (<button key={o.value} type="button" aria-pressed={o.value === value} onClick={() => onChange(o.value)}
        className={`relative z-10 inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-medium transition-colors duration-300 ${pad} ${o.value === value ? 'text-white' : 'text-ink/75 hover:text-navy'}`}>
        {o.dot && <span className={`h-2 w-2 rounded-full ${o.dot}`} />}{o.label}</button>))}</div></div>);
}
