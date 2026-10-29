import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { useLang } from '../i18n';
import { usePageMeta } from '../hooks/usePublic';
export default function NotFoundPage() {
  const { t } = useLang();
  usePageMeta(t.notFound.title);
  return (<div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
    <div className="flex gap-2" aria-hidden="true">{['4', '0', '4'].map((c, i) => <span key={i} style={{ animationDelay: `${i * 120}ms` }}
      className="grid h-20 w-20 animate-pop place-items-center rounded-2xl bg-gradient-to-b from-[#FFF7E3] to-[#EAD8A8] font-display text-5xl font-semibold text-navy-dark shadow-lift ring-1 ring-black/5">{c}</span>)}</div>
    <h1 className="mt-8 text-3xl">{t.notFound.title}</h1><p className="mt-2 text-muted">{t.notFound.text}</p>
    <Link to="/" className="btn-primary mt-6"><Home className="h-4 w-4" />{t.notFound.home}</Link></div>);
}
