import { useCallback, useEffect, useMemo, useState } from 'react';
import { History, Loader2, Lock, MessageSquareText, Pencil, Plus, Save, Search, Send, Trash2 } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { RANKED_GAMES } from '../../utils/labels';
import { th } from '../../i18n/th';
import { fmtDate, fmtDateTime } from '../../lib/dates';
import { invalidate } from '../../lib/query';
import { useToast } from '../../components/common/Toast';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { EmptyState, ErrorState, LoadingState } from '../../components/common/States';
import Avatar from '../../components/rankings/Avatar';
import ImagesField from './ImagesField';
import { AdminHeader, Chips, Drawer, Field, Panel, Pills, PubBadge } from './ui';

interface Ath { id: string; full_name: string; full_name_en: string | null; photo_url: string | null; games: string[]; publication_status: 'published' | 'archived' }
interface Cur { athlete_id: string; game_type: string; rating_value: number }
interface Hist { id: string; game_type: string; rating_value: number; effective_date: string; publication_status: string }
interface Comment { id: string; body: string; created_at: string; created_by: string | null }
const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const key = (id: string, g: string) => `${id}|${g}`;
const GAMES = RANKED_GAMES.map(g => ({ value: g, label: th.games[g] }));

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

/** Private notes about an athlete. Only admins can read or write them; they are never shown on the website. */
function Comments({ athleteId, onChange }: { athleteId: string; onChange: () => void }) {
  const toast = useToast();
  const [list, setList] = useState<Comment[] | null>(null); const [text, setText] = useState(''); const [busy, setBusy] = useState(false); const [me, setMe] = useState('');
  const load = useCallback(async () => {
    const { data } = await supabase.from('athlete_comments').select('id,body,created_at,created_by').eq('athlete_id', athleteId).order('created_at', { ascending: false });
    setList((data ?? []) as Comment[]);
  }, [athleteId]);
  useEffect(() => { load(); supabase.auth.getUser().then(({ data }) => setMe(data.user?.id ?? '')); }, [load]);
  async function add() {
    if (!text.trim() || busy) return; setBusy(true);
    const { error } = await supabase.from('athlete_comments').insert({ athlete_id: athleteId, body: text.trim() }); setBusy(false);
    if (error) { toast('err', 'บันทึกความเห็นไม่สำเร็จ'); return; } setText(''); load(); onChange();
  }
  async function del(c: Comment) {
    const { error } = await supabase.from('athlete_comments').delete().eq('id', c.id);
    if (error) { toast('err', 'ลบไม่สำเร็จ'); return; } load(); onChange();
  }
  return (<Panel title={<span className="flex items-center gap-2 normal-case tracking-normal"><Lock className="h-4 w-4" />ความเห็นภายใน (ไม่เผยแพร่)</span>}>
    <div className="flex gap-2"><textarea rows={2} className="input" value={text} onChange={e => setText(e.target.value)} placeholder="เขียนความเห็นเกี่ยวกับนักกีฬา (เห็นเฉพาะผู้ดูแล)" />
      <button onClick={add} disabled={busy || !text.trim()} aria-label="บันทึกความเห็น" className="btn-primary btn-sm self-end">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</button></div>
    {!list ? <LoadingState text="กำลังโหลด..." /> : list.length === 0 ? <p className="text-sm text-muted">ยังไม่มีความเห็น</p> :
      <ul className="space-y-2">{list.map(c => (<li key={c.id} className="group animate-fade-in rounded-xl bg-amber-50/70 p-3 ring-1 ring-amber-100">
        <div className="flex items-center justify-between gap-2"><span className="text-xs text-muted">{fmtDateTime(c.created_at, 'th')}</span>
          {c.created_by === me && <button onClick={() => del(c)} aria-label="ลบความเห็น" className="rounded-full p-1 text-red-600 opacity-60 hover:bg-red-50 hover:opacity-100"><Trash2 className="h-3.5 w-3.5" /></button>}</div>
        <p className="mt-1 whitespace-pre-line text-sm">{c.body}</p></li>))}</ul>}</Panel>);
}

