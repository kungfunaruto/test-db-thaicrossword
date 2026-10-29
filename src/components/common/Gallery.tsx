import { useState } from 'react';
import { ChevronLeft, ChevronRight, Expand } from 'lucide-react';
import SmartImage from './SmartImage';
import Lightbox from './Lightbox';
import { useLang } from '../../i18n';

/**
 * Detail-page gallery. One image: a large framed image (posters shown whole). Several images: main viewer with arrows,
 * counter and a thumbnail strip. Any image opens the full-screen viewer.
 */
export default function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const { t } = useLang();
  const [i, setI] = useState(0); const [open, setOpen] = useState(false);
  if (!images.length) return null;
  const n = images.length; const go = (d: number) => setI(x => (x + d + n) % n);
  const nav = 'absolute top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-navy shadow-md backdrop-blur transition hover:bg-white';
  return (<div className="space-y-3">
    <div className="group relative overflow-hidden rounded-2xl shadow-card ring-1 ring-black/5">
      <button type="button" onClick={() => setOpen(true)} className="block w-full cursor-zoom-in" aria-label={t.common.fullscreen}>
        <SmartImage key={images[i]} src={images[i]} alt={`${alt}${n > 1 ? ` (${i + 1}/${n})` : ''}`} eager className="aspect-[4/3] w-full sm:aspect-[16/10]" /></button>
      <span className="pointer-events-none absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-black/45 text-white opacity-0 backdrop-blur transition group-hover:opacity-100"><Expand className="h-4 w-4" /></span>
      {n > 1 && <><button type="button" className={`${nav} left-3`} aria-label={t.common.prev} onClick={() => go(-1)}><ChevronLeft className="h-5 w-5" /></button>
        <button type="button" className={`${nav} right-3`} aria-label={t.common.next} onClick={() => go(1)}><ChevronRight className="h-5 w-5" /></button>
        <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-3 py-0.5 text-xs text-white backdrop-blur">{i + 1} / {n}</span></>}
    </div>
    {n > 1 && <div className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">{images.map((src, k) => (
      <button key={src + k} type="button" onClick={() => setI(k)} aria-label={t.common.photo(k + 1, n)} aria-current={k === i}
        className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-lg ring-2 transition sm:h-20 sm:w-28 ${k === i ? 'ring-gold' : 'opacity-60 ring-transparent hover:opacity-100'}`}>
        <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" /></button>))}</div>}
    {open && <Lightbox images={images} index={i} alt={alt} onClose={() => setOpen(false)} />}
  </div>);
}
