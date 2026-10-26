interface Props { open: boolean; title: string; message: string; busy?: boolean; onConfirm: () => void; onCancel: () => void }
export default function ConfirmDialog({ open, title, message, busy, onConfirm, onCancel }: Props) {
  if (!open) return null;
  return (<div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
    <div role="dialog" aria-modal="true" aria-labelledby="cd-title" className="w-full max-w-sm rounded bg-white p-6">
      <h2 id="cd-title" className="text-lg">{title}</h2><p className="mt-2 text-sm text-muted">{message}</p>
      <div className="mt-6 flex justify-end gap-2">
        <button onClick={onCancel} disabled={busy} className="rounded border border-slate-300 px-4 py-2">ยกเลิก</button>
        <button onClick={onConfirm} disabled={busy} className="rounded bg-red-700 px-4 py-2 text-white disabled:opacity-60">{busy ? 'กำลังลบ...' : 'ลบ'}</button>
      </div></div></div>);
}
