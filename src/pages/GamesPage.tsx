import { Link } from 'react-router-dom';
import { ArrowRight, Download } from 'lucide-react';
import { RULE_GAMES } from '../content/rules';
import { usePageMeta } from '../hooks/usePublic';
import { nb } from '../utils/labels';
import PageHeader from '../components/common/PageHeader';
const compare: [string, string, string, string][] = [
  ['ชื่อเกม', 'Wordsmith', 'Mathsmith', 'Thaismith'], ['กระดาน', '15 × 15 (225 ช่อง)', '15 × 15 (225 ช่อง)', '19 × 15 (285 ช่อง)'], ['เบี้ยทั้งหมด', '100 ตัว', '100 ตัว', '104 ตัว'],
  ['เบี้ยเริ่มต้นบนแป้น', '7 ตัว', '8 ตัว', '9 ตัว'], ['เวลาต่อฝ่าย', '25 นาที (ประถม 20)', '22 นาที (ประถม 20)', '22 นาที'], ['เปลี่ยนเบี้ยได้เมื่อในถุงมี', 'อย่างน้อย 7 ตัว', 'อย่างน้อย 5 ตัว', 'อย่างน้อย 9 ตัว'],
  ['โบนัส Bingo', '+50 (ลง 7 ตัว)', '+40 (ลง 8 ตัว)', '40–90 (ลง 6–9 ตัว)']];
export default function GamesPage() {
  usePageMeta('เกมและกติกา', 'กติกาการแข่งขันครอสเวิร์ด เอแม็ท และคำคม');
  return (<><PageHeader title="เกมและกติกา" desc={['กติกามาตรฐานสำหรับการแข่งขัน ', 'ครอสเวิร์ด เอแม็ท และคำคม ', 'อ่านสรุปเข้าใจง่าย ', 'พร้อมเอกสารฉบับเต็ม']} />
    <div className="mx-auto max-w-6xl px-4 py-10">
      <ul className="grid gap-6 md:grid-cols-3">{RULE_GAMES.map(g => (<li key={g.slug} className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card transition hover:-translate-y-0.5 hover:shadow-lg">
        <div className="h-2" style={{ background: g.accent }} />
        <div className="flex flex-1 flex-col p-6"><p className="text-sm text-muted">{g.brand}</p><h2 className="mt-1 text-2xl">{nb(g.name)}</h2><p className="mt-3 min-h-[5.2rem] text-sm text-muted">{nb(g.tagline)}</p>
          <dl className="mt-5 grid grid-cols-3 gap-2 text-center">{g.facts.filter(f => ['grid', 'tiles', 'clock'].includes(f.icon)).map(f => (<div key={f.label} className="rounded-lg bg-gray-light p-2"><dt className="text-xs text-muted">{f.label}</dt><dd className="font-semibold text-navy-dark">{nb(f.value)}</dd></div>))}</dl>
          <div className="mt-auto flex flex-wrap gap-2 pt-6"><Link to={`/games/${g.slug}`} className="inline-flex items-center gap-1.5 rounded bg-navy px-4 py-2 font-medium text-white hover:brightness-110">ดูกติกา<ArrowRight className="h-4 w-4" /></Link>
            <a href={g.pdf.url} download className="inline-flex items-center gap-1.5 rounded border border-slate-300 px-4 py-2 font-medium text-navy hover:bg-blue-light"><Download className="h-4 w-4" />PDF</a></div></div></li>))}</ul>
      <section className="mt-14"><h2 className="text-2xl">เปรียบเทียบสั้น ๆ</h2><span className="mt-2 block h-1 w-14 rounded bg-gold" />
        <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 shadow-card"><table className="w-full min-w-[620px] text-left text-sm">
          <thead className="bg-navy-dark text-white"><tr><th className="p-3 font-medium">หัวข้อ</th>{RULE_GAMES.map(g => <th key={g.slug} className="p-3 font-medium">{nb(g.name)}</th>)}</tr></thead>
          <tbody>{compare.map(r => <tr key={r[0]} className="border-t border-slate-100 even:bg-gray-light"><td className="p-3 font-medium text-navy-dark">{r[0]}</td><td className="p-3">{r[1]}</td><td className="p-3">{r[2]}</td><td className="p-3">{r[3]}</td></tr>)}</tbody></table></div>
        <p className="mt-3 text-xs text-muted">สรุปจากเอกสารกฎกติกามาตรฐานของบางกอกครอสเวิร์ดคลับ หากมีข้อสงสัยให้ยึดเอกสารฉบับเต็มในแต่ละหน้ากติกา</p></section></div></>);
}
