import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
type Kind = 'ok' | 'err';
type Item = { id: number; kind: Kind; text: string };
const Ctx = createContext<(kind: Kind, text: string) => void>(() => {});
export const useToast = () => useContext(Ctx);
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);
  const push = useCallback((kind: Kind, text: string) => {
    const id = Date.now() + Math.random();
    setItems(i => [...i, { id, kind, text }]);
    setTimeout(() => setItems(i => i.filter(x => x.id !== id)), 5000);
  }, []);
  return (<Ctx.Provider value={push}>{children}
    <div aria-live="polite" className="fixed bottom-4 right-4 z-[60] max-w-sm space-y-2">
      {items.map(t => <div key={t.id} role={t.kind === 'err' ? 'alert' : 'status'}
        className={`rounded px-4 py-3 text-sm text-white shadow ${t.kind === 'err' ? 'bg-red-700' : 'bg-emerald-700'}`}>{t.text}</div>)}
    </div></Ctx.Provider>);
}
