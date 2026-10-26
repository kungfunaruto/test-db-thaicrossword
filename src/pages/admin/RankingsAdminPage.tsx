import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { History, Pencil, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { GAME_LABEL, RANKED_GAMES, thDate } from '../../utils/labels';
import { useToast } from '../../components/common/Toast';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { EmptyState, ErrorState, LoadingState } from '../../components/common/States';

interface Ath { id: string; full_name: string; school_name: string | null; province: string | null; games: string[]; publication_status: string; is_active: boolean }
interface Cur { athlete_id: string; game_type: string; rating_value: number }
interface Hist { id: string; game_type: string; rating_value: number; effective_date: string; publication_status: string }
const PUB: Record<string, string> = { draft: 'ฉบับร่าง', published: 'เผยแพร่', archived: 'เก็บถาวร' };
const inp = 'mt-1 w-full rounded border border-slate-300 p-2';
const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const key = (id: string, g: string) => `${id}|${g}`;
const Modal = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="fixed inset-0 z-40 grid place-items-center bg-black/50 p-4"><div role="dialog" aria-modal="true" aria-label={title} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6">
    <h2 className="mb-4 font-sans text-xl">{title}</h2>{children}</div></div>);

async function fetchAll<T>(table: string, cols: string, orders: string[]): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    let qb = supabase.from(table).select(cols);
    for (const o of orders) qb = qb.order(o);
    const { data, error } = await qb.range(from, from + 999);
    if (error) throw error;
    out.push(...((data ?? []) as unknown as T[]));
    if ((data?.length ?? 0) < 1000) return out;
  }
}

