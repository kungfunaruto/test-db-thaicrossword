import { useEffect, useState } from 'react';
import { useIsFetching } from '../../lib/query';
/** Thin animated bar at the very top while data is loading (shown only if loading takes longer than 150 ms). */
export default function TopProgress({ active = false }: { active?: boolean }) {
  const busy = useIsFetching() > 0 || active;
  const [show, setShow] = useState(false);
  useEffect(() => { if (!busy) { setShow(false); return; } const id = setTimeout(() => setShow(true), 150); return () => clearTimeout(id); }, [busy]);
  return (<div aria-hidden="true" className={`pointer-events-none fixed inset-x-0 top-0 z-[80] h-[3px] overflow-hidden transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'}`}>
    <div className="h-full w-full origin-left animate-progress bg-gradient-to-r from-gold via-flame to-gold" /></div>);
}
