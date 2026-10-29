import { useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, FileDown, FileSpreadsheet, Loader2, RefreshCw, Upload, UserPlus } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { invalidate } from '../../lib/query';
import { downloadAthletesWorkbook, RATED, readAthletesFile, type Rated, type SheetRow } from '../../lib/excel';
import { th } from '../../i18n/th';
import { useToast } from '../../components/common/Toast';
import { Drawer, Field, Pills } from './ui';

export interface ImportAthlete { id: string; full_name: string; full_name_en: string | null; games: string[]; publication_status: 'published' | 'archived' }
type Kind = 'new' | 'update' | 'same' | 'error';
interface Plan { row: number; kind: Kind; name: string; byName?: boolean; changes: string[]; errors: string[]; nRatings: number; payload?: Record<string, unknown> }
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const norm = (s: string) => s.normalize('NFC').replace(/\s+/g, ' ').trim();
const fmt = (n: number | undefined) => (n === undefined ? '—' : n.toLocaleString('en-US', { maximumFractionDigits: 2 }));
const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const STATUS = { published: 'เผยแพร่', archived: 'จัดเก็บ' } as const;
const KIND: Record<Kind, [string, string]> = { new: ['เพิ่มใหม่', 'bg-sky-50 text-sky-700 ring-sky-600/20'], update: ['แก้ไข', 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'],
  same: ['ไม่เปลี่ยน', 'bg-slate-100 text-slate-600 ring-slate-500/20'], error: ['ผิดพลาด', 'bg-red-50 text-red-700 ring-red-600/20'] };

/** Compares every sheet row with the data in the system and decides what will happen to it. */
function analyse(rows: SheetRow[], athletes: ImportAthlete[], cur: (id: string, g: Rated) => number | undefined): Plan[] {
  const byId = new Map(athletes.map(a => [a.id.toLowerCase(), a]));
  const byName = new Map<string, ImportAthlete[]>(); athletes.forEach(a => { const k = norm(a.full_name); byName.set(k, [...(byName.get(k) ?? []), a]); });
  const seenTarget = new Map<string, number>(); const seenNew = new Map<string, number>();
  return rows.map(r => {
    const errors: string[] = []; const changes: string[] = []; let a: ImportAthlete | undefined; let byNameMatch = false; let nRatings = 0;
    if (r.id) {
      if (!UUID.test(r.id)) errors.push('รหัสนักกีฬาไม่ถูกต้อง (อย่าแก้ไขคอลัมน์รหัส)');
      else { a = byId.get(r.id.toLowerCase()); if (!a) errors.push('ไม่พบรหัสนักกีฬานี้ในระบบ (อาจถูกลบไปแล้ว)'); }
    } else if (r.full_name) {
      const hits = byName.get(norm(r.full_name)) ?? [];
      if (hits.length > 1) errors.push(`มีนักกีฬาชื่อ "${r.full_name}" ในระบบ ${hits.length} คน กรุณาใส่รหัสนักกีฬา`);
      else if (hits.length === 1) { a = hits[0]; byNameMatch = true; }
    }
    if (!a && !errors.length) {
      if (!r.full_name) errors.push('ไม่มีชื่อภาษาไทย');
      if (!r.full_name_en) errors.push('นักกีฬาคนใหม่ต้องมีชื่อภาษาอังกฤษ');
    }
    if (r.full_name_en && /[฀-๿]/.test(r.full_name_en)) errors.push('ช่องชื่อภาษาอังกฤษมีตัวอักษรภาษาไทย');
    for (const g of RATED) { const v = r.ratings[g]; if (v === 'invalid') errors.push(`เรตติ้ง${th.games[g]}ต้องเป็นตัวเลข`); else if (typeof v === 'number' && v < 0) errors.push(`เรตติ้ง${th.games[g]}ต้องไม่ติดลบ`); }
    if (r.status === 'invalid') errors.push('สถานะต้องเป็น "เผยแพร่" หรือ "จัดเก็บ"');
    const key = a ? a.id : `new:${norm(r.full_name)}`; const prev = (a ? seenTarget : seenNew).get(key);
    if (prev) errors.push(`ซ้ำกับแถวที่ ${prev} ในไฟล์`); else (a ? seenTarget : seenNew).set(key, r.row);
    const name = r.full_name || a?.full_name || r.full_name_en || '(ไม่มีชื่อ)';
    if (errors.length) return { row: r.row, kind: 'error' as const, name, changes, errors, nRatings };
    const ratings = Object.fromEntries(RATED.map(g => [g, typeof r.ratings[g] === 'number' ? r.ratings[g] : null])) as Record<Rated, number | null>;
    const status = r.status === 'invalid' ? null : r.status;
    if (a) {
      if (r.full_name && norm(r.full_name) !== norm(a.full_name)) changes.push(`ชื่อไทย: ${a.full_name} → ${r.full_name}`);
      if (r.full_name_en && norm(r.full_name_en) !== norm(a.full_name_en ?? '')) changes.push(`ชื่ออังกฤษ: ${a.full_name_en || '—'} → ${r.full_name_en}`);
      if (status && status !== a.publication_status) changes.push(`สถานะ: ${STATUS[a.publication_status]} → ${STATUS[status]}`);
      for (const g of RATED) { const v = ratings[g]; if (v === null) continue; const c = cur(a.id, g);
        if (c === undefined || c !== v) { nRatings++; changes.push(`${th.games[g]}: ${fmt(c)} → ${fmt(v)}${a.games.includes(g) ? '' : ' (เพิ่มเกมนี้)'}`); } }
    } else {
      changes.push(`${r.full_name} / ${r.full_name_en}`); if (status === 'archived') changes.push('สถานะ: จัดเก็บ');
      for (const g of RATED) if (ratings[g] !== null) { nRatings++; changes.push(`${th.games[g]}: ${fmt(ratings[g]!)}`); }
    }
    const kind: Kind = !a ? 'new' : changes.length ? 'update' : 'same';
    return { row: r.row, kind, name, byName: byNameMatch, changes, errors, nRatings,
      payload: kind === 'same' ? undefined : { row: r.row, id: a?.id ?? null, full_name: r.full_name || null, full_name_en: r.full_name_en || null, status, ratings } };
  });
}

export default function ImportAthletesDialog({ athletes, cur, onClose, onDone }: { athletes: ImportAthlete[]; cur: (id: string, g: Rated) => number | undefined; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const [file, setFile] = useState<File | null>(null); const [plans, setPlans] = useState<Plan[] | null>(null); const [readErr, setReadErr] = useState('');
  const [busy, setBusy] = useState<'read' | 'save' | 'dl' | null>(null); const [date, setDate] = useState(today()); const [view, setView] = useState<Kind | 'all' | 'todo'>('todo');
  const [over, setOver] = useState(false); const input = useRef<HTMLInputElement>(null);
  const counts = useMemo(() => { const c: Record<Kind, number> = { new: 0, update: 0, same: 0, error: 0 }; plans?.forEach(p => c[p.kind]++); return c; }, [plans]);
  const todo = (plans ?? []).filter(p => p.payload);
  const ratingChanges = todo.reduce((n, p) => n + p.nRatings, 0);

  async function pick(f: File) {
    setFile(f); setPlans(null); setReadErr(''); setBusy('read'); setView('todo');
    try { const rows = await readAthletesFile(f); if (!rows.length) throw new Error('ไม่พบข้อมูลนักกีฬาในไฟล์'); setPlans(analyse(rows, athletes, cur)); }
    catch (e) { setReadErr((e as Error).message); } finally { setBusy(null); }
  }
  async function download(blank: boolean) {
    setBusy('dl');
    try { await downloadAthletesWorkbook(athletes, cur, blank); } catch { toast('err', 'สร้างไฟล์ Excel ไม่สำเร็จ'); } finally { setBusy(null); }
  }
  async function run() {
    if (!todo.length || busy) return;
    if (!date) { toast('err', 'กรุณาเลือกวันที่มีผลของเรตติ้ง'); return; }
    setBusy('save');
    const { data, error } = await supabase.rpc('admin_import_athletes', { p_rows: todo.map(p => p.payload), p_effective_date: date });
    setBusy(null);
    if (error) { const m = /ROW (\d+)/.exec(error.message); toast('err', `นำเข้าไม่สำเร็จ ไม่มีข้อมูลใดถูกบันทึก${m ? ` (แถวที่ ${m[1]})` : ''}: ${error.message.replace(/^ROW \d+: /, '')}`); return; }
    const r = data as { created: number; updated: number; ratings_added: number };
    toast('ok', `นำเข้าเรียบร้อย: เพิ่มใหม่ ${r.created} คน · แก้ไข ${r.updated} คน · บันทึกเรตติ้งใหม่ ${r.ratings_added} รายการ`);
    invalidate('rank:'); onDone();
  }
  const shown = (plans ?? []).filter(p => view === 'all' || (view === 'todo' ? p.kind !== 'same' : p.kind === view));

  return (<Drawer title="นำเข้า / แก้ไขด้วยไฟล์ Excel" busy={busy === 'save'} onClose={onClose}
    footer={<>{plans && counts.error > 0 && <span className="mr-auto inline-flex items-center gap-1.5 text-sm text-red-700"><AlertTriangle className="h-4 w-4" />แถวที่ผิดพลาด {counts.error} แถวจะถูกข้าม</span>}
      <button onClick={onClose} disabled={busy === 'save'} className="btn-outline btn-sm">ยกเลิก</button>
      <button onClick={run} disabled={!todo.length || !!busy} className="btn-primary btn-sm">{busy === 'save' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}{todo.length ? `นำเข้า ${todo.length} แถว` : 'นำเข้า'}</button></>}>
    <div className="space-y-5">
      <section className="card grid gap-4 p-5 md:grid-cols-3">
        {[['1', 'ดาวน์โหลดไฟล์', 'ไฟล์มีรายชื่อและเรตติ้งปัจจุบันทุกคน (หรือแม่แบบเปล่า)'], ['2', 'แก้ไขใน Excel', 'แก้เรตติ้ง ชื่อ สถานะ หรือเพิ่มนักกีฬาคนใหม่ที่แถวล่างสุด'], ['3', 'อัปโหลดกลับ', 'ตรวจตัวอย่างการเปลี่ยนแปลง แล้วกดนำเข้า']].map(([n, t, d]) => (
          <div key={n} className="flex gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-navy font-semibold text-gold">{n}</span><div><p className="font-medium text-navy-dark">{t}</p><p className="text-sm text-muted">{d}</p></div></div>))}
        <div className="flex flex-wrap gap-2 md:col-span-3">
          <button onClick={() => download(false)} disabled={!!busy} className="btn-outline btn-sm">{busy === 'dl' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}ดาวน์โหลดรายชื่อปัจจุบัน (.xlsx)</button>
          <button onClick={() => download(true)} disabled={!!busy} className="btn-outline btn-sm"><FileSpreadsheet className="h-4 w-4" />แม่แบบเปล่า</button></div></section>

      <section onDragOver={e => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={e => { e.preventDefault(); setOver(false); const f = e.dataTransfer.files[0]; if (f) pick(f); }}
        className={`flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition ${over ? 'scale-[1.01] border-gold bg-gold/10' : 'border-slate-300 bg-white hover:border-navy/40'}`}>
        {busy === 'read' ? <Loader2 className="h-9 w-9 animate-spin text-navy/60" /> : <FileSpreadsheet className="h-9 w-9 text-emerald-600" />}
        <p className="text-ink">{file ? <><b>{file.name}</b> · <button type="button" onClick={() => input.current?.click()} className="font-semibold text-navy underline">เลือกไฟล์อื่น</button></> :
          <>ลากไฟล์ Excel มาวางที่นี่ หรือ <button type="button" onClick={() => input.current?.click()} className="font-semibold text-navy underline">เลือกไฟล์</button></>}</p>
        <p className="text-xs text-muted">รองรับ .xlsx และ .csv · ช่องว่างในไฟล์ = ไม่เปลี่ยนแปลงข้อมูลเดิม</p>
        {file && plans && <button type="button" onClick={() => pick(file)} className="inline-flex items-center gap-1 text-xs text-navy hover:underline"><RefreshCw className="h-3 w-3" />อ่านไฟล์ใหม่</button>}
        <input ref={input} type="file" accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) pick(f); e.target.value = ''; }} /></section>
      {readErr && <p role="alert" className="flex animate-fade-in gap-2 rounded-2xl bg-red-50 p-4 text-sm text-red-800"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{readErr}</p>}

      {plans && (<section className="animate-fade-up space-y-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{(['new', 'update', 'same', 'error'] as Kind[]).map(k => (
          <button key={k} type="button" onClick={() => setView(v => (v === k ? 'todo' : k))} aria-pressed={view === k} className={`card p-4 text-left transition hover:shadow-lift ${view === k ? 'ring-2 ring-navy' : ''}`}>
            <span className={`chip ring-1 ${KIND[k][1]}`}>{KIND[k][0]}</span><p className="mt-2 text-2xl font-semibold text-navy-dark">{counts[k]}</p><p className="text-xs text-muted">แถว</p></button>))}</div>
        <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-end sm:justify-between">
          <Field label="วันที่มีผลของเรตติ้งที่นำเข้า" required htmlFor="imp-date" hint={`ใช้กับเรตติ้งที่เปลี่ยนในไฟล์นี้${ratingChanges ? ` (${ratingChanges} รายการ)` : ''} · ประวัติเดิมยังเก็บไว้`}>
            <input id="imp-date" type="date" className="input sm:w-56" value={date} onChange={e => setDate(e.target.value)} /></Field>
          <Pills value={view} onChange={setView} options={[{ value: 'todo', label: `ที่จะเปลี่ยน/ผิดพลาด (${plans.length - counts.same})` }, { value: 'all', label: `ทั้งหมด (${plans.length})` }]} /></div>
        {shown.length === 0 ? <p className="py-8 text-center text-sm text-muted">{view === 'todo' ? 'ไม่มีการเปลี่ยนแปลงในไฟล์นี้' : 'ไม่มีแถวในกลุ่มนี้'}</p> :
          <ul className="space-y-2">{shown.map(p => (<li key={p.row} className={`card flex gap-3 p-3 ${p.kind === 'error' ? 'border-red-200 bg-red-50/40' : ''}`}>
            <span className="w-14 shrink-0 pt-0.5 text-xs text-muted">แถว {p.row}</span>
            <div className="min-w-0 flex-1"><p className="flex flex-wrap items-center gap-2"><span className={`chip ring-1 ${KIND[p.kind][1]}`}>{p.kind === 'new' ? <UserPlus className="h-3 w-3" /> : p.kind === 'error' ? <AlertTriangle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}{KIND[p.kind][0]}</span>
              <span className="font-medium text-navy-dark">{p.name}</span>{p.byName && <span className="chip bg-amber-50 text-amber-800" title="ไฟล์ไม่มีรหัสนักกีฬา จึงจับคู่ด้วยชื่อภาษาไทย">จับคู่ด้วยชื่อ</span>}</p>
              {p.errors.map(e => <p key={e} className="mt-1 text-sm text-red-700">• {e}</p>)}
              {p.kind !== 'error' && p.kind !== 'new' && p.changes.map(c => <p key={c} className="mt-0.5 text-sm text-ink">• {c}</p>)}
              {p.kind === 'new' && <p className="mt-0.5 text-sm text-ink">{p.changes.join(' · ')}</p>}</div></li>))}</ul>}
      </section>)}
    </div></Drawer>);
}
