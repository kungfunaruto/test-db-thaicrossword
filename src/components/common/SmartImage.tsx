import { useState } from 'react';
/**
 * Fills a fixed-ratio box with any photo or poster:
 * - landscape images fill the box (cover);
 * - tall posters are shown whole (contain) over a blurred, enlarged copy of themselves, so nothing is cropped and there are no empty bars.
 * Fades in when loaded; a shimmer shows while loading.
 */
export default function SmartImage({ src, alt = '', className = '', zoom = false, eager = false, fit }: { src: string; alt?: string; className?: string; zoom?: boolean; eager?: boolean; fit?: 'cover' | 'contain' }) {
  const [state, setState] = useState<{ loaded: boolean; tall: boolean; failed: boolean }>({ loaded: false, tall: false, failed: false });
  const contain = fit ? fit === 'contain' : state.tall;
  return (<div className={`relative overflow-hidden bg-slate-200 ${className}`}>
    {!state.loaded && !state.failed && <div className="skeleton absolute inset-0 rounded-none" />}
    {contain && <img src={src} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full scale-125 object-cover opacity-70 blur-2xl saturate-150" />}
    {!state.failed && <img src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async"
      onLoad={e => { const i = e.currentTarget; const box = i.parentElement!.getBoundingClientRect(); const boxRatio = box.width / Math.max(box.height, 1);
        setState({ loaded: true, failed: false, tall: i.naturalWidth / Math.max(i.naturalHeight, 1) < boxRatio * 0.78 }); }}
      onError={() => setState(s => ({ ...s, failed: true }))}
      className={`relative h-full w-full transition duration-500 ${contain ? 'object-contain drop-shadow-xl' : 'object-cover'} ${state.loaded ? 'opacity-100' : 'opacity-0'} ${zoom ? 'group-hover:scale-[1.04]' : ''}`} />}
  </div>);
}
