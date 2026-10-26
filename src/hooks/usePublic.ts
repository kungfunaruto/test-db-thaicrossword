import { useEffect, useState } from 'react';
import { site } from '../config/site';
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [s, setS] = useState<{ data: T | null; error: boolean }>({ data: null, error: false });
  useEffect(() => {
    let off = false; setS({ data: null, error: false });
    fn().then(d => { if (!off) setS({ data: d, error: false }); }).catch(() => { if (!off) setS({ data: null, error: true }); });
    return () => { off = true; };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  return s;
}
export function useDebounced<T>(v: T, ms = 300) {
  const [d, setD] = useState(v);
  useEffect(() => { const t = setTimeout(() => setD(v), ms); return () => clearTimeout(t); }, [v, ms]);
  return d;
}
function setMeta(attr: 'name' | 'property', key: string, val: string) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el); }
  el.setAttribute('content', val);
}
export function usePageMeta(title: string, description?: string | null, image?: string | null) {
  useEffect(() => {
    if (!title) return;
    document.title = `${title} | ${site.nameTh}`;
    const d = (description ?? '').replace(/\s+/g, ' ').slice(0, 160);
    setMeta('property', 'og:title', title); setMeta('property', 'og:type', 'article');
    if (d) { setMeta('name', 'description', d); setMeta('property', 'og:description', d); }
    if (image) setMeta('property', 'og:image', image);
  }, [title, description, image]);
}
