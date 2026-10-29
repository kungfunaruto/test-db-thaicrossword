import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2, ChevronDown, FileSpreadsheet, FileDown, History, Loader2, RefreshCw, RotateCcw, SkipForward, Upload, UserPlus, UserSearch } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { invalidate } from '../../lib/query';
import { colLetter, downloadSample, guessColumns, readSheets, toNumber, type Columns, type Sheet } from '../../lib/excel';
import { buildIndex, hasThai, nameKey, tidy, type Via } from '../../lib/nameMatch';
import { fmtDate, fmtDateTime } from '../../lib/dates';
import { th } from '../../i18n/th';
import { useToast } from '../../components/common/Toast';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { EmptyState, LoadingState } from '../../components/common/States';
import { Drawer, Field, Pills } from './ui';

export interface ImportAthlete { id: string; full_name: string; full_name_en: string | null; games: string[]; publication_status: 'published' | 'archived' }
type Game = 'crossword' | 'a_math';
type Kind = 'change' | 'same' | 'new' | 'review' | 'error';
interface Candidate { person: ImportAthlete; score: number; via: Via; swapped?: boolean }
interface RowPlan { row: number; name: string; rating: number; kind: Kind; match?: ImportAthlete; via?: Via; candidates?: Candidate[]; error?: string }
const VIA: Record<Via, string> = { th: 'ตรงกับชื่อไทย', en: 'ตรงกับชื่ออังกฤษ' };
const NEAR: Record<Via, string> = { th: 'คล้ายชื่อไทย', en: 'คล้ายชื่ออังกฤษ' };
interface ImportLog { id: string; game_type: string; file_name: string | null; effective_date: string; rows_total: number; ratings_changed: number; athletes_created: number; status: 'applied' | 'reverted'; created_at: string; reverted_at: string | null }
const fmt = (n: number | undefined | null) => (n == null ? '—' : Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 }));
const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const cellText = (v: unknown) => tidy(v == null ? '' : String(v));

/** Reads the chosen columns and classifies each row against the athletes already in the system. */
function analyse(sheet: Sheet, cols: Columns, athletes: ImportAthlete[]): RowPlan[] {
  if (cols.name === null || cols.rating === null) return [];
  const find = buildIndex(athletes); const seen = new Map<string, number>(); const out: RowPlan[] = [];
  sheet.grid.forEach((r, i) => {
    if (i <= cols.header) return;
    const name = cellText(r[cols.name!]); const raw = r[cols.rating!] ?? null;
    const val = toNumber(raw); const row = i + 1;
    if (!name && val === null) return; // empty row
    const base = { row, name, rating: typeof val === 'number' ? val : 0 };
    const err = !name ? 'ไม่มีชื่อ' : val === null ? 'ไม่มีเรตติ้ง' : val === 'invalid' ? `เรตติ้ง "${raw}" ไม่ใช่ตัวเลข` : val < 0 ? 'เรตติ้งติดลบ' : '';
    if (err) { out.push({ ...base, kind: 'error', error: err }); return; }
    const k = nameKey(name); const dup = seen.get(k);
    if (dup) { out.push({ ...base, kind: 'error', error: `ชื่อซ้ำกับแถว ${dup} ในไฟล์` }); return; }
    seen.set(k, row);
    const m = find(name);
    // The name is compared with BOTH the Thai and the English name of every athlete.
    if (m.exact.length === 1) { out.push({ ...base, kind: 'change', match: m.exact[0].person, via: m.exact[0].via }); return; }
    if (m.exact.length > 1) { out.push({ ...base, kind: 'review', candidates: m.exact.map(x => ({ person: x.person, score: 1, via: x.via })) }); return; }
    if (m.similar.length) { out.push({ ...base, kind: 'review', candidates: m.similar }); return; }
    out.push({ ...base, kind: 'new' });
  });
  return out;
}

