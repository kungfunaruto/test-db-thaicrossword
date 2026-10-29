import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLang } from '../../i18n';
/** Numbered pages with gaps: 1 … 4 5 6 … 12 */
function pagesFor(page: number, pages: number): (number | '…')[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const set = new Set([1, pages, page - 1, page, page + 1].filter(p => p >= 1 && p <= pages));
  const sorted = [...set].sort((a, b) => a - b); const out: (number | '…')[] = [];
  sorted.forEach((p, i) => { if (i && p - sorted[i - 1] > 1) out.push('…'); out.push(p); });
  return out;
}
export default function Pagination({ page, total, size, onChange }: { page: number; total: number; size: number; onChange: (p: number) => void }) {
  const { t } = useLang();
  const pages = Math.max(1, Math.ceil(total / size));
  if (pages <= 1) return null;
  const arrow = 'grid h-10 w-10 place-items-center rounded-xl border border-line bg-white text-navy shadow-sm transition hover:border-navy/40 disabled:pointer-events-none disabled:opacity-40';
  return (<nav aria-label={t.common.pagination} className="mt-10 flex flex-col items-center gap-2">
    <div className="flex items-center gap-1.5">
      <button className={arrow} disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label={t.common.prev}><ChevronLeft className="h-5 w-5" /></button>
      {pagesFor(page, pages).map((p, i) => p === '…' ? <span key={`g${i}`} className="w-6 text-center text-muted">…</span> :
        <button key={p} onClick={() => onChange(p)} aria-current={p === page ? 'page' : undefined}
          className={`h-10 min-w-10 rounded-xl px-3 text-sm font-medium transition ${p === page ? 'scale-105 bg-navy text-white shadow-md' : 'border border-line bg-white text-navy hover:border-navy/40'}`}>{p}</button>)}
      <button className={arrow} disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label={t.common.next}><ChevronRight className="h-5 w-5" /></button></div>
    <p className="text-xs text-muted">{t.common.page(page, pages)}</p></nav>);
}
