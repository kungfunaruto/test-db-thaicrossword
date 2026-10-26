export default function Pagination({ page, total, size, onChange }: { page: number; total: number; size: number; onChange: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / size));
  if (pages <= 1) return null;
  const b = 'rounded border border-slate-300 px-3 py-2 text-sm disabled:opacity-40';
  return (<nav aria-label="เปลี่ยนหน้า" className="mt-8 flex items-center justify-center gap-3">
    <button className={b} disabled={page <= 1} onClick={() => onChange(page - 1)}>ก่อนหน้า</button>
    <span className="text-sm text-muted">หน้า {page} / {pages}</span>
    <button className={b} disabled={page >= pages} onClick={() => onChange(page + 1)}>ถัดไป</button></nav>);
}
