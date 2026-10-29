// Decorative game tiles drifting in hero backgrounds (letters, Thai letters, numbers, operators), echoing the emblem's T-C-A tiles.
const TILES: { c: string; v?: string; x: string; y: string; s: number; r: number; d: number }[] = [
  { c: 'A', v: '1', x: '78%', y: '18%', s: 54, r: -8, d: 0 }, { c: 'ก', v: '1', x: '90%', y: '52%', s: 46, r: 10, d: 1.2 }, { c: '7', v: '2', x: '70%', y: '62%', s: 40, r: 6, d: 2.1 },
  { c: '+', x: '84%', y: '82%', s: 34, r: -12, d: 0.6 }, { c: 'Q', v: '10', x: '62%', y: '26%', s: 34, r: 14, d: 3 }, { c: '=', x: '96%', y: '20%', s: 30, r: -4, d: 1.8 },
];
export default function FloatingTiles({ className = '' }: { className?: string }) {
  return (<div aria-hidden="true" className={`pointer-events-none absolute inset-0 ${className}`}>
    {TILES.map((t, i) => (<span key={i} className="absolute animate-float select-none" style={{ left: t.x, top: t.y, animationDelay: `${t.d}s`, ['--r' as string]: `${t.r}deg` }}>
      <span className="relative grid place-items-center rounded-lg bg-gradient-to-b from-[#FFF7E3] to-[#EAD8A8] font-display font-semibold text-navy-dark opacity-[.16] shadow-lg ring-1 ring-black/5"
        style={{ width: t.s, height: t.s, fontSize: t.s * 0.5 }}>{t.c}{t.v && <span className="absolute bottom-0.5 right-1 text-[10px] font-medium leading-none">{t.v}</span>}</span></span>))}
  </div>);
}
