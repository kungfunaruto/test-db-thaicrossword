import { useState } from 'react';
import { UserRound } from 'lucide-react';
/** Athlete photo, or a default profile picture when there is none (or it fails to load). */
export default function Avatar({ src, alt, size = 40, ring = '' }: { src: string | null; alt: string; size?: number; ring?: string }) {
  const [failed, setFailed] = useState(false);
  const box = { width: size, height: size };
  return src && !failed
    ? <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} style={box} className={`shrink-0 rounded-full bg-slate-200 object-cover ${ring}`} />
    : <span role="img" aria-label={alt} style={box} className={`grid shrink-0 place-items-end justify-center overflow-hidden rounded-full bg-gradient-to-b from-slate-200 to-slate-300 text-slate-400 ${ring}`}>
      <UserRound style={{ width: size * 0.82, height: size * 0.82, marginBottom: -size * 0.1 }} strokeWidth={1.6} /></span>;
}
