import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
type Kind = 'ok' | 'err' | 'info';
type Item = { id: number; kind: Kind; text: string };
const Ctx = createContext<(kind: Kind, text: string) => void>(() => {});
export const useToast = () => useContext(Ctx);
const STYLE: Record<Kind, string> = { ok: 'border-emerald-200 bg-white text-emerald-800', err: 'border-red-200 bg-white text-red-800', info: 'border-amber-200 bg-white text-amber-900' };
const ICON = { ok: CheckCircle2, err: AlertTriangle, info: Info };
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);
  const close = (id: number) => setItems(i => i.filter(x => x.id !== id));
  const push = useCallback((kind: Kind, text: string) => {
    const id = Date.now() + Math.random();
    setItems(i => [...i.slice(-3), { id, kind, text }]);
    setTimeout(() => close(id), kind === 'err' ? 8000 : 5000);
  }, []);
  return (<Ctx.Provider value={push}>{children}
    <div aria-live="polite" className="fixed bottom-4 right-4 z-[90] flex w-[min(92vw,380px)] flex-col gap-2">
      {items.map(t => { const Icon = ICON[t.kind]; return (<div key={t.id} role={t.kind === 'err' ? 'alert' : 'status'}
        className={`flex animate-toast-in items-start gap-3 rounded-2xl border px-4 py-3 text-sm shadow-lift ${STYLE[t.kind]}`}>
        <Icon className="mt-0.5 h-5 w-5 shrink-0" /><p className="flex-1">{t.text}</p>
        <button onClick={() => close(t.id)} aria-label="ปิด" className="rounded-full p-0.5 opacity-60 hover:opacity-100"><X className="h-4 w-4" /></button></div>); })}
    </div></Ctx.Provider>);
}
