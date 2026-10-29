import { AlertTriangle, Inbox, RotateCw } from 'lucide-react';
import { useLang } from '../../i18n';

export function LoadingState({ text }: { text?: string }) {
  const { t } = useLang();
  return (<div role="status" className="flex flex-col items-center justify-center gap-3 py-16 text-muted">
    <span className="flex gap-1.5" aria-hidden="true">{[0, 1, 2].map(i => <span key={i} className="h-2.5 w-2.5 animate-bounce rounded-full bg-gold" style={{ animationDelay: `${i * 120}ms` }} />)}</span>
    <span className="text-sm">{text ?? t.common.loading}</span></div>);
}
export function EmptyState({ text, action }: { text: string; action?: React.ReactNode }) {
  return (<div className="flex animate-fade-in flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-14 text-center text-muted">
    <span className="grid h-14 w-14 place-items-center rounded-full bg-blue-light text-navy/60"><Inbox className="h-7 w-7" /></span><p>{text}</p>{action}</div>);
}
export function ErrorState({ text, onRetry }: { text?: string; onRetry?: () => void }) {
  const { t } = useLang();
  return (<div role="alert" className="flex animate-fade-in flex-col items-center justify-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-6 py-10 text-center text-red-700">
    <AlertTriangle className="h-6 w-6" /><p>{text ?? t.common.error}</p>
    {onRetry && <button onClick={onRetry} className="btn btn-sm border border-red-200 bg-white text-red-700 hover:bg-red-100"><RotateCw className="h-4 w-4" />{t.common.retry}</button>}</div>);
}
/** Card-shaped placeholders shown while a list loads (keeps the layout from jumping). */
export function CardSkeletons({ count = 6, row = false }: { count?: number; row?: boolean }) {
  return (<ul aria-hidden="true" className={row ? 'flex flex-col gap-3 sm:flex-row sm:overflow-hidden' : 'grid gap-3 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3'}>
    {Array.from({ length: count }, (_, i) => (<li key={i} className={`card flex overflow-hidden sm:flex-col ${row ? 'sm:w-72 sm:shrink-0' : ''}`}>
      <div className="skeleton h-24 w-24 shrink-0 rounded-none sm:aspect-[16/10] sm:h-auto sm:w-full" />
      <div className="flex-1 space-y-2.5 p-3 sm:p-5"><div className="skeleton h-4 w-24" /><div className="skeleton h-5 w-full" /><div className="skeleton h-5 w-2/3" /><div className="skeleton hidden h-4 w-1/2 sm:block" /></div></li>))}</ul>);
}