function AthleteForm({ a, cur, onClose, onSaved, onComments }: { a: Ath | null; cur: Record<string, number>; onClose: () => void; onSaved: () => void; onComments: () => void }) {
  const toast = useToast();
  const [name, setName] = useState(a?.full_name ?? ''); const [nameEn, setNameEn] = useState(a?.full_name_en ?? '');
  const [photo, setPhoto] = useState<string[]>(a?.photo_url ? [a.photo_url] : []); const [games, setGames] = useState<string[]>(a?.games ?? []);
  const [ratings, setRatings] = useState<Record<string, string>>(() => Object.fromEntries(RANKED_GAMES.map(g => [g, a && cur[key(a.id, g)] != null ? String(cur[key(a.id, g)]) : ''])));
  const [date, setDate] = useState(today()); const [pubS, setPubS] = useState<Ath['publication_status']>(a?.publication_status ?? 'published');
  const [err, setErr] = useState<Record<string, string>>({}); const [busy, setBusy] = useState(false); const [uploading, setUploading] = useState(false);
  async function save() {
    if (busy || uploading) return;
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'กรุณากรอกชื่อ-นามสกุล (ภาษาไทย)';
    if (!nameEn.trim()) e.nameEn = 'กรุณากรอกชื่อ-นามสกุล (ภาษาอังกฤษ)';
    else if (/[฀-๿]/.test(nameEn)) e.nameEn = 'ช่องนี้ต้องเป็นภาษาอังกฤษ';
    if (games.length === 0) e.games = 'กรุณาเลือกกีฬาอย่างน้อย 1 ประเภท';
    for (const g of games) { const v = ratings[g].trim(); if (v !== '' && (!Number.isFinite(Number(v)) || Number(v) < 0)) e[`r_${g}`] = 'เรตติ้งต้องเป็นตัวเลขที่ไม่ติดลบ'; }
    if (!date) e.date = 'กรุณาเลือกวันที่มีผล';
    setErr(e); if (Object.keys(e).length) { toast('err', 'กรุณาตรวจสอบข้อมูลในแบบฟอร์ม'); return; }
    setBusy(true);
    const { error } = await supabase.rpc('admin_save_athlete', { p_id: a?.id ?? null, p_full_name: name, p_full_name_en: nameEn, p_photo_url: photo[0] ?? null, p_games: games,
      p_publication_status: pubS, p_ratings: games.filter(g => ratings[g].trim() !== '').map(g => ({ game: g, value: Number(ratings[g]) })), p_effective_date: date });
    setBusy(false);
    if (error) { toast('err', `บันทึกไม่สำเร็จ: ${error.message}`); return; }
    toast('ok', a ? 'บันทึกข้อมูลนักกีฬาแล้ว' : 'เพิ่มนักกีฬาแล้ว'); invalidate('rank:'); onSaved();
  }
  return (<Drawer title={a ? 'แก้ไขนักกีฬา' : 'เพิ่มนักกีฬา'} badge={a && <PubBadge s={a.publication_status} />} busy={busy} onClose={onClose}
    footer={<><button onClick={onClose} disabled={busy} className="btn-outline btn-sm">ยกเลิก</button>
      <button onClick={save} disabled={busy || uploading} className="btn-primary btn-sm">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}บันทึก</button></>}>
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-5"><Panel>
        <Field label="ชื่อ-นามสกุล (ภาษาไทย)" required error={err.name} htmlFor="a-name"><input id="a-name" className="input" value={name} onChange={e => setName(e.target.value)} placeholder="เช่น สมชาย ใจดี" /></Field>
        <Field label="ชื่อ-นามสกุล (ภาษาอังกฤษ)" required error={err.nameEn} htmlFor="a-name-en" hint="แสดงเมื่อผู้ชมเลือกภาษาอังกฤษ"><input id="a-name-en" className="input" value={nameEn} onChange={e => setNameEn(e.target.value)} placeholder="e.g. Somchai Jaidee" /></Field>
        <Field label="กีฬาที่เล่น (เลือกได้หลายประเภท)" required error={err.games}><Chips value={games} onChange={setGames} options={GAMES} /></Field>
        {games.length > 0 && (<div className="animate-fade-in space-y-3 rounded-2xl bg-gray-light p-4"><p className="text-sm font-medium">เรตติ้งตามกีฬาที่เล่น (เว้นว่างได้ถ้ายังไม่มี)</p>
          <div className="grid gap-3 sm:grid-cols-2">{games.map(g => (<Field key={g} label={th.games[g]} error={err[`r_${g}`]} htmlFor={`r-${g}`}>
            <input id={`r-${g}`} type="number" step="any" inputMode="decimal" className="input" value={ratings[g]} onChange={e => setRatings(s => ({ ...s, [g]: e.target.value }))} /></Field>))}</div>
          <Field label="วันที่มีผลของเรตติ้ง" error={err.date} htmlFor="a-date" hint="ใช้กับเรตติ้งที่เพิ่มหรือเปลี่ยนในครั้งนี้ ระบบเก็บประวัติเรตติ้งเดิมไว้ให้"><input id="a-date" type="date" className="input" value={date} onChange={e => setDate(e.target.value)} /></Field></div>)}</Panel>
        {a && <Comments athleteId={a.id} onChange={onComments} />}</div>
      <div className="space-y-5">
        <Panel title="รูปโปรไฟล์"><ImagesField single value={photo} onChange={setPhoto} bucket="athlete-images" maxSide={800} onBusy={setUploading} />
          <div className="flex items-center gap-3 text-xs text-muted"><Avatar src={photo[0] ?? null} alt="ตัวอย่าง" size={48} />ถ้าไม่มีรูป ระบบจะแสดงรูปโปรไฟล์เริ่มต้น</div></Panel>
        <Panel title="สถานะ"><Pills value={pubS} onChange={setPubS} options={[{ value: 'published', label: 'เผยแพร่' }, { value: 'archived', label: 'จัดเก็บ' }]} />
          <p className="text-xs text-muted">"เผยแพร่" = แสดงในหน้าอันดับ (เมื่อมีเรตติ้ง) · "จัดเก็บ" = ไม่แสดง แต่เก็บข้อมูลและประวัติไว้</p></Panel></div></div>
  </Drawer>);
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
    toast('ok', 'เปลี่ยนสถานะแล้ว'); load(); onChanged(); invalidate('rank:');
  }
  return (<div className="fixed inset-0 z-50 grid place-items-center p-4"><div className="absolute inset-0 animate-fade-in bg-black/50" onClick={onClose} />
    <div role="dialog" aria-modal="true" aria-label={`ประวัติเรตติ้ง: ${a.full_name}`} className="relative max-h-[85vh] w-full max-w-lg animate-scale-in overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
      <h2 className="mb-4 flex items-center gap-2 font-sans text-xl font-semibold"><History className="h-5 w-5" />ประวัติเรตติ้ง: {a.full_name}</h2>
      {!rows ? <LoadingState text="กำลังโหลด..." /> : rows.length === 0 ? <EmptyState text="ยังไม่มีประวัติเรตติ้ง" /> :
        <ul className="divide-y divide-line text-sm">{rows.map(h => <li key={h.id} className="flex items-center justify-between gap-3 py-2.5">
          <span><b>{th.games[h.game_type] ?? h.game_type}</b> · {h.rating_value} · {fmtDate(h.effective_date, 'th', 'medium')} <PubBadge s={h.publication_status} /></span>
          <button onClick={() => toggle(h)} className="btn-outline btn-sm shrink-0">{h.publication_status === 'published' ? 'ซ่อน' : 'เผยแพร่'}</button></li>)}</ul>}
      <button onClick={onClose} className="btn-outline btn-sm mt-4">ปิด</button></div></div>);
}

