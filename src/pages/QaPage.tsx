import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { fetchFaqs } from '../services/publicService';
import { useAsync, usePageMeta } from '../hooks/usePublic';
import { GAME_LABEL, nb } from '../utils/labels';
import PageHeader from '../components/common/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '../components/common/States';
const chips: [string, string][] = [['', 'ทั้งหมด'], ['general', 'ทั่วไป'], ['crossword', GAME_LABEL.crossword], ['a_math', GAME_LABEL.a_math], ['kumkom', GAME_LABEL.kumkom], ['sudoku', GAME_LABEL.sudoku]];
export default function QaPage() {
  usePageMeta('ถาม-ตอบ (Q&A)', 'คำถามที่พบบ่อยเกี่ยวกับการแข่งขัน กติกา และกิจกรรมของสมาคม');
  const { data, error } = useAsync(() => fetchFaqs(), []);
  const [q, setQ] = useState(''); const [g, setG] = useState('');
  const rows = (data ?? []).filter(f => (!g || (g === 'general' ? !f.game_type : f.game_type === g)) && (!q.trim() || `${f.question} ${f.answer}`.toLowerCase().includes(q.trim().toLowerCase())));
  return (<><PageHeader title="ถาม-ตอบ (Q&A)" desc="คำถามที่พบบ่อยเกี่ยวกับการแข่งขัน กติกา และกิจกรรมของสมาคม" />
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div role="group" aria-label="หมวดคำถาม" className="flex flex-wrap gap-2">{chips.map(([k, label]) => <button key={k} aria-pressed={g === k} onClick={() => setG(k)}
        className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition ${g === k ? 'bg-navy text-white' : 'border border-slate-300 hover:border-navy'}`}>{label}</button>)}</div>
      <input aria-label="ค้นหาคำถาม" placeholder="ค้นหาคำถาม" value={q} onChange={e => setQ(e.target.value)} className="my-6 w-full rounded border border-slate-300 p-2.5" />
      {error ? <ErrorState /> : !data ? <LoadingState /> : rows.length === 0 ? <EmptyState text="ยังไม่มีคำถามที่เผยแพร่" /> :
        <ul className="space-y-3">{rows.map(f => (<li key={f.id}><details className="group rounded-lg border border-slate-200 bg-white shadow-card open:border-gold">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-3 p-4 font-medium text-navy-dark [&::-webkit-details-marker]:hidden"><span>{f.game_type && <span className="mr-2 rounded bg-blue-light px-2 py-0.5 text-xs font-medium text-navy">{GAME_LABEL[f.game_type]}</span>}{nb(f.question)}</span>
            <ChevronDown className="mt-1 h-5 w-5 shrink-0 text-navy transition group-open:rotate-180" /></summary>
          <div className="whitespace-pre-line border-t border-slate-100 p-4 text-ink">{nb(f.answer)}</div></details></li>))}</ul>}</div></>);
}
