import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useLang } from '../../i18n';

/** Full-screen image viewer: arrows / swipe / keyboard (← → Esc), thumbnails, counter. */
export default function Lightbox({ images, index, onClose, alt }: { images: string[]; index: number; onClose: () => void; alt: string }) {
  const { t } = useLang();
  const [i, setI] = useState(index);
  const touch = useRef<number | null>(null);
  const n = images.length;
  const go = (d: number) => setI(x => (x + d + n) % n);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const btn = 'grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/25';
  return createPortal(<div role="dialog" aria-modal="true" aria-label={alt} className="fixed inset-0 z-[70] flex animate-fade-in flex-col bg-black/90"
    onTouchStart={e => { touch.current = e.touches[0].clientX; }} onTouchEnd={e => { if (touch.current === null) return; const dx = e.changedTouches[0].clientX - touch.current; if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1); touch.current = null; }}>
    <div className="flex items-center justify-between p-3 text-sm text-white/80"><span className="rounded-full bg-white/10 px-3 py-1">{t.common.photo(i + 1, n)}</span>
      <button className={btn} aria-label={t.common.close} onClick={onClose} autoFocus><X className="h-5 w-5" /></button></div>
    <div className="relative flex min-h-0 flex-1 items-center justify-center px-2" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <img key={i} src={images[i]} alt={`${alt} (${i + 1}/${n})`} className="max-h-full max-w-full animate-scale-in select-none rounded-lg object-contain shadow-2xl" />
      {n > 1 && <><button className={`${btn} absolute left-3`} aria-label={t.common.prev} onClick={() => go(-1)}><ChevronLeft className="h-6 w-6" /></button>
        <button className={`${btn} absolute right-3`} aria-label={t.common.next} onClick={() => go(1)}><ChevronRight className="h-6 w-6" /></button></>}</div>
    {n > 1 && <div className="scrollbar-none flex justify-center gap-2 overflow-x-auto p-3">{images.map((src, k) => (
      <button key={k} onClick={() => setI(k)} aria-label={t.common.photo(k + 1, n)} className={`h-14 w-14 shrink-0 overflow-hidden rounded-md ring-2 transition ${k === i ? 'opacity-100 ring-gold' : 'opacity-50 ring-transparent hover:opacity-90'}`}>
        <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" /></button>))}</div>}
  </div>, document.body);
}
