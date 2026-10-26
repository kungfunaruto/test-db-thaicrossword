import { Link } from 'react-router-dom';
import Th from './Th';
import { nb } from '../../utils/labels';
export default function PageHeader({ title, desc }: { title: string; desc?: string | string[] }) {
  return (<section className="relative overflow-hidden bg-gradient-to-br from-navy-dark to-navy text-white">
    <div className="grid-pattern absolute inset-0" aria-hidden="true" />
    <div className="relative mx-auto max-w-6xl px-4 py-10 md:py-14">
      <nav aria-label="เส้นทางหน้า" className="mb-3 text-sm text-slate-300"><Link to="/" className="hover:text-gold">หน้าแรก</Link><span aria-hidden="true" className="mx-2">/</span><span>{nb(title)}</span></nav>
      <h1 className="text-3xl text-white md:text-4xl">{nb(title)}</h1><span className="mt-4 block h-1 w-16 rounded bg-gold" />
      {desc && <p className="mt-4 max-w-2xl text-slate-200">{Array.isArray(desc) ? <Th parts={desc.map(nb)} /> : nb(desc)}</p>}</div></section>);
}
