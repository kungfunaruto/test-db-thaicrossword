// Hand-built SVG/HTML charts for the admin dashboard (no chart library).
// Colors: validated categorical slots (blue, orange, aqua). Text always uses text colors, never series colors.
import { useEffect, useRef, useState } from 'react';

export const SERIES = ['#2a78d6', '#eb6834', '#1baf7a'];
export const compact = (n: number) => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M` : n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K` : String(n));
const niceMax = (v: number) => { if (v <= 4) return 4; const p = 10 ** Math.floor(Math.log10(v)); const m = v / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p; };
function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null); const [w, setW] = useState(600);
  useEffect(() => { const el = ref.current; if (!el) return; const ro = new ResizeObserver(([e]) => setW(e.contentRect.width)); ro.observe(el); return () => ro.disconnect(); }, []);
  return [ref, w] as const;
}

export interface LinePoint { label: string; full: string; values: number[] }
/** Multi-series line chart with a light area wash, crosshair + one tooltip listing every series, legend, and an optional table view. */
export function LineChart({ points, names, height = 240 }: { points: LinePoint[]; names: string[]; height?: number }) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null); const [table, setTable] = useState(false);
  const pad = { l: 40, r: 16, t: 12, b: 28 }; const iw = Math.max(10, w - pad.l - pad.r), ih = height - pad.t - pad.b;
  const max = niceMax(Math.max(1, ...points.flatMap(p => p.values)));
  const x = (i: number) => pad.l + (points.length <= 1 ? iw / 2 : (i / (points.length - 1)) * iw); const y = (v: number) => pad.t + ih - (v / max) * ih;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(f => f * max);
  const every = Math.max(1, Math.ceil(points.length / Math.max(2, Math.floor(iw / 70))));
  const pick = (clientX: number) => { const r = ref.current!.getBoundingClientRect(); const i = Math.round(((clientX - r.left - pad.l) / iw) * (points.length - 1)); setHover(Math.min(points.length - 1, Math.max(0, i))); };
  return (<div>
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap gap-4 text-xs text-muted">{names.map((n, k) => <span key={n} className="inline-flex items-center gap-1.5"><span className="h-0.5 w-4 rounded-full" style={{ background: SERIES[k] }} />{n}</span>)}</div>
      <button type="button" onClick={() => setTable(t => !t)} className="text-xs font-medium text-navy underline-offset-2 hover:underline">{table ? 'ดูเป็นกราฟ' : 'ดูเป็นตาราง'}</button></div>
    {table ? (<div className="max-h-72 overflow-y-auto rounded-xl border border-line"><table className="w-full text-sm"><thead className="sticky top-0 bg-gray-light text-left text-xs text-muted"><tr><th className="p-2">วันที่</th>{names.map(n => <th key={n} className="p-2 text-right">{n}</th>)}</tr></thead>
      <tbody>{[...points].reverse().map(p => <tr key={p.full} className="border-t border-line"><td className="p-2">{p.full}</td>{p.values.map((v, k) => <td key={k} className="p-2 text-right tabular-nums">{v.toLocaleString()}</td>)}</tr>)}</tbody></table></div>) : (
    <div ref={ref} className="relative select-none" style={{ height }} onPointerMove={e => pick(e.clientX)} onPointerLeave={() => setHover(null)}>
      <svg width={w} height={height} role="img" aria-label={`กราฟ ${names.join(' และ ')}`} className="overflow-visible">
        {ticks.map(t => <g key={t}><line x1={pad.l} x2={pad.l + iw} y1={y(t)} y2={y(t)} stroke="#E8ECF1" strokeWidth={1} />
          <text x={pad.l - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-muted text-[11px] tabular-nums">{compact(t)}</text></g>)}
        {points.map((p, i) => (i % every === 0 || i === points.length - 1) && <text key={p.full} x={x(i)} y={height - 6} textAnchor="middle" className="fill-muted text-[11px]">{p.label}</text>)}
        {names.map((_, k) => { const d = points.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.values[k])}`).join(''); return (<g key={k}>
          <path d={`${d}L${x(points.length - 1)},${y(0)}L${x(0)},${y(0)}Z`} fill={SERIES[k]} opacity={0.1} />
          <path d={d} pathLength={1} fill="none" stroke={SERIES[k]} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" className="[stroke-dasharray:1] [animation:draw_1.2s_ease-out_both]" /></g>); })}
        {hover !== null && <g><line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + ih} stroke="#94A3B8" strokeWidth={1} />
          {names.map((_, k) => <circle key={k} cx={x(hover)} cy={y(points[hover].values[k])} r={4.5} fill={SERIES[k]} stroke="#fff" strokeWidth={2} />)}</g>}
      </svg>
      {hover !== null && <div className="pointer-events-none absolute top-0 z-10 min-w-36 rounded-xl border border-line bg-white px-3 py-2 text-xs shadow-lift"
        style={{ left: Math.min(Math.max(0, x(hover) + 12), w - 160) }}><p className="mb-1 text-muted">{points[hover].full}</p>
        {names.map((n, k) => <p key={n} className="flex items-center gap-2"><span className="h-0.5 w-3 rounded-full" style={{ background: SERIES[k] }} /><b className="tabular-nums text-ink">{points[hover].values[k].toLocaleString()}</b><span className="text-muted">{n}</span></p>)}</div>}
    </div>)}
  </div>);
}

/** 24 columns (one per hour); each column is its own hover target. */
export function HourColumns({ hours }: { hours: { hour: number; views: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = niceMax(Math.max(1, ...hours.map(h => h.views)));
  return (<div>
    <div className="relative flex h-40 items-end gap-[2px]" onPointerLeave={() => setHover(null)}>
      {hours.map(h => (<div key={h.hour} className="group relative flex h-full flex-1 items-end justify-center" onPointerEnter={() => setHover(h.hour)} tabIndex={0} onFocus={() => setHover(h.hour)} aria-label={`${h.hour}:00 น. ${h.views} ครั้ง`}>
        <div className="w-full max-w-6 rounded-t origin-bottom transition-[filter] duration-150 [animation:grow_.6s_ease-out_both] group-hover:brightness-110" style={{ height: `${Math.max(h.views ? 3 : 0, (h.views / max) * 100)}%`, background: SERIES[0], opacity: hover === null || hover === h.hour ? 1 : 0.55 }} />
        {hover === h.hour && <span className="absolute bottom-full z-10 mb-1 whitespace-nowrap rounded-lg border border-line bg-white px-2 py-1 text-xs shadow-lift"><b className="text-ink">{h.views.toLocaleString()}</b> <span className="text-muted">ครั้ง · {String(h.hour).padStart(2, '0')}:00</span></span>}</div>))}</div>
    <div className="mt-1 flex text-[11px] text-muted">{hours.map(h => <span key={h.hour} className="flex-1 text-center">{h.hour % 3 === 0 ? String(h.hour).padStart(2, '0') : ''}</span>)}</div></div>);
}

/** Ranked horizontal bars with the value at the tip. */
export function BarList({ rows, empty = 'ยังไม่มีข้อมูล' }: { rows: { key: string; label: React.ReactNode; value: number; sub?: string }[]; empty?: string }) {
  if (!rows.length) return <p className="py-6 text-center text-sm text-muted">{empty}</p>;
  const max = Math.max(1, ...rows.map(r => r.value));
  return (<ul className="space-y-2.5">{rows.map((r, i) => (<li key={r.key} className="group" style={{ animation: `fade-up .4s ${i * 40}ms both` }}>
    <div className="mb-1 flex items-baseline justify-between gap-3 text-sm"><span className="min-w-0 truncate text-ink">{r.label}</span>
      <span className="shrink-0 tabular-nums text-ink"><b>{r.value.toLocaleString()}</b>{r.sub && <span className="ml-1 text-xs text-muted">{r.sub}</span>}</span></div>
    <div className="h-2 rounded-full bg-gray-light"><div className="h-full rounded-full transition group-hover:brightness-110" style={{ width: `${(r.value / max) * 100}%`, background: SERIES[0] }} /></div></li>))}</ul>);
}

/** Part-of-whole for ≤3 categories: one stacked bar with 2px gaps + a legend with shares. */
export function SplitBar({ parts }: { parts: { label: string; value: number }[] }) {
  const total = parts.reduce((s, p) => s + p.value, 0);
  if (!total) return <p className="py-6 text-center text-sm text-muted">ยังไม่มีข้อมูล</p>;
  return (<div><div className="flex h-4 gap-[2px] overflow-hidden rounded-full">{parts.filter(p => p.value).map((p, k) => <div key={p.label} title={`${p.label}: ${p.value}`} style={{ flex: p.value, background: SERIES[parts.indexOf(p) % 3] }} className="first:rounded-l-full last:rounded-r-full" />)}</div>
    <ul className="mt-3 space-y-1.5 text-sm">{parts.map((p, k) => <li key={p.label} className="flex items-center justify-between gap-2"><span className="flex items-center gap-2 text-ink"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: SERIES[k % 3] }} />{p.label}</span>
      <span className="tabular-nums"><b>{Math.round((p.value / total) * 100)}%</b> <span className="text-xs text-muted">({p.value.toLocaleString()})</span></span></li>)}</ul></div>);
}