function HistoryTab({ athletes, onChanged }: { athletes: ImportAthlete[]; onChanged: () => void }) {
  const toast = useToast();
  const [logs, setLogs] = useState<ImportLog[] | null>(null); const [open, setOpen] = useState<string | null>(null);
  const [detail, setDetail] = useState<Record<string, { athlete_id: string; rating_value: number; publication_status: string }[]>>({});
  const [undo, setUndo] = useState<ImportLog | null>(null); const [busy, setBusy] = useState(false);
  const names = useMemo(() => new Map(athletes.map(a => [a.id, a.full_name])), [athletes]);
  const load = useCallback(async () => {
    const { data } = await supabase.from('rating_imports').select('*').order('created_at', { ascending: false }).limit(50);
    setLogs((data ?? []) as ImportLog[]);
  }, []);
  useEffect(() => { load(); }, [load]);
  async function toggle(l: ImportLog) {
    if (open === l.id) { setOpen(null); return; }
    setOpen(l.id);
    if (!detail[l.id]) { const { data } = await supabase.from('athlete_rating_history').select('athlete_id,rating_value,publication_status').eq('import_id', l.id).limit(5000);
      setDetail(d => ({ ...d, [l.id]: (data ?? []) as { athlete_id: string; rating_value: number; publication_status: string }[] })); }
  }
  async function revert() {
    if (!undo) return; setBusy(true);
    const { data, error } = await supabase.rpc('admin_revert_rating_import', { p_id: undo.id }); setBusy(false);
    if (error) { toast('err', `ย้อนกลับไม่สำเร็จ: ${error.message}`); return; }
    const r = data as { ratings_archived: number; athletes_archived: number };
    toast('ok', `ย้อนกลับแล้ว: ยกเลิกเรตติ้ง ${r.ratings_archived} รายการ${r.athletes_archived ? ` · จัดเก็บนักกีฬาที่เพิ่มจากไฟล์นี้ ${r.athletes_archived} คน` : ''}`);
    setUndo(null); setDetail({}); invalidate('rank:'); load(); onChanged();
  }
  if (!logs) return <LoadingState text="กำลังโหลด..." />;
  if (!logs.length) return <EmptyState text="ยังไม่มีการนำเข้าเรตติ้ง" />;
  return (<div className="space-y-3">
    <p className="rounded-2xl bg-blue-light p-4 text-sm text-navy-dark">การย้อนกลับจะยกเลิกเรตติ้งจากไฟล์นั้น (ข้อมูลไม่ถูกลบ ยังเก็บเป็นประวัติ) นักกีฬาจะกลับไปใช้เรตติ้งก่อนหน้าทันที และนักกีฬาที่ถูกเพิ่มจากไฟล์นั้นจะถูกจัดเก็บ</p>
    {logs.map(l => (<div key={l.id} className={`card overflow-hidden ${l.status === 'reverted' ? 'opacity-70' : ''}`}>
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1"><p className="flex flex-wrap items-center gap-2">
          <span className="chip bg-navy text-white">{th.games[l.game_type]}</span>
          {l.status === 'applied' ? <span className="chip bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20">นำเข้าแล้ว</span>
            : <span className="chip bg-slate-100 text-slate-600 ring-1 ring-slate-500/20">ย้อนกลับแล้ว {l.reverted_at && fmtDateTime(l.reverted_at, 'th')}</span>}
          <span className="truncate font-medium text-navy-dark">{l.file_name ?? 'ไม่มีชื่อไฟล์'}</span></p>
          <p className="mt-1 text-xs text-muted">นำเข้าเมื่อ {fmtDateTime(l.created_at, 'th')} · มีผล {fmtDate(l.effective_date, 'th', 'medium')} · {l.rows_total} แถว · เรตติ้งเปลี่ยน {l.ratings_changed} คน · เพิ่มใหม่ {l.athletes_created} คน</p></div>
        <div className="flex shrink-0 gap-2"><button onClick={() => toggle(l)} className="btn-outline btn-sm"><ChevronDown className={`h-4 w-4 transition ${open === l.id ? 'rotate-180' : ''}`} />รายละเอียด</button>
          {l.status === 'applied' && <button onClick={() => setUndo(l)} className="btn btn-sm border border-red-200 bg-white text-red-700 hover:bg-red-50"><RotateCcw className="h-4 w-4" />ย้อนกลับ</button>}</div></div>
      {open === l.id && <div className="animate-slide-down border-t border-line bg-gray-light/60 p-4">{!detail[l.id] ? <LoadingState text="กำลังโหลด..." /> : detail[l.id].length === 0 ? <p className="text-sm text-muted">ไม่มีเรตติ้งที่เปลี่ยนจากไฟล์นี้</p> :
        <ul className="grid gap-1 text-sm sm:grid-cols-2">{detail[l.id].map((h, i) => <li key={i} className="flex justify-between gap-2 rounded-lg bg-white px-3 py-1.5"><span className="truncate">{names.get(h.athlete_id) ?? '—'}</span>
          <span className={`tabular-nums ${h.publication_status === 'archived' ? 'text-muted line-through' : 'font-medium text-navy'}`}>{fmt(h.rating_value)}</span></li>)}</ul>}</div>}
    </div>))}
    <ConfirmDialog open={!!undo} title="ย้อนกลับการนำเข้า" confirmLabel="ย้อนกลับ" busy={busy} onConfirm={revert} onCancel={() => setUndo(null)}
      message={undo ? `ยกเลิกเรตติ้ง${th.games[undo.game_type]}จากไฟล์ "${undo.file_name ?? ''}" (${undo.ratings_changed + undo.athletes_created} คน) นักกีฬาจะกลับไปใช้เรตติ้งก่อนหน้า ข้อมูลยังเก็บไว้เป็นประวัติ` : ''} />
  </div>);
}

