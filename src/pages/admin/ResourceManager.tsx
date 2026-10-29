import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Archive, FileCheck2, History, Languages, Loader2, Pencil, Pin, PinOff, Plus, Save, Search, Trash2, Wand2 } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useToast } from '../../components/common/Toast';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { EmptyState, ErrorState, LoadingState } from '../../components/common/States';
import { translateToEnglish } from '../../lib/translate';
import { invalidate } from '../../lib/query';
import { fmtDateTime } from '../../lib/dates';
import ImagesField from './ImagesField';
import { AdminHeader, Chips, Drawer, Field as FieldBox, Panel, Pills, PubBadge } from './ui';

export type Row = Record<string, unknown> & { id: string };
type Val = string | string[] | boolean;
export type FieldType = 'text' | 'textarea' | 'select' | 'pills' | 'date' | 'url' | 'images' | 'chips' | 'boolean';
export interface FieldDef {
  name: string; label: string; type: FieldType; required?: boolean; options?: { value: string; label: string }[]; bucket?: string; hint?: string;
  /** has an English twin column `<name>_en`, filled by machine translation and editable */ en?: boolean; rows?: number; side?: boolean; placeholder?: string;
}
export interface FilterDef { key: string; label: string; options: { value: string; label: string }[]; test: (row: Row, v: string) => boolean }
export interface ResourceDef {
  table: 'news' | 'events' | 'faqs'; title: string; noun: string; note?: ReactNode;
  fields: FieldDef[]; statusField: 'status' | 'publication_status';
  /** publish-draft: "Save" publishes, "Save draft" keeps it hidden. publish-archive: status chosen in the form (published / archived). */
  statusMode: 'publish-draft' | 'publish-archive';
  revisions?: boolean; pinnable?: boolean; slugPrefix?: string; searchFields: string[]; filters: FilterDef[];
  defaults: Record<string, Val>; validate?: (v: Record<string, Val>) => Record<string, string>;
  rowMeta: (row: Row) => ReactNode; thumb?: boolean;
}
interface Revision { id: string; note: string; note_en: string | null; edited_at: string }

const str = (v: unknown) => (Array.isArray(v) ? v.join('\n') : v == null ? '' : String(v)).trim();
const isEmpty = (v: Val | undefined) => (Array.isArray(v) ? v.length === 0 : typeof v === 'boolean' ? false : !String(v ?? '').trim());
const errMsg = (e: { code?: string; message?: string } | null) => !e ? '' : e.message?.includes('EDIT_NOTE_REQUIRED') ? 'กรุณาระบุว่าแก้ไขอะไร' : e.code === '23505' ? 'ข้อมูลซ้ำ' : e.message ?? '';

