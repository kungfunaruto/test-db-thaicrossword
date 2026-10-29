import { useEffect, useState } from 'react';
import { useLang } from '../i18n';
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
  const { t } = useLang();
  useEffect(() => {
    if (!title) return;
    document.title = `${title} | ${t.site.name}`;
    const d = (description ?? t.site.metaDesc).replace(/\s+/g, ' ').slice(0, 160);
    setMeta('property', 'og:title', title); setMeta('property', 'og:type', 'article');
    setMeta('name', 'description', d); setMeta('property', 'og:description', d);
    if (image) setMeta('property', 'og:image', image);
  }, [title, description, image, t]);
}
