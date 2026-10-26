import { Loader2, Inbox, AlertTriangle } from 'lucide-react';
export const LoadingState = ({ text = 'กำลังโหลดข้อมูล...' }: { text?: string }) => (
  <div role="status" className="flex items-center justify-center gap-2 py-16 text-muted"><Loader2 className="h-5 w-5 animate-spin" />{text}</div>);
export const EmptyState = ({ text }: { text: string }) => (
  <div className="flex flex-col items-center gap-2 rounded border border-dashed border-slate-300 bg-gray-light py-14 text-muted"><Inbox className="h-8 w-8" /><p>{text}</p></div>);
export const ErrorState = ({ text = 'ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง' }: { text?: string }) => (
  <div role="alert" className="flex items-center justify-center gap-2 rounded bg-red-50 py-10 text-red-700"><AlertTriangle className="h-5 w-5" />{text}</div>);
