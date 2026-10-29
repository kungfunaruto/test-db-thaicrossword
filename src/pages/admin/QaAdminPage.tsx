import { useCallback, useEffect, useMemo, useState } from 'react';
import { Archive, ArchiveRestore, Inbox, MessageSquareReply, Trash2 } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useToast } from '../../components/common/Toast';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { EmptyState, ErrorState, LoadingState } from '../../components/common/States';
import { fmtDateTime } from '../../lib/dates';
import ResourceManager from './ResourceManager';
import { faqsResource } from './resources';
import { Pills, PubBadge } from './ui';
import { QUESTIONS_CHANGED } from './AdminLayout';

interface Sub { id: string; question: string; status: 'new' | 'answered' | 'archived'; faq_id: string | null; created_at: string }
const changed = () => window.dispatchEvent(new Event(QUESTIONS_CHANGED));

/** Q&A admin: tab 1 = published Q&A, tab 2 = questions sent by visitors (answer → becomes a Q&A entry). */
export default function QaAdminPage() {
  const toast = useToast();
  const [tab, setTab] = useState<'faq' | 'inbox'>('faq');
  const [subs, setSubs] = useState<Sub[] | null>(null); const [failed, setFailed] = useState(false);
  const [filter, setFilter] = useState<'new' | 'answered' | 'archived' | 'all'>('new');
  const [answering, setAnswering] = useState<Sub | null>(null); const [prefill, setPrefill] = useState<Record<string, string> | null>(null);
  const [del, setDel] = useState<Sub | null>(null); const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    const { data, error } = await supabase.from('faq_submissions').select('id,question,status,faq_id,created_at').order('created_at', { ascending: false }).limit(500);
    if (error) { setFailed(true); return; } setFailed(false); setSubs((data ?? []) as Sub[]);
  }, []);
  useEffect(() => { load(); }, [load]);
  const newCount = (subs ?? []).filter(s => s.status === 'new').length;
  const shown = useMemo(() => (subs ?? []).filter(s => filter === 'all' || s.status === filter), [subs, filter]);
  async function setStatus(s: Sub, status: Sub['status'], faqId?: string) {
    const { error } = await supabase.from('faq_submissions').update({ status, ...(faqId ? { faq_id: faqId } : {}) }).eq('id', s.id);
    if (error) { toast('err', 'เปลี่ยนสถานะไม่สำเร็จ'); return; }
    changed(); load();
  }
  const answer = (s: Sub) => { setAnswering(s); setPrefill({ question: s.question }); setTab('faq'); };
  async function remove() {
    if (!del) return; setBusy(true);
    const { error } = await supabase.from('faq_submissions').delete().eq('id', del.id); setBusy(false);
    if (error) { toast('err', 'ลบไม่สำเร็จ'); return; } toast('ok', 'ลบคำถามแล้ว'); setDel(null); changed(); load();
  }
  return (<div className="mx-auto max-w-6xl">
    <div className="mb-6 inline-flex rounded-full border border-line bg-white p-1 shadow-sm" role="tablist">
      {([['faq', 'คำถาม-คำตอบ (Q&A)'], ['inbox', 'คำถามจากผู้ใช้']] as const).map(([k, label]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
        className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition ${tab === k ? 'bg-navy text-white shadow' : 'text-ink/70 hover:text-navy'}`}>{label}
        {k === 'inbox' && newCount > 0 && <span className="rounded-full bg-flame px-2 text-xs text-white">{newCount}</span>}</button>)}</div>
    {tab === 'faq' ? <ResourceManager r={faqsResource} prefill={prefill} onCreated={id => { if (answering) { setStatus(answering, 'answered', id); toast('ok', 'ตอบคำถามและเผยแพร่แล้ว'); } }} onFormClosed={() => { setAnswering(null); setPrefill(null); }} />
      : (<div>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-2xl md:text-3xl">คำถามจากผู้ใช้</h1>
          <p className="mt-1 text-sm text-muted">คำถามที่ผู้เข้าชมส่งมาจากหน้า "ถาม-ตอบ" (ไม่มีข้อมูลส่วนตัว) กด "ตอบ" เพื่อเขียนคำตอบและเผยแพร่เป็น Q&A</p></div>
          <Pills value={filter} onChange={setFilter} options={[{ value: 'new', label: `ใหม่ (${newCount})` }, { value: 'answered', label: 'ตอบแล้ว' }, { value: 'archived', label: 'จัดเก็บ' }, { value: 'all', label: 'ทั้งหมด' }]} /></div>
        {failed ? <ErrorState onRetry={load} /> : !subs ? <LoadingState text="กำลังโหลด..." /> : shown.length === 0 ? <EmptyState text={filter === 'new' ? 'ไม่มีคำถามใหม่' : 'ไม่มีรายการ'} /> :
          <ul className="stagger space-y-2">{shown.map((s, i) => (<li key={s.id} style={{ ['--i' as string]: i }} className={`card flex flex-col gap-3 p-4 sm:flex-row sm:items-start ${s.status === 'new' ? 'border-l-4 border-l-flame' : ''}`}>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-light text-navy"><Inbox className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><PubBadge s={s.status} /><span className="text-xs text-muted">{fmtDateTime(s.created_at, 'th')}</span></div>
              <p className="mt-1.5 whitespace-pre-line text-ink">{s.question}</p></div>
            <div className="flex shrink-0 flex-wrap gap-1">
              {s.status !== 'answered' && <button onClick={() => answer(s)} className="btn-primary btn-sm"><MessageSquareReply className="h-4 w-4" />ตอบ</button>}
              {s.status === 'archived' ? <button onClick={() => setStatus(s, 'new')} className="btn-outline btn-sm"><ArchiveRestore className="h-4 w-4" />ย้ายกลับ</button>
                : <button onClick={() => setStatus(s, 'archived')} className="btn-outline btn-sm"><Archive className="h-4 w-4" />จัดเก็บ</button>}
              <button onClick={() => setDel(s)} aria-label="ลบ" className="grid h-9 w-9 place-items-center rounded-full text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button></div></li>))}</ul>}
      </div>)}
    <ConfirmDialog open={!!del} title="ลบคำถาม" message="ต้องการลบคำถามนี้หรือไม่? การลบไม่สามารถย้อนกลับได้" busy={busy} onConfirm={remove} onCancel={() => setDel(null)} />
  </div>);
}