export default function ImportRatingsDialog({ athletes, cur, onClose, onChanged }: { athletes: ImportAthlete[]; cur: (id: string, g: Game) => number | undefined; onClose: () => void; onChanged: () => void }) {
  const toast = useToast();
  const [tab, setTab] = useState<'import' | 'history'>('import');
  const [game, setGame] = useState<Game | ''>(''); const [date, setDate] = useState(today());
  const [file, setFile] = useState<File | null>(null); const [sheets, setSheets] = useState<Sheet[] | null>(null); const [si, setSi] = useState(0);
  const [cols, setCols] = useState<Columns | null>(null); const [readErr, setReadErr] = useState('');
  const [decide, setDecide] = useState<Record<number, string>>({}); const [enNames, setEnNames] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState<'read' | 'save' | null>(null); const [done, setDone] = useState<{ changed: number; created: number; unchanged: number } | null>(null);
  const [over, setOver] = useState(false); const input = useRef<HTMLInputElement>(null);
  const sheet = sheets?.[si] ?? null;

  async function pick(f: File) {
    setFile(f); setSheets(null); setCols(null); setReadErr(''); setDecide({}); setEnNames({}); setDone(null); setBusy('read');
    try { const s = await readSheets(f); setSheets(s); setSi(0); setCols(guessColumns(s[0].grid)); }
    catch (e) { setReadErr((e as Error).message); } finally { setBusy(null); }
  }
  const plans = useMemo(() => (sheet && cols ? analyse(sheet, cols, athletes) : []), [sheet, cols, athletes]);
  // Apply the admin's choices for similar names, then work out what will happen to each row for the chosen game.
  const final = useMemo(() => {
    const used = new Map<string, number>();
    return plans.map(p => {
      let kind: Kind | 'skip' = p.kind; let match = p.match; let via = p.via; let conflict = '';
      if (p.kind === 'review') { const d = decide[p.row]; if (d === 'new') kind = 'new'; else if (d === 'skip') kind = 'skip'; else if (d) { const c = p.candidates!.find(x => x.person.id === d); match = c?.person; via = c?.via; kind = 'change'; } }
      if (match && (kind === 'change' || kind === 'same')) {
        const prev = used.get(match.id); if (prev) conflict = `แถวนี้กับแถว ${prev} เป็นนักกีฬาคนเดียวกัน (${match.full_name}) กรุณาแก้ไฟล์หรือเลือกใหม่`; else used.set(match.id, p.row);
        const old = game ? cur(match.id, game) : undefined;
        if (!conflict && old !== undefined && old === p.rating) kind = 'same';
      }
      return { ...p, kind: conflict ? 'error' as const : kind, match, via, old: match && game ? cur(match.id, game) : undefined, error: conflict || p.error, chosen: p.kind === 'review' && !!decide[p.row] };
    });
  }, [plans, decide, game, cur]);
  const by = (k: Kind | 'skip') => final.filter(p => p.kind === k);
  const changes = by('change'), news = by('new'), reviews = by('review'), sames = by('same'), errors = by('error'), skips = by('skip');
  const ready = !!game && !!date && reviews.length === 0 && changes.length + news.length > 0;

  async function run() {
    if (!ready || busy || !game) return;
    setBusy('save');
    const payload = [...changes.map(p => ({ row: p.row, athlete_id: p.match!.id, rating: p.rating })),
      ...news.map(p => ({ row: p.row, athlete_id: null, name: p.name, name_en: (enNames[p.row] ?? (hasThai(p.name) ? '' : p.name)).trim() || null, rating: p.rating }))];
    const { data, error } = await supabase.rpc('admin_import_ratings', { p_game: game, p_effective_date: date, p_file_name: file?.name ?? null, p_rows: payload });
    setBusy(null);
    if (error) { const m = /ROW (\d+)/.exec(error.message); toast('err', `นำเข้าไม่สำเร็จ ไม่มีข้อมูลใดถูกบันทึก${m ? ` (แถวที่ ${m[1]})` : ''}: ${error.message.replace(/^ROW \d+: /, '')}`); return; }
    const r = data as { changed: number; created: number; unchanged: number };
    setDone({ ...r, unchanged: r.unchanged + sames.length }); toast('ok', `นำเข้าเรตติ้ง${th.games[game]}แล้ว: เปลี่ยน ${r.changed} คน · เพิ่มใหม่ ${r.created} คน`); invalidate('rank:'); onChanged();
  }
  const header = sheet && cols && cols.header >= 0 ? sheet.grid[cols.header] ?? [] : [];
  const width = sheet ? Math.max(0, ...sheet.grid.map(r => r.length)) : 0;
  const colOptions = Array.from({ length: width }, (_, i) => ({ value: String(i), label: `คอลัมน์ ${colLetter(i)}${header[i] ? ` · ${String(header[i]).slice(0, 30)}` : ''}` }));
  const colSelect = (k: keyof Omit<Columns, 'header'>, label: string, optional = false) => (<Field label={label} required={!optional} htmlFor={`col-${k}`}>
    <select id={`col-${k}`} className="input" value={cols?.[k] ?? ''} onChange={e => { setCols(c => c && { ...c, [k]: e.target.value === '' ? null : Number(e.target.value) }); setDecide({}); }}>
      <option value="">{optional ? '— ไม่มี —' : '— เลือกคอลัมน์ —'}</option>{colOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>);

  const footer = tab === 'history' || done ? <button onClick={onClose} className="btn-primary btn-sm">ปิด</button> : (<>
    <span className="mr-auto text-sm">{!game ? <span className="text-amber-700">เลือกเกมก่อน</span> : reviews.length ? <span className="inline-flex items-center gap-1.5 text-amber-700"><UserSearch className="h-4 w-4" />ยังต้องตรวจสอบชื่อ {reviews.length} แถว</span>
      : errors.length ? <span className="inline-flex items-center gap-1.5 text-red-700"><AlertTriangle className="h-4 w-4" />แถวที่ผิดพลาด {errors.length} แถวจะถูกข้าม</span> : null}</span>
    <button onClick={onClose} disabled={busy === 'save'} className="btn-outline btn-sm">ยกเลิก</button>
    <button onClick={run} disabled={!ready || !!busy} className="btn-primary btn-sm">{busy === 'save' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}ยืนยันนำเข้า{changes.length + news.length ? ` (เปลี่ยน ${changes.length} · ใหม่ ${news.length})` : ''}</button></>);

  return (<Drawer title="นำเข้าเรตติ้งจากไฟล์ Excel" busy={busy === 'save'} onClose={onClose} footer={footer}>
    <div role="tablist" className="mb-5 inline-flex rounded-full border border-line bg-white p-1 shadow-sm">
      {([['import', 'นำเข้าไฟล์', Upload], ['history', 'ประวัติการนำเข้า / ย้อนกลับ', History]] as const).map(([k, label, Icon]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
        className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition ${tab === k ? 'bg-navy text-white shadow' : 'text-ink/70 hover:text-navy'}`}><Icon className="h-4 w-4" />{label}</button>)}</div>

    {tab === 'history' ? <HistoryTab athletes={athletes} onChanged={onChanged} /> : done ? (
      <div className="card mx-auto max-w-lg animate-scale-in p-8 text-center"><CheckCircle2 className="mx-auto h-14 w-14 animate-pop text-emerald-600" />
        <h3 className="mt-3 font-sans text-xl font-semibold">นำเข้าเรตติ้ง{game && th.games[game]}เรียบร้อย</h3>
        <p className="mt-2 text-muted">เรตติ้งเปลี่ยน {done.changed} คน · เพิ่มใหม่ {done.created} คน · ไม่เปลี่ยน {done.unchanged} คน</p>
        <p className="mt-1 text-sm text-muted">ถ้าพบข้อผิดพลาด สามารถย้อนกลับได้ที่แท็บ "ประวัติการนำเข้า"</p>
        <div className="mt-5 flex justify-center gap-2"><button onClick={() => setTab('history')} className="btn-outline btn-sm"><History className="h-4 w-4" />ดูประวัติการนำเข้า</button>
          <button onClick={() => { setDone(null); setFile(null); setSheets(null); setCols(null); }} className="btn-outline btn-sm"><RefreshCw className="h-4 w-4" />นำเข้าไฟล์อื่น</button></div></div>
    ) : (<div className="space-y-5">
      <section className="card grid gap-5 p-5 md:grid-cols-[1fr_auto]">
        <div className="space-y-4">
          <Field label="1. เลือกเกมที่จะนำเข้าเรตติ้ง" required><Pills value={game} onChange={g => setGame(g as Game)} options={[{ value: 'crossword', label: th.games.crossword }, { value: 'a_math', label: th.games.a_math }]} /></Field>
          <Field label="2. วันที่มีผลของเรตติ้ง" required htmlFor="imp-date" hint="เรตติ้งเดิมไม่ถูกลบ ระบบเก็บเป็นประวัติ และย้อนกลับได้"><input id="imp-date" type="date" className="input sm:w-56" value={date} onChange={e => setDate(e.target.value)} /></Field></div>
        <div className="text-sm md:w-64"><p className="font-medium text-navy-dark">ไฟล์ต้องมี</p><ul className="mt-1 list-disc space-y-0.5 pl-5 text-muted"><li>คอลัมน์ <b>รายชื่อ</b> (ไทยหรืออังกฤษก็ได้)</li><li>คอลัมน์ <b>เรตติ้ง</b></li></ul>
          <p className="mt-1.5 text-xs text-muted">ระบบเทียบรายชื่อกับทั้งชื่อไทยและชื่ออังกฤษของนักกีฬาในระบบ และบอกว่าตรงกับชื่อไหน</p>
          <button type="button" onClick={() => downloadSample().catch(() => toast('err', 'สร้างไฟล์ตัวอย่างไม่สำเร็จ'))} className="mt-2 inline-flex items-center gap-1.5 font-medium text-navy hover:underline"><FileDown className="h-4 w-4" />ดาวน์โหลดไฟล์ตัวอย่าง</button></div></section>

      <section onDragOver={e => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={e => { e.preventDefault(); setOver(false); const f = e.dataTransfer.files[0]; if (f) pick(f); }}
        className={`flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-4 py-7 text-center transition ${over ? 'scale-[1.01] border-gold bg-gold/10' : 'border-slate-300 bg-white hover:border-navy/40'}`}>
        {busy === 'read' ? <Loader2 className="h-9 w-9 animate-spin text-navy/60" /> : <FileSpreadsheet className="h-9 w-9 text-emerald-600" />}
        <p className="text-ink">{file ? <><b>{file.name}</b> · <button type="button" onClick={() => input.current?.click()} className="font-semibold text-navy underline">เลือกไฟล์อื่น</button></> :
          <>3. ลากไฟล์ Excel มาวางที่นี่ หรือ <button type="button" onClick={() => input.current?.click()} className="font-semibold text-navy underline">เลือกไฟล์</button></>}</p>
        <p className="text-xs text-muted">.xlsx หรือ .csv · ไฟล์ถูกอ่านในเบราว์เซอร์เท่านั้น ไม่ถูกอัปโหลดเก็บไว้</p>
        <input ref={input} type="file" accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) pick(f); e.target.value = ''; }} /></section>
      {readErr && <p role="alert" className="flex animate-fade-in gap-2 rounded-2xl bg-red-50 p-4 text-sm text-red-800"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{readErr}</p>}

      {sheet && cols && (<section className="card grid animate-fade-up gap-4 p-5 md:grid-cols-3">
        {sheets!.length > 1 && <Field label="แผ่นงาน" htmlFor="col-sheet"><select id="col-sheet" className="input" value={si} onChange={e => { const i = Number(e.target.value); setSi(i); setCols(guessColumns(sheets![i].grid)); setDecide({}); }}>
          {sheets!.map((s, i) => <option key={s.name + i} value={i}>{s.name}</option>)}</select></Field>}
        {colSelect('name', 'คอลัมน์รายชื่อ')}{colSelect('rating', 'คอลัมน์เรตติ้ง')}</section>)}

      {sheet && cols && (cols.name === null || cols.rating === null) && <p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">กรุณาเลือกคอลัมน์รายชื่อและคอลัมน์เรตติ้ง</p>}
      {plans.length > 0 && !game && <p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">เลือกเกม (ครอสเวิร์ด หรือ เอแม็ท) เพื่อเทียบกับเรตติ้งปัจจุบัน</p>}

      {plans.length > 0 && game && (<div className="animate-fade-up space-y-5">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">{([['เรตติ้งเปลี่ยน', changes.length, 'text-emerald-700'], ['เพิ่มใหม่', news.length, 'text-sky-700'], ['ต้องตรวจสอบชื่อ', reviews.length, 'text-amber-700'],
          ['ไม่เปลี่ยน', sames.length, 'text-slate-500'], ['ข้าม / ผิดพลาด', errors.length + skips.length, 'text-red-700']] as const).map(([l, n, c]) => (
          <div key={l} className="card p-4"><p className="text-xs text-muted">{l}</p><p className={`text-2xl font-semibold ${c}`}>{n}</p></div>))}</div>

        {reviews.length > 0 && <section className="card border-amber-300 p-5"><h3 className="flex items-center gap-2 font-sans text-base font-semibold text-amber-900"><UserSearch className="h-5 w-5" />ตรวจสอบชื่อ: ไม่ตรงกับในระบบ แต่คล้ายกับนักกีฬาที่มีอยู่ ({reviews.length})</h3>
          <p className="mb-4 mt-1 text-sm text-muted">ป้องกันการสะกดชื่อผิดแล้วเกิดนักกีฬาซ้ำ กรุณาเลือกว่าเป็นคนเดียวกับคนในระบบ หรือเป็นคนใหม่</p>
          <ul className="space-y-3">{reviews.map(p => (<li key={p.row} className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
            <p className="text-sm"><span className="text-muted">แถว {p.row}:</span> <b className="text-navy-dark">"{p.name}"</b> เรตติ้ง <b>{fmt(p.rating)}</b></p>
            <div className="mt-2 space-y-1.5">{p.candidates!.map(c => (<label key={c.person.id} className="flex cursor-pointer items-center gap-3 rounded-lg bg-white px-3 py-2 ring-1 ring-line hover:ring-navy/30">
              <input type="radio" name={`r${p.row}`} className="h-4 w-4 accent-navy" checked={decide[p.row] === c.person.id} onChange={() => setDecide(d => ({ ...d, [p.row]: c.person.id }))} />
              <span className="min-w-0 flex-1 text-sm">เป็นคนเดียวกับ <b>{c.person.full_name}</b>{c.person.full_name_en && <span className="text-muted"> ({c.person.full_name_en})</span>}
                <span className="block text-xs text-muted">{c.score === 1 ? VIA[c.via] : c.swapped ? `${NEAR[c.via]} (ชื่อ-นามสกุลสลับกัน)` : `${NEAR[c.via]} ${Math.round(c.score * 100)}%`} · เรตติ้ง{th.games[game]}ปัจจุบัน {fmt(cur(c.person.id, game))} → {fmt(p.rating)}{c.person.publication_status === 'archived' ? ' · สถานะจัดเก็บ' : ''}</span></span></label>))}
              <label className="flex cursor-pointer items-center gap-3 rounded-lg bg-white px-3 py-2 ring-1 ring-line hover:ring-navy/30"><input type="radio" name={`r${p.row}`} className="h-4 w-4 accent-navy" checked={decide[p.row] === 'new'} onChange={() => setDecide(d => ({ ...d, [p.row]: 'new' }))} />
                <UserPlus className="h-4 w-4 text-sky-700" /><span className="text-sm">เป็นนักกีฬาคนใหม่ (ชื่อถูกต้องแล้ว)</span></label>
              <label className="flex cursor-pointer items-center gap-3 rounded-lg bg-white px-3 py-2 ring-1 ring-line hover:ring-navy/30"><input type="radio" name={`r${p.row}`} className="h-4 w-4 accent-navy" checked={decide[p.row] === 'skip'} onChange={() => setDecide(d => ({ ...d, [p.row]: 'skip' }))} />
                <SkipForward className="h-4 w-4 text-muted" /><span className="text-sm">ข้ามแถวนี้</span></label></div></li>))}</ul></section>}

        {changes.length > 0 && <section className="card overflow-hidden"><h3 className="flex items-center gap-2 border-b border-line px-5 py-3 font-sans text-base font-semibold"><RefreshCw className="h-4 w-4 text-emerald-600" />เรตติ้งที่จะเปลี่ยน ({changes.length})</h3>
          <ul className="divide-y divide-line">{changes.map(p => { const d = p.old === undefined ? null : p.rating - p.old; return (<li key={p.row} className="grid grid-cols-[1fr_auto] items-center gap-3 px-5 py-2.5 sm:grid-cols-[3.5rem_1fr_auto_auto]">
            <span className="hidden text-xs text-muted sm:block">แถว {p.row}</span>
            <span className="min-w-0"><span className="flex flex-wrap items-center gap-x-2"><span className="truncate font-medium text-navy-dark">{p.match!.full_name}</span>{p.match!.full_name_en && <span className="truncate text-sm text-muted">{p.match!.full_name_en}</span>}</span>
              <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted">{p.chosen ? <span className="chip bg-amber-50 text-amber-800">เลือกเอง</span> : p.via && <span className={`chip ${p.via === 'en' ? 'bg-violet-50 text-violet-700' : 'bg-blue-light text-navy'}`}>{VIA[p.via]}</span>}
                {(p.chosen || nameKey(p.name) !== nameKey(p.via === 'en' ? p.match!.full_name_en ?? '' : p.match!.full_name)) && <span className="truncate">ในไฟล์: {p.name}</span>}</span></span>
            <span className="flex items-center gap-1.5 tabular-nums"><span className="text-muted">{p.old === undefined ? 'ยังไม่มี' : fmt(p.old)}</span><ArrowRight className="h-3.5 w-3.5 text-muted" /><b className="text-navy-dark">{fmt(p.rating)}</b></span>
            <span className={`hidden w-16 text-right text-xs font-semibold tabular-nums sm:block ${d === null ? 'text-sky-700' : d > 0 ? 'text-emerald-600' : 'text-red-600'}`}>{d === null ? 'ใหม่' : `${d > 0 ? '+' : ''}${fmt(d)}`}</span></li>); })}</ul></section>}

        {news.length > 0 && <section className="card overflow-hidden"><h3 className="flex items-center gap-2 border-b border-line px-5 py-3 font-sans text-base font-semibold"><UserPlus className="h-4 w-4 text-sky-700" />นักกีฬาที่จะเพิ่มใหม่ ({news.length})</h3>
          <p className="border-b border-line bg-sky-50/60 px-5 py-2 text-xs text-sky-900">ไม่พบชื่อเหล่านี้หรือชื่อที่คล้ายกันในระบบ กรุณาตรวจการสะกดอีกครั้งก่อนยืนยัน ชื่อภาษาอังกฤษเพิ่มทีหลังในหน้าแก้ไขนักกีฬาได้</p>
          <ul className="divide-y divide-line">{news.map(p => (<li key={p.row} className="grid gap-2 px-5 py-2.5 sm:grid-cols-[3.5rem_1fr_1fr_auto] sm:items-center">
            <span className="hidden text-xs text-muted sm:block">แถว {p.row}</span><span className="font-medium text-navy-dark">{p.name}{p.chosen && <span className="ml-2 text-xs font-normal text-muted">เลือกเอง</span>}</span>
            <input aria-label={`ชื่อภาษาอังกฤษของ ${p.name}`} className="input py-1.5 text-sm" placeholder="ชื่อภาษาอังกฤษ (ไม่บังคับ)" value={enNames[p.row] ?? (hasThai(p.name) ? '' : p.name)} onChange={e => setEnNames(s => ({ ...s, [p.row]: e.target.value }))} />
            <b className="text-right tabular-nums text-navy-dark">{fmt(p.rating)}</b></li>))}</ul></section>}

        {errors.length > 0 && <section className="card border-red-200 p-5"><h3 className="flex items-center gap-2 font-sans text-base font-semibold text-red-800"><AlertTriangle className="h-4 w-4" />แถวที่จะถูกข้าม ({errors.length})</h3>
          <ul className="mt-2 space-y-1 text-sm">{errors.map(p => <li key={p.row}><span className="text-muted">แถว {p.row}:</span> {p.name || '(ไม่มีชื่อ)'} · <span className="text-red-700">{p.error}</span></li>)}</ul></section>}

        {sames.length + skips.length > 0 && <details className="card group p-5"><summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium text-muted"><ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
          ไม่เปลี่ยน {sames.length} คน{skips.length ? ` · ข้ามตามที่เลือก ${skips.length} แถว` : ''}</summary>
          <p className="mt-3 text-sm text-muted">{[...sames.map(p => `${p.match!.full_name} (${fmt(p.rating)})`), ...skips.map(p => `ข้าม: ${p.name}`)].join(' · ')}</p></details>}
      </div>)}
    </div>)}
  </Drawer>);
}
