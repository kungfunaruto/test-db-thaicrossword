import { useState } from 'react';
import { Check, Facebook, Link2, MessageCircle } from 'lucide-react';
import { useLang } from '../../i18n';
export default function ShareButtons({ title }: { title: string }) {
  const { t } = useLang();
  const [copied, setCopied] = useState(false);
  const url = typeof window !== 'undefined' ? window.location.href : '';
  const b = 'grid h-10 w-10 place-items-center rounded-full border border-line bg-white text-navy shadow-sm transition hover:-translate-y-0.5 hover:border-gold hover:shadow-md';
  const copy = async () => { try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* clipboard blocked */ } };
  return (<div className="flex items-center gap-2"><span className="mr-1 text-sm text-muted">{t.common.share}</span>
    <a className={b} href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" aria-label="Facebook"><Facebook className="h-4 w-4" /></a>
    <a className={b} href={`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`} target="_blank" rel="noopener noreferrer" aria-label="LINE"><MessageCircle className="h-4 w-4" /></a>
    <button type="button" className={b} onClick={copy} aria-label={t.common.copyLink}>{copied ? <Check className="h-4 w-4 animate-pop text-emerald-600" /> : <Link2 className="h-4 w-4" />}</button>
    {copied && <span role="status" className="animate-fade-in text-xs text-emerald-700">{t.common.copied}</span>}</div>);
}