function AthleteForm({ a, cur, onClose, onSaved }: { a: Ath | null; cur: Record<string, number>; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [name, setName] = useState(a?.full_name ?? ''); const [school, setSchool] = useState(a?.school_name ?? ''); const [prov, setProv] = useState(a?.province ?? '');
  const [games, setGames] = useState<string[]>(a?.games ?? []);
  const [ratings, setRatings] = useState<Record<string, string>>(() => Object.fromEntries(RANKED_GAMES.map(g => [g, a && cur[key(a.id, g)] != null ? String(cur[key(a.id, g)]) : ''])));
  const [date, setDate] = useState(today()); const [pubS, setPubS] = useState(a?.publication_status ?? 'published'); const [active, setActive] = useState(a?.is_active ?? true);
  const [err, setErr] = useState<Record<string, string>>({}); const [busy, setBusy] = useState(false);
  const toggle = (g: string) => setGames(s => (s.includes(g) ? s.filter(x => x !== g) : [...s, g]));
  async function save() {
    if (busy) return;
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'กรุณากรอกชื่อ-นามสกุล';
    if (games.length === 0) e.games = 'กรุณาเลือกกีฬาอย่างน้อย 1 ประเภท';
    for (const g of games) { const v = ratings[g].trim(); if (v !== '' && (!Number.isFinite(Number(v)) || Number(v) < 0)) e[`r_${g}`] = 'เรตติ้งต้องเป็นตัวเลขที่ไม่ติดลบ'; }
    if (!date) e.date = 'กรุณาเลือกวันที่มีผล';
    setErr(e); if (Object.keys(e).length) return;
    setBusy(true);
    const { error } = await supabase.rpc('admin_save_athlete', { p_id: a?.id ?? null, p_full_name: name, p_school_name: school, p_province: prov, p_games: games,
      p_publication_status: pubS, p_is_active: active, p_ratings: games.filter(g => ratings[g].trim() !== '').map(g => ({ game: g, value: Number(ratings[g]) })), p_effective_date: date });
    setBusy(false);
    if (error) { toast('err', `บันทึกไม่สำเร็จ: ${error.message}`); return; }
    toast('ok', a ? 'แก้ไขข้อมูลนักกีฬาเรียบร้อยแล้ว' : 'เพิ่มนักกีฬาเรียบร้อยแล้ว'); onSaved();
  }
  const Err = ({ k }: { k: string }) => (err[k] ? <p role="alert" className="text-sm text-red-700">{err[k]}</p> : null);
  return (<Modal title={a ? 'แก้ไขนักกีฬา' : 'เพิ่มนักกีฬา'}><div className="space-y-4">
    <label className="block text-sm font-medium">ชื่อ-นามสกุล <span className="text-red-600">*</span><input className={inp} value={name} onChange={e => setName(e.target.value)} /><Err k="name" /></label>
    <label className="block text-sm font-medium">โรงเรียน/สังกัด<input className={inp} value={school} onChange={e => setSchool(e.target.value)} /></label>
    <label className="block text-sm font-medium">จังหวัด<input className={inp} value={prov} onChange={e => setProv(e.target.value)} /></label>
    <fieldset><legend className="text-sm font-medium">กีฬาที่เล่น (เลือกได้หลายประเภท) <span className="text-red-600">*</span></legend>
      <div className="mt-2 flex flex-wrap gap-2">{RANKED_GAMES.map(g => (<label key={g} className={`cursor-pointer whitespace-nowrap rounded-full border px-4 py-1.5 text-sm ${games.includes(g) ? 'border-navy bg-navy text-white' : 'border-slate-300'}`}>
        <input type="checkbox" className="sr-only" checked={games.includes(g)} onChange={() => toggle(g)} />{GAME_LABEL[g]}</label>))}</div><Err k="games" /></fieldset>
    {games.length > 0 && (<div className="space-y-3 rounded-lg bg-gray-light p-4"><p className="text-sm font-medium">เรตติ้งตามกีฬาที่เล่น (เว้นว่างได้ถ้ายังไม่มี)</p>
      {games.map(g => (<label key={g} className="block text-sm">{GAME_LABEL[g]}<input type="number" step="any" className={inp} value={ratings[g]} onChange={e => setRatings(s => ({ ...s, [g]: e.target.value }))} /><Err k={`r_${g}`} /></label>))}
      <label className="block text-sm">วันที่มีผลของเรตติ้ง<input type="date" className={inp} value={date} onChange={e => setDate(e.target.value)} /><Err k="date" />
        <span className="text-xs text-muted">ใช้กับเรตติ้งที่เพิ่มหรือเปลี่ยนในครั้งนี้ ระบบเก็บประวัติเรตติ้งเดิมไว้ให้</span></label></div>)}
    <label className="block text-sm font-medium">สถานะการเผยแพร่<select className={inp} value={pubS} onChange={e => setPubS(e.target.value)}>{Object.entries(PUB).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
    <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" className="h-4 w-4" checked={active} onChange={e => setActive(e.target.checked)} />ยังใช้งานอยู่ (แสดงในหน้าอันดับ)</label></div>
    <div className="mt-6 flex justify-end gap-2"><button onClick={onClose} disabled={busy} className="rounded border border-slate-300 px-4 py-2">ยกเลิก</button>
      <button onClick={save} disabled={busy} className="rounded bg-navy px-4 py-2 text-white disabled:opacity-60">{busy ? 'กำลังบันทึก...' : 'บันทึก'}</button></div></Modal>);
}

function HistoryModal({ a, onClose, onChanged }: { a: Ath; onClose: () => void; onChanged: () => void }) {
  const toast = useToast(); const [rows, setRows] = useState<Hist[] | null>(null);
  const load = useCallback(async () => {
    const { data } = await supabase.from('athlete_rating_history').select('id,game_type,rating_value,effective_date,publication_status').eq('athlete_id', a.id)
      .order('effective_date', { ascending: false }).order('created_at', { ascending: false });
    setRows((data ?? []) as Hist[]);
  }, [a.id]);
  useEffect(() => { load(); }, [load]);
  async function toggle(h: Hist) {
    const next = h.publication_status === 'published' ? 'archived' : 'published';
    const { data, error } = await supabase.from('athlete_rating_history').update({ publication_status: next }).eq('id', h.id).select('id');
    if (error || !data?.length) { toast('err', 'เปลี่ยนสถานะไม่สำเร็จ'); return; }
    toast('ok', 'เปลี่ยนสถานะเรียบร้อยแล้ว'); load(); onChanged();
  }
  return (<Modal title={`ประวัติเรตติ้ง: ${a.full_name}`}>
    {!rows ? <LoadingState /> : rows.length === 0 ? <EmptyState text="ยังไม่มีประวัติเรตติ้ง" /> :
      <ul className="divide-y text-sm">{rows.map(h => <li key={h.id} className="flex items-center justify-between gap-3 py-2">
        <span><b>{GAME_LABEL[h.game_type] ?? h.game_type}</b> · {h.rating_value} · {thDate(h.effective_date)} · {PUB[h.publication_status]}</span>
        <button onClick={() => toggle(h)} className="shrink-0 whitespace-nowrap underline">{h.publication_status === 'published' ? 'ซ่อน' : 'เผยแพร่'}</button></li>)}</ul>}
    <button onClick={onClose} className="mt-4 rounded border border-slate-300 px-4 py-2">ปิด</button></Modal>);
}

export default function RankingsAdminPage() {
  const toast = useToast(); const [sp, setSp] = useSearchParams();
  const [aths, setAths] = useState<Ath[] | null>(null); const [cur, setCur] = useState<Record<string, number>>({}); const [failed, setFailed] = useState(false);
  const [q, setQ] = useState(''); const [game, setGame] = useState(''); const [pub, setPub] = useState('');
  const [edit, setEdit] = useState<Ath | 'new' | null>(null); const [hist, setHist] = useState<Ath | null>(null);
  const [del, setDel] = useState<Ath | null>(null); const [deleting, setDeleting] = useState(false);
  const load = useCallback(async () => {
    try {
      const [a, c] = await Promise.all([fetchAll<Ath>('athletes', 'id,full_name,school_name,province,games,publication_status,is_active', ['id']),
        fetchAll<Cur>('current_ratings', 'athlete_id,game_type,rating_value', ['athlete_id', 'game_type'])]);
      setAths(a); setCur(Object.fromEntries(c.map(x => [key(x.athlete_id, x.game_type), Number(x.rating_value)]))); setFailed(false);
    } catch { setFailed(true); }
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (sp.get('new')) { setEdit('new'); setSp({}, { replace: true }); } }, []); // eslint-disable-line
  const rows = useMemo(() => (aths ?? []).filter(a => (!game || a.games.includes(game)) && (!pub || a.publication_status === pub) &&
    (!q.trim() || [a.full_name, a.school_name, a.province].some(v => (v ?? '').toLowerCase().includes(q.trim().toLowerCase()))))
    .sort((x, y) => x.full_name.localeCompare(y.full_name, 'th')), [aths, q, game, pub]);
  async function remove() {
    if (!del || deleting) return; setDeleting(true);
    const { data, error } = await supabase.from('athletes').delete().eq('id', del.id).select('id');
    setDeleting(false);
    if (error || !data?.length) { toast('err', error?.code === '23503' ? 'ลบไม่ได้เพราะมีประวัติเรตติ้ง ให้ตั้งสถานะเป็น "เก็บถาวร" หรือปิดการใช้งานแทน' : 'ลบไม่สำเร็จ'); return; }
    toast('ok', 'ลบนักกีฬาเรียบร้อยแล้ว'); setDel(null); load();
  }
  const f = 'rounded border border-slate-300 bg-white p-2';
  return (<div className="mx-auto max-w-6xl space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-2"><h1 className="text-2xl">นักกีฬาและอันดับ</h1>
      <button onClick={() => setEdit('new')} className="flex items-center gap-1 whitespace-nowrap rounded bg-navy px-4 py-2 text-white"><Plus className="h-4 w-4" />เพิ่มนักกีฬา</button></div>
    <p className="rounded bg-blue-light p-3 text-sm">ระบบเรตติ้งมีเฉพาะครอสเวิร์ดและเอแม็ท นักกีฬาจะแสดงในหน้าอันดับเมื่อสถานะ "เผยแพร่", "ยังใช้งานอยู่", ได้เลือกกีฬานั้น และมีเรตติ้งที่เผยแพร่แล้ว</p>
    <div className="flex flex-wrap gap-2"><input aria-label="ค้นหา" placeholder="ค้นหาชื่อ โรงเรียน จังหวัด" value={q} onChange={e => setQ(e.target.value)} className={f} />
      <select aria-label="กีฬา" value={game} onChange={e => setGame(e.target.value)} className={f}><option value="">ทุกกีฬา</option>{RANKED_GAMES.map(g => <option key={g} value={g}>{GAME_LABEL[g]}</option>)}</select>
      <select aria-label="สถานะ" value={pub} onChange={e => setPub(e.target.value)} className={f}><option value="">ทุกสถานะ</option>{Object.entries(PUB).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
    {failed ? <ErrorState /> : !aths ? <LoadingState /> : rows.length === 0 ? <EmptyState text="ยังไม่มีนักกีฬา" /> :
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white"><table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-blue-light"><tr>{['ชื่อ-นามสกุล', 'โรงเรียน/สังกัด', 'จังหวัด', 'กีฬาและเรตติ้ง'].map(h => <th key={h} className="whitespace-nowrap p-3">{h}</th>)}<th className="p-3"><span className="sr-only">จัดการ</span></th></tr></thead>
        <tbody>{rows.map(a => (<tr key={a.id} className="border-t border-slate-100 align-top">
          <td className="p-3 font-medium">{a.full_name}{(a.publication_status !== 'published' || !a.is_active) && <span className="ml-2 whitespace-nowrap rounded bg-amber-100 px-2 text-xs text-amber-800">ไม่แสดงในหน้าอันดับ</span>}</td>
          <td className="p-3">{a.school_name ?? '—'}</td><td className="whitespace-nowrap p-3">{a.province ?? '—'}</td>
          <td className="p-3"><div className="flex flex-wrap gap-1">{a.games.length === 0 ? '—' : a.games.map(g => (<span key={g} className="whitespace-nowrap rounded-full bg-gray-light px-2.5 py-0.5 text-xs">
            {GAME_LABEL[g] ?? g}: <b>{cur[key(a.id, g)] ?? 'ยังไม่มีเรตติ้ง'}</b></span>))}</div></td>
          <td className="whitespace-nowrap p-3 text-right"><button aria-label="แก้ไข" onClick={() => setEdit(a)} className="p-2"><Pencil className="h-4 w-4" /></button>
            <button aria-label="ประวัติเรตติ้ง" onClick={() => setHist(a)} className="p-2"><History className="h-4 w-4" /></button>
            <button aria-label="ลบ" onClick={() => setDel(a)} className="p-2 text-red-700"><Trash2 className="h-4 w-4" /></button></td></tr>))}</tbody></table></div>}
    {edit && <AthleteForm a={edit === 'new' ? null : edit} cur={cur} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); load(); }} />}
    {hist && <HistoryModal a={hist} onClose={() => setHist(null)} onChanged={load} />}
    <ConfirmDialog open={!!del} title="ลบนักกีฬา" message="ต้องการลบนักกีฬาคนนี้หรือไม่? การลบไม่สามารถย้อนกลับได้" busy={deleting} onConfirm={remove} onCancel={() => setDel(null)} />
  </div>);
}