export default function AthletesAdminPage() {
  const toast = useToast();
  const [aths, setAths] = useState<Ath[] | null>(null); const [cur, setCur] = useState<Record<string, number>>({}); const [notes, setNotes] = useState<Record<string, number>>({}); const [failed, setFailed] = useState(false);
  const [q, setQ] = useState(''); const [game, setGame] = useState(''); const [pub, setPub] = useState('');
  const [edit, setEdit] = useState<Ath | 'new' | null>(null); const [hist, setHist] = useState<Ath | null>(null);
  const [del, setDel] = useState<Ath | null>(null); const [deleting, setDeleting] = useState(false);
  const loadNotes = useCallback(async () => {
    const c = await fetchAll<{ athlete_id: string }>('athlete_comments', 'athlete_id', ['athlete_id']).catch(() => []);
    setNotes(c.reduce<Record<string, number>>((m, x) => ({ ...m, [x.athlete_id]: (m[x.athlete_id] ?? 0) + 1 }), {}));
  }, []);
  const load = useCallback(async () => {
    try {
      const [a, c] = await Promise.all([fetchAll<Ath>('athletes', 'id,full_name,full_name_en,photo_url,games,publication_status', ['id']),
        fetchAll<Cur>('current_ratings', 'athlete_id,game_type,rating_value', ['athlete_id', 'game_type'])]);
      setAths(a); setCur(Object.fromEntries(c.map(x => [key(x.athlete_id, x.game_type), Number(x.rating_value)]))); setFailed(false);
    } catch { setFailed(true); }
    loadNotes();
  }, [loadNotes]);
  useEffect(() => { load(); }, [load]);
  const rows = useMemo(() => (aths ?? []).filter(a => (!game || a.games.includes(game)) && (!pub || a.publication_status === pub) &&
    (!q.trim() || [a.full_name, a.full_name_en].some(v => (v ?? '').toLowerCase().includes(q.trim().toLowerCase()))))
    .sort((x, y) => x.full_name.localeCompare(y.full_name, 'th')), [aths, q, game, pub]);
  async function remove() {
    if (!del || deleting) return; setDeleting(true);
    const { data, error } = await supabase.from('athletes').delete().eq('id', del.id).select('id');
    setDeleting(false);
    if (error || !data?.length) { toast('err', error?.code === '23503' ? 'ลบไม่ได้เพราะมีประวัติเรตติ้ง ให้เปลี่ยนสถานะเป็น "จัดเก็บ" แทน' : 'ลบไม่สำเร็จ'); return; }
    toast('ok', 'ลบนักกีฬาแล้ว'); setDel(null); invalidate('rank:'); load();
  }
  return (<div className="mx-auto max-w-6xl">
    <AdminHeader title="นักกีฬาและอันดับ" sub={aths ? `ทั้งหมด ${aths.length} คน` : undefined} action={<button onClick={() => setEdit('new')} className="btn-primary"><Plus className="h-4 w-4" />เพิ่มนักกีฬา</button>} />
    <p className="mb-4 rounded-2xl bg-blue-light p-4 text-sm text-navy-dark">ระบบเรตติ้งมีเฉพาะครอสเวิร์ดและเอแม็ท นักกีฬาจะแสดงในหน้าอันดับเมื่อสถานะเป็น "เผยแพร่" ได้เลือกกีฬานั้น และมีเรตติ้ง</p>
    <div className="card mb-4 flex flex-col gap-3 p-3 sm:flex-row">
      <label className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" /><input aria-label="ค้นหา" placeholder="ค้นหาชื่อ (ไทย/อังกฤษ)" value={q} onChange={e => setQ(e.target.value)} className="input pl-10" /></label>
      <select aria-label="กีฬา" value={game} onChange={e => setGame(e.target.value)} className="input sm:w-auto"><option value="">ทุกกีฬา</option>{GAMES.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}</select>
      <select aria-label="สถานะ" value={pub} onChange={e => setPub(e.target.value)} className="input sm:w-auto"><option value="">ทุกสถานะ</option><option value="published">เผยแพร่</option><option value="archived">จัดเก็บ</option></select></div>
    {failed ? <ErrorState onRetry={load} /> : !aths ? <LoadingState text="กำลังโหลด..." /> : rows.length === 0 ? <EmptyState text="ยังไม่มีนักกีฬา" /> :
      <ul className="stagger grid gap-2 md:grid-cols-2">{rows.map((a, i) => (<li key={a.id} style={{ ['--i' as string]: i }} className="card flex items-center gap-3 p-3 transition hover:shadow-lift">
        <button onClick={() => setEdit(a)} className="flex min-w-0 flex-1 items-center gap-3 text-left"><Avatar src={a.photo_url} alt={a.full_name} size={52} />
          <span className="min-w-0"><span className="flex items-center gap-2"><span className="truncate font-medium text-navy-dark">{a.full_name}</span><PubBadge s={a.publication_status} /></span>
            <span className="block truncate text-xs text-muted">{a.full_name_en || <span className="text-amber-700">ยังไม่มีชื่อภาษาอังกฤษ</span>}</span>
            <span className="mt-1 flex flex-wrap gap-1">{a.games.map(g => <span key={g} className="chip bg-gray-light text-ink ring-1 ring-line">{th.games[g]}: <b className="text-navy">{cur[key(a.id, g)] ?? '—'}</b></span>)}
              {notes[a.id] > 0 && <span className="chip bg-amber-50 text-amber-800" title="ความเห็นภายใน"><MessageSquareText className="h-3 w-3" />{notes[a.id]}</span>}</span></span></button>
        <div className="flex shrink-0"><button aria-label="แก้ไข" title="แก้ไข" onClick={() => setEdit(a)} className="grid h-9 w-9 place-items-center rounded-full text-navy hover:bg-gray-light"><Pencil className="h-4 w-4" /></button>
          <button aria-label="ประวัติเรตติ้ง" title="ประวัติเรตติ้ง" onClick={() => setHist(a)} className="grid h-9 w-9 place-items-center rounded-full text-navy hover:bg-gray-light"><History className="h-4 w-4" /></button>
          <button aria-label="ลบ" title="ลบ" onClick={() => setDel(a)} className="grid h-9 w-9 place-items-center rounded-full text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button></div></li>))}</ul>}
    {edit && <AthleteForm a={edit === 'new' ? null : edit} cur={cur} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); load(); }} onComments={loadNotes} />}
    {hist && <HistoryModal a={hist} onClose={() => setHist(null)} onChanged={load} />}
    <ConfirmDialog open={!!del} title="ลบนักกีฬา" message="ต้องการลบนักกีฬาคนนี้หรือไม่? การลบไม่สามารถย้อนกลับได้" busy={deleting} onConfirm={remove} onCancel={() => setDel(null)} />
  </div>);
}