export default function ResourceManager({ r, prefill, onCreated, onFormClosed }: { r: ResourceDef; prefill?: Record<string, Val> | null; onCreated?: (id: string) => void; onFormClosed?: () => void }) {
  const toast = useToast();
  const [rows, setRows] = useState<Row[] | null>(null); const [failed, setFailed] = useState(false);
  const [q, setQ] = useState(''); const [filters, setFilters] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<Row | 'new' | null>(null);
  const [vals, setVals] = useState<Record<string, Val>>({}); const [errors, setErrors] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<'th' | 'en'>('th');
  const [thChanged, setThChanged] = useState<Set<string>>(new Set()); const [enTouched, setEnTouched] = useState<Set<string>>(new Set());
  const [note, setNote] = useState(''); const [revs, setRevs] = useState<Revision[]>([]);
  const [saving, setSaving] = useState<string | null>(null); const [uploading, setUploading] = useState(false); const [translating, setTranslating] = useState(false);
  const [toDelete, setToDelete] = useState<Row | null>(null); const [deleting, setDeleting] = useState(false); const [bulk, setBulk] = useState<string | null>(null);
  const enFields = r.fields.filter(f => f.en);
  const close = () => { setEditing(null); onFormClosed?.(); };

  const load = useCallback(async () => {
    const { data, error } = await supabase.from(r.table).select('*').order('created_at', { ascending: false }).limit(500);
    if (error) { setFailed(true); return; }
    setFailed(false); setRows((data ?? []) as Row[]);
  }, [r.table]);
  useEffect(() => { load(); }, [load]);

  const fromRow = (row: Row | null): Record<string, Val> => {
    const v: Record<string, Val> = {};
    for (const f of r.fields) {
      const x = row ? row[f.name] : r.defaults[f.name];
      v[f.name] = f.type === 'images' || f.type === 'chips' ? (Array.isArray(x) ? x as string[] : []) : f.type === 'boolean' ? !!x : f.type === 'date' ? str(x).slice(0, 10) : x == null ? '' : String(x);
      if (f.en) v[`${f.name}_en`] = row ? str(row[`${f.name}_en`]) : '';
    }
    v[r.statusField] = row ? String(row[r.statusField]) : String(r.defaults[r.statusField] ?? (r.statusMode === 'publish-draft' ? 'draft' : 'published'));
    return v;
  };
  const open = (row: Row | null, extra?: Record<string, Val>) => {
    setVals({ ...fromRow(row), ...(extra ?? {}) }); setErrors({}); setTab('th'); setThChanged(new Set(extra ? Object.keys(extra) : [])); setEnTouched(new Set()); setNote(''); setRevs([]);
    setEditing(row ?? 'new');
    if (row && r.revisions && row[r.statusField] === 'published')
      supabase.from('content_revisions').select('id,note,note_en,edited_at').eq('entity', r.table).eq('entity_id', row.id).order('edited_at', { ascending: false }).then(({ data }) => setRevs((data ?? []) as Revision[]));
  };
  useEffect(() => { if (prefill) open(null, prefill); }, [prefill]); // eslint-disable-line react-hooks/exhaustive-deps

  const orig = editing && editing !== 'new' ? editing : null;
  const wasPublished = !!orig && orig[r.statusField] === 'published';
  const set = (name: string, v: Val) => { setVals(s => ({ ...s, [name]: v })); if (name.endsWith('_en')) setEnTouched(s => new Set(s).add(name.slice(0, -3))); else setThChanged(s => new Set(s).add(name)); };
  /** Content fields that changed compared with the saved row (same rule as the database: not pinning, dates of publishing or translations). */
  const contentChanged = useMemo(() => !!orig && r.fields.some(f => f.name !== 'is_pinned' && f.name !== 'published_at' && str(vals[f.name]) !== str(orig[f.name])), [orig, vals, r.fields]);
  const needNote = !!r.revisions && wasPublished && contentChanged;

  async function autoTranslate(names: string[], silent = false) {
    const list = names.filter(n => str(vals[n]));
    if (!list.length) return {} as Record<string, string>;
    setTranslating(true);
    try {
      const out = await translateToEnglish(list.map(n => String(vals[n])));
      const patch = Object.fromEntries(list.map((n, i) => [`${n}_en`, out[i]]));
      setVals(s => ({ ...s, ...patch })); setEnTouched(s => { const x = new Set(s); list.forEach(n => x.delete(n)); return x; });
      if (!silent) toast('ok', 'แปลเป็นภาษาอังกฤษแล้ว ตรวจและแก้คำแปลได้ในแท็บ English');
      return patch;
    } catch {
      toast('info', 'แปลอัตโนมัติไม่สำเร็จ (บริการแปลของ Google ไม่ตอบสนอง) พิมพ์ภาษาอังกฤษเองได้ หรือเว้นว่างไว้ หน้าอังกฤษจะแสดงภาษาไทยแทน');
      return null;
    } finally { setTranslating(false); }
  }

  function validate() {
    const e: Record<string, string> = {};
    for (const f of r.fields) {
      const v = vals[f.name];
      if (f.required && isEmpty(v)) { e[f.name] = f.type === 'chips' ? 'กรุณาเลือกอย่างน้อย 1 รายการ' : f.type === 'images' ? 'กรุณาเพิ่มรูปอย่างน้อย 1 รูป' : 'กรุณากรอกข้อมูลนี้'; continue; }
      if (f.type === 'url' && str(v)) { try { if (!/^https?:$/.test(new URL(str(v)).protocol)) throw 0; } catch { e[f.name] = 'ลิงก์ต้องขึ้นต้นด้วย http:// หรือ https://'; } }
    }
    for (const f of enFields) { const en = str(vals[`${f.name}_en`]); if (en && /[฀-๿]{6,}/.test(en)) e[`${f.name}_en`] = 'ช่องภาษาอังกฤษยังมีข้อความภาษาไทย'; }
    if (needNote && !note.trim()) e.__note = 'กรุณาระบุว่าแก้ไขอะไร (ข้อความนี้จะแสดงต่อผู้อ่าน)';
    return { ...e, ...(r.validate?.(vals) ?? {}) };
  }

  async function save(status: string) {
    if (saving || uploading) return;
    const e = validate(); setErrors(e);
    if (Object.keys(e).length) {
      const keys = Object.keys(e); const enOnly = keys.every(k => k.endsWith('_en')); setTab(enOnly ? 'en' : 'th'); toast('err', 'กรุณาตรวจสอบข้อมูลในแบบฟอร์ม');
      const first = keys.find(k => (enOnly ? k.endsWith('_en') : !k.endsWith('_en'))) ?? keys[0];
      setTimeout(() => { const el = document.getElementById(first === '__note' ? 'f-note' : `f-${first}`); el?.scrollIntoView({ behavior: 'smooth', block: 'center' }); el?.focus({ preventScroll: true }); }, 80);
      return;
    }
    setSaving(status);
    // Machine-translate English fields that are empty, or whose Thai text changed while the English was not edited by hand.
    const toTranslate = enFields.map(f => f.name).filter(n => str(vals[n]) && (!str(vals[`${n}_en`]) || (thChanged.has(n) && !enTouched.has(n))));
    const fieldsPatch = toTranslate.length ? await autoTranslate(toTranslate, true) : {};
    let noteEn: string | null = null;
    if (needNote) { try { noteEn = (await translateToEnglish([note.trim()]))[0] || null; } catch { noteEn = null; } }
    const v = { ...vals, ...(fieldsPatch ?? {}) };
    const p: Record<string, unknown> = {};
    // A field the admin did not change is sent back exactly as stored, so the database never sees a phantom edit
    // (e.g. trailing spaces, or a publish time being rounded to midnight).
    const same = (f: FieldDef, x: Val) => !!orig && (f.type === 'date' ? str(orig[f.name]).slice(0, 10) === str(x) : f.type === 'boolean' ? !!orig[f.name] === !!x
      : f.type === 'images' || f.type === 'chips' ? JSON.stringify(orig[f.name] ?? []) === JSON.stringify(x) : str(orig[f.name]) === str(x));
    for (const f of r.fields) {
      const x = v[f.name];
      if (same(f, x)) p[f.name] = orig![f.name] ?? (f.type === 'images' || f.type === 'chips' ? [] : f.type === 'boolean' ? false : null);
      else if (f.type === 'images' || f.type === 'chips') p[f.name] = x;
      else if (f.type === 'boolean') p[f.name] = !!x;
      else if (f.type === 'textarea') p[f.name] = str(x) ? String(x).replace(/\s+$/, '') : null;
      else p[f.name] = str(x) || null;
      if (f.en) { const en = str(v[`${f.name}_en`]); p[`${f.name}_en`] = orig && en === str(orig[`${f.name}_en`]) ? orig[`${f.name}_en`] ?? null : en || null; }
    }
    p[r.statusField] = status;
    if (needNote) { p.edit_note = note.trim(); p.edit_note_en = noteEn; }
    let res;
    if (orig) res = await supabase.from(r.table).update(p).eq('id', orig.id).select('id');
    else {
      const { data: u } = await supabase.auth.getUser();
      if (r.slugPrefix) p.slug = `${r.slugPrefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      res = await supabase.from(r.table).insert({ ...p, created_by: u.user?.id }).select('id');
    }
    setSaving(null);
    if (res.error) { if (res.error.message?.includes('EDIT_NOTE_REQUIRED')) setErrors(s => ({ ...s, __note: 'กรุณาระบุว่าแก้ไขอะไร' })); toast('err', `บันทึกไม่สำเร็จ: ${errMsg(res.error)}`); return; }
    if (!res.data?.length) { toast('err', 'บันทึกไม่สำเร็จ: ไม่มีสิทธิ์หรือไม่พบข้อมูล'); return; }
    const label = status === 'draft' ? 'บันทึกฉบับร่างแล้ว' : status === 'archived' ? 'บันทึกแบบจัดเก็บแล้ว' : orig ? `บันทึกการแก้ไข${r.noun}แล้ว` : `เผยแพร่${r.noun}แล้ว`;
    toast('ok', label); invalidate('');
    if (!orig) onCreated?.(String(res.data[0].id));
    close(); load();
  }

  async function remove() {
    if (!toDelete || deleting) return; setDeleting(true);
    const { data, error } = await supabase.from(r.table).delete().eq('id', toDelete.id).select('id');
    setDeleting(false);
    if (error || !data?.length) { toast('err', `ลบไม่สำเร็จ${error ? `: ${error.message}` : ''}`); return; }
    toast('ok', `ลบ${r.noun}แล้ว`); setToDelete(null); invalidate(''); load();
  }
  async function togglePin(row: Row) {
    const next = !row.is_pinned;
    const { data, error } = await supabase.from(r.table).update({ is_pinned: next }).eq('id', row.id).select('id');
    if (error || !data?.length) { toast('err', 'เปลี่ยนสถานะปักหมุดไม่สำเร็จ'); return; }
    toast('ok', next ? 'ปักหมุดแล้ว' : 'ยกเลิกการปักหมุดแล้ว'); invalidate(''); load();
  }
  const missingEn = (row: Row) => enFields.some(f => str(row[f.name]) && !str(row[`${f.name}_en`]));
  async function translateMissing() {
    const list = (rows ?? []).filter(missingEn); let ok = 0;
    for (const [i, row] of list.entries()) {
      setBulk(`กำลังแปล ${i + 1}/${list.length}`);
      const names = enFields.map(f => f.name).filter(n => str(row[n]) && !str(row[`${n}_en`]));
      try {
        const out = await translateToEnglish(names.map(n => String(row[n])));
        const { error } = await supabase.from(r.table).update(Object.fromEntries(names.map((n, k) => [`${n}_en`, out[k] || null]))).eq('id', row.id);
        if (!error) ok++;
      } catch { toast('info', 'บริการแปลของ Google ไม่ตอบสนอง หยุดการแปลไว้ก่อน ลองใหม่ภายหลัง'); break; }
    }
    setBulk(null); if (ok) toast('ok', `แปลภาษาอังกฤษแล้ว ${ok} รายการ`); invalidate(''); load();
  }

  const visible = useMemo(() => (rows ?? []).filter(row => r.filters.every(f => !filters[f.key] || f.test(row, filters[f.key]))
    && (!q.trim() || r.searchFields.some(n => str(row[n]).toLowerCase().includes(q.trim().toLowerCase())))), [rows, q, filters, r]);
  const pinnedLive = r.pinnable ? (rows ?? []).filter(x => x.is_pinned && x[r.statusField] === 'published').length : 0;
  const missingCount = (rows ?? []).filter(missingEn).length;

  function control(f: FieldDef, name = f.name) {
    const v = vals[name]; const id = `f-${name}`;
    const on = (e: { target: { value: string } }) => set(name, e.target.value);
    switch (f.type) {
      case 'textarea': return <textarea id={id} rows={f.rows ?? 4} className="input resize-y leading-7" value={String(v ?? '')} onChange={on} placeholder={f.placeholder} />;
      case 'select': return <select id={id} className="input" value={String(v ?? '')} onChange={on}><option value="">{f.required ? '— เลือก —' : '— ไม่ระบุ —'}</option>{f.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>;
      case 'pills': return <Pills id={id} value={String(v ?? '')} onChange={x => set(name, x)} options={f.options ?? []} />;
      case 'chips': return <Chips value={(v as string[]) ?? []} onChange={x => set(name, x)} options={f.options ?? []} />;
      case 'boolean': return <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-white p-3"><input id={id} type="checkbox" className="h-5 w-5 accent-navy" checked={!!v} onChange={e => set(name, e.target.checked)} /><span className="text-sm">{f.hint}</span></label>;
      case 'images': return <ImagesField value={(v as string[]) ?? []} onChange={x => set(name, x)} bucket={f.bucket!} onBusy={setUploading} />;
      default: return <input id={id} type={f.type === 'date' ? 'date' : f.type === 'url' ? 'url' : 'text'} className="input" value={String(v ?? '')} onChange={on} placeholder={f.placeholder} />;
    }
  }
  const box = (f: FieldDef) => <FieldBox key={f.name} htmlFor={`f-${f.name}`} label={f.label} required={f.required} hint={f.type === 'boolean' ? undefined : f.hint} error={errors[f.name]}>{control(f)}</FieldBox>;
  const main = r.fields.filter(f => !f.side), side = r.fields.filter(f => f.side);
  const curStatus = String(vals[r.statusField] ?? '');

  const form = editing && (<Drawer title={editing === 'new' ? `เพิ่ม${r.noun}` : `แก้ไข${r.noun}`} busy={!!saving} onClose={close}
    badge={orig && <PubBadge s={String(orig[r.statusField])} />}
    footer={<>
      {(uploading || translating) && <span className="mr-auto inline-flex items-center gap-2 text-sm text-muted"><Loader2 className="h-4 w-4 animate-spin" />{uploading ? 'กำลังอัปโหลดรูป...' : 'กำลังแปลภาษา...'}</span>}
      <button onClick={close} disabled={!!saving} className="btn-outline btn-sm">ยกเลิก</button>
      {r.statusMode === 'publish-draft' ? <>
        <button onClick={() => save('draft')} disabled={!!saving || uploading} className="btn-outline btn-sm">{saving === 'draft' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Archive className="h-4 w-4" />}บันทึกฉบับร่าง</button>
        <button onClick={() => save('published')} disabled={!!saving || uploading} className="btn-primary btn-sm">{saving === 'published' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCheck2 className="h-4 w-4" />}{wasPublished ? 'บันทึก' : 'บันทึกและเผยแพร่'}</button></>
        : <button onClick={() => save(curStatus || 'published')} disabled={!!saving || uploading} className="btn-primary btn-sm">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}บันทึก</button>}</>}>
    {enFields.length > 0 && <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div role="tablist" className="inline-flex rounded-full border border-line bg-white p-1 shadow-sm">{(['th', 'en'] as const).map(k => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
        className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${tab === k ? 'bg-navy text-white shadow' : 'text-ink/70 hover:text-navy'}`}>{k === 'th' ? 'ภาษาไทย' : 'English'}
        {k === 'en' && enFields.some(f => errors[`${f.name}_en`]) && <span className="ml-1.5 inline-block h-2 w-2 rounded-full bg-red-500" />}</button>)}</div>
      {tab === 'en' && <button type="button" onClick={() => autoTranslate(enFields.map(f => f.name))} disabled={translating} className="btn-outline btn-sm">{translating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}แปลใหม่ทั้งหมดจากภาษาไทย</button>}</div>}
    {tab === 'th' ? (<div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Panel>{main.map(box)}</Panel>
      <div className="space-y-5">{side.length > 0 && <Panel>{side.map(box)}</Panel>}
        {r.statusMode === 'publish-archive' && <Panel title="สถานะ"><Pills value={curStatus} onChange={x => setVals(s => ({ ...s, [r.statusField]: x }))} options={[{ value: 'published', label: 'เผยแพร่' }, { value: 'archived', label: 'จัดเก็บ' }]} />
          <p className="text-xs text-muted">"จัดเก็บ" = ไม่แสดงบนเว็บไซต์ แต่ยังเก็บข้อมูลไว้</p></Panel>}
        {r.statusMode === 'publish-draft' && <Panel title="การเผยแพร่"><p className="text-sm text-muted">กด <b>บันทึกและเผยแพร่</b> เพื่อแสดงบนเว็บไซต์ หรือ <b>บันทึกฉบับร่าง</b> เพื่อเก็บไว้ก่อน (ไม่แสดง)</p>
          {wasPublished && <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900">รายการนี้เผยแพร่อยู่ การกด "บันทึกฉบับร่าง" จะซ่อนรายการจากเว็บไซต์</p>}</Panel>}</div></div>
    ) : (<Panel>
      <p className="flex items-start gap-2 rounded-xl bg-blue-light p-3 text-sm text-navy-dark"><Languages className="mt-0.5 h-4 w-4 shrink-0" />ระบบแปลภาษาอังกฤษให้อัตโนมัติตอนบันทึก (ถ้าช่องว่าง หรือภาษาไทยถูกแก้ไข) แก้คำแปลที่ไม่ตรงได้เลย ระบบจะไม่เขียนทับข้อความที่คุณแก้เอง</p>
      {enFields.map(f => (<div key={f.name} className="rounded-2xl border border-line p-4"><FieldBox htmlFor={`f-${f.name}_en`} label={`${f.label} (English)`} error={errors[`${f.name}_en`]}>
        <p className="mb-2 line-clamp-3 rounded-lg bg-gray-light px-3 py-2 text-xs text-muted">ไทย: {str(vals[f.name]) || '—'}</p>{control(f, `${f.name}_en`)}</FieldBox>
        <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted"><span>{enTouched.has(f.name) ? '✎ แก้ไขด้วยตนเอง' : thChanged.has(f.name) && str(vals[`${f.name}_en`]) ? '⟳ จะแปลใหม่ตอนบันทึก' : ''}</span>
          <button type="button" disabled={translating || !str(vals[f.name])} onClick={() => autoTranslate([f.name])} className="inline-flex items-center gap-1 rounded-full px-2 py-1 font-medium text-navy hover:bg-blue-light disabled:opacity-40"><Wand2 className="h-3.5 w-3.5" />แปลช่องนี้</button></div></div>))}
    </Panel>)}
    {r.revisions && wasPublished && <Panel className="mt-5 border-amber-200" title={<span className="flex items-center gap-2 normal-case tracking-normal text-amber-900"><History className="h-4 w-4" />บันทึกการแก้ไข (แสดงต่อผู้อ่าน)</span>}>
      <FieldBox htmlFor="f-note" label="แก้ไขอะไรในครั้งนี้" required={needNote} error={errors.__note} hint={needNote ? 'ระบบจะแปลเป็นภาษาอังกฤษให้อัตโนมัติ' : 'ยังไม่มีการแก้ไขเนื้อหา (ปักหมุด/เปลี่ยนสถานะ/แก้คำแปล ไม่ต้องใส่)'}>
        <textarea id="f-note" rows={2} className="input" value={note} onChange={e => setNote(e.target.value)} placeholder="เช่น แก้ไขวันที่รับสมัคร, เพิ่มรูปภาพบรรยากาศ" /></FieldBox>
      {revs.length > 0 && <ol className="space-y-2 border-l-2 border-amber-200 pl-4 text-sm">{revs.map(x => <li key={x.id}><span className="text-xs text-muted">{fmtDateTime(x.edited_at, 'th')}</span><p>{x.note}</p></li>)}</ol>}</Panel>}
  </Drawer>);

  return (<div className="mx-auto max-w-6xl">
    <AdminHeader title={r.title} sub={rows ? `ทั้งหมด ${rows.length} รายการ` : undefined} action={<button onClick={() => open(null)} className="btn-primary"><Plus className="h-4 w-4" />เพิ่ม{r.noun}</button>} />
    {r.note && <div className="mb-4 rounded-2xl bg-blue-light p-4 text-sm text-navy-dark">{r.note}</div>}
    {r.pinnable && <p className={`mb-4 rounded-2xl p-3 text-sm ${pinnedLive > 5 ? 'bg-amber-100 text-amber-900' : 'bg-white text-muted ring-1 ring-line'}`}><Pin className="mr-1 inline h-4 w-4" />หน้าแรกแสดง 5 รายการ (รายการที่ปักหมุดขึ้นก่อน) · ปักหมุดที่เผยแพร่อยู่ {pinnedLive} รายการ{pinnedLive > 5 ? ' (เกิน 6 รายการ: หน้าแรกแสดงเฉพาะ 6 รายการที่ปักหมุดล่าสุด)' : ''}</p>}
    <div className="card mb-4 flex flex-col gap-3 p-3 lg:flex-row lg:items-center">
      <label className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" /><input aria-label="ค้นหา" placeholder="ค้นหา..." value={q} onChange={e => setQ(e.target.value)} className="input pl-10" /></label>
      {r.filters.map(f => (<select key={f.key} aria-label={f.label} value={filters[f.key] ?? ''} onChange={e => setFilters(s => ({ ...s, [f.key]: e.target.value }))} className="input lg:w-auto">
        <option value="">{f.label}: ทั้งหมด</option>{f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>))}
      {enFields.length > 0 && missingCount > 0 && <button onClick={translateMissing} disabled={!!bulk} className="btn-outline btn-sm shrink-0">{bulk ? <Loader2 className="h-4 w-4 animate-spin" /> : <Languages className="h-4 w-4" />}{bulk ?? `แปลอังกฤษที่ยังขาด (${missingCount})`}</button>}</div>
    {failed ? <ErrorState onRetry={load} /> : rows === null ? <LoadingState text="กำลังโหลด..." /> : visible.length === 0 ? <EmptyState text={`ไม่พบ${r.noun}`} /> :
      <ul className="stagger space-y-2">{visible.map((row, i) => { const img = Array.isArray(row.images) ? (row.images as string[])[0] : undefined; return (
        <li key={row.id} style={{ ['--i' as string]: i }} className={`card flex items-center gap-3 p-3 transition hover:shadow-lift ${row.is_pinned ? 'border-gold/70 bg-amber-50/40' : ''}`}>
          {r.thumb && <button onClick={() => open(row)} className="h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-navy to-navy-deep">{img && <img src={img} alt="" loading="lazy" className="h-full w-full object-cover" />}</button>}
          <button onClick={() => open(row)} className="min-w-0 flex-1 text-left">
            <p className="flex flex-wrap items-center gap-2">{!!row.is_pinned && <span className="chip bg-gold text-navy-deep"><Pin className="h-3 w-3" />ปักหมุด</span>}<PubBadge s={String(row[r.statusField])} />
              {enFields.length > 0 && missingEn(row) && <span className="chip bg-slate-100 text-slate-500" title="ยังไม่มีคำแปลภาษาอังกฤษ">ยังไม่มี EN</span>}</p>
            <p className="mt-1 line-clamp-2 font-medium text-navy-dark">{str(row[r.searchFields[0]])}</p><div className="mt-0.5 text-xs text-muted">{r.rowMeta(row)}</div></button>
          <div className="flex shrink-0 items-center">
            {r.pinnable && <button aria-label={row.is_pinned ? 'ยกเลิกปักหมุด' : 'ปักหมุด'} title={row.is_pinned ? 'ยกเลิกปักหมุด' : 'ปักหมุด'} onClick={() => togglePin(row)} className={`grid h-9 w-9 place-items-center rounded-full hover:bg-gray-light ${row.is_pinned ? 'text-gold-dark' : 'text-muted'}`}>{row.is_pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}</button>}
            <button aria-label="แก้ไข" title="แก้ไข" onClick={() => open(row)} className="grid h-9 w-9 place-items-center rounded-full text-navy hover:bg-gray-light"><Pencil className="h-4 w-4" /></button>
            <button aria-label="ลบ" title="ลบ" onClick={() => setToDelete(row)} className="grid h-9 w-9 place-items-center rounded-full text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button></div></li>); })}</ul>}
    {rows && rows.length >= 500 && <p className="mt-3 text-sm text-muted">แสดงสูงสุด 500 รายการล่าสุด</p>}
    {form}
    <ConfirmDialog open={!!toDelete} title={`ลบ${r.noun}`} message={`ต้องการลบ${r.noun}นี้หรือไม่? การลบไม่สามารถย้อนกลับได้`} busy={deleting} onConfirm={remove} onCancel={() => setToDelete(null)} />
  </div>);
}
