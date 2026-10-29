import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
export default function BackLink({ to, label }: { to: string; label: string }) {
  return (<Link to={to} className="group inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-1.5 text-sm font-medium text-navy shadow-sm transition hover:border-navy/30">
    <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-0.5" />{label}</Link>);
}
