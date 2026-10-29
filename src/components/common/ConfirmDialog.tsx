import { AlertTriangle, Loader2 } from 'lucide-react';
interface Props { open: boolean; title: string; message: string; busy?: boolean; confirmLabel?: string; onConfirm: () => void; onCancel: () => void }
export default function ConfirmDialog({ open, title, message, busy, confirmLabel = 'ลบ', onConfirm, onCancel }: Props) {
  if (!open) return null;
  return (<div className="fixed inset-0 z-[70] grid place-items-center p-4"><div className="absolute inset-0 animate-fade-in bg-black/50 backdrop-blur-[2px]" onClick={busy ? undefined : onCancel} />
    <div role="alertdialog" aria-modal="true" aria-labelledby="cd-title" className="relative w-full max-w-sm animate-scale-in rounded-3xl bg-white p-6 shadow-2xl">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-red-50 text-red-600"><AlertTriangle className="h-6 w-6" /></span>
      <h2 id="cd-title" className="mt-4 font-sans text-lg font-semibold">{title}</h2><p className="mt-1 text-sm text-muted">{message}</p>
      <div className="mt-6 flex justify-end gap-2">
        <button onClick={onCancel} disabled={busy} className="btn-outline btn-sm">ยกเลิก</button>
        <button onClick={onConfirm} disabled={busy} className="btn btn-sm bg-red-600 text-white hover:bg-red-700">{busy && <Loader2 className="h-4 w-4 animate-spin" />}{busy ? 'กำลังดำเนินการ...' : confirmLabel}</button>
      </div></div></div>);
}
