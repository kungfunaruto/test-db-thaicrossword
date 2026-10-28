import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Pencil, Pin, PinOff, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../../services/supabase';
import type { Field, Option, Resource } from '../../config/adminResources';
import { useToast } from '../../components/common/Toast';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { EmptyState, ErrorState, LoadingState } from '../../components/common/States';

type Row = Record<string, unknown>;
const MAX_BYTES = 5 * 1024 * 1024;
const IMG_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const cls = 'mt-1 w-full rounded border border-slate-300 p-2';
const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const thDate = (s: string) => new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeZone: s.length === 10 ? 'UTC' : undefined }).format(new Date(s));

export default function ResourceManager({ resource: r }: { resource: Resource }) {
  const toast = useToast();
  const [sp, setSp] = useSearchParams();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [q, setQ] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<Row | 'new' | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toDelete, setToDelete] = useState<Row | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [relOpts, setRelOpts] = useState<Record<string, Option[]>>({});

  const load = useCallback(async () => {
    const { data, error } = await supabase.from(r.table).select('*').order(r.orderBy, { ascending: false }).limit(500);
    if (error) { setFailed(true); return; }
    setFailed(false); setRows((data ?? []) as Row[]);
  }, [r]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    r.fields.filter(f => f.relation).forEach(async f => {
      const rel = f.relation!;
      const { data } = await supabase.from(rel.table).select(`id, ${rel.label}`).order(rel.label);
      const list = ((data ?? []) as unknown as Row[]).map(x => ({ value: String(x.id), label: String(x[rel.label]) }));
      setRelOpts(s => ({ ...s, [f.name]: list }));
    });
  }, [r]);

  const blank = () => Object.fromEntries(r.fields.map(f => [f.name, r.defaults[f.name] ?? (f.type === 'boolean' ? 'true' : '')]));
  const fromRow = (row: Row) => Object.fromEntries(r.fields.map(f => {
    const v = row[f.name];
    if (v == null) return [f.name, ''];
    return [f.name, f.type === 'date' ? String(v).slice(0, 10) : String(v)];
  }));
  const openNew = () => { setForm(blank()); setErrors({}); setEditing('new'); };
  const openEdit = (row: Row) => { setForm(fromRow(row)); setErrors({}); setEditing(row); };
  useEffect(() => { if (sp.get('new')) { openNew(); setSp({}, { replace: true }); } }, []); // eslint-disable-line
  const set = (n: string, v: string) => setForm(s => ({ ...s, [n]: v }));
  const makeSlug = (f: Field) => slugify(form[f.slugFrom ?? 'title'] ?? '') || `${r.slugPrefix ?? 'item'}-${Date.now().toString(36)}`;

  function validate() {
    const e: Record<string, string> = {};
    for (const f of r.fields) {
      const v = (form[f.name] ?? '').trim();
      if (f.required && !v) { e[f.name] = 'กรุณากรอกข้อมูลนี้'; continue; }
      if (!v) continue;
      if (f.type === 'url') { try { if (!/^https?:$/.test(new URL(v).protocol)) throw 0; } catch { e[f.name] = 'ลิงก์ต้องขึ้นต้นด้วย http:// หรือ https://'; } }
      if (f.type === 'number' && Number.isNaN(Number(v))) e[f.name] = 'ต้องเป็นตัวเลข';
    }
    return { ...e, ...(r.validate?.(form) ?? {}) };
  }
  function payload() {
    const p: Record<string, unknown> = {};
    for (const f of r.fields) {
      const v = (form[f.name] ?? '').trim();
      if (f.type === 'boolean') p[f.name] = form[f.name] === 'true';
      else if (f.type === 'slug') p[f.name] = slugify(v) || makeSlug(f);
      else if (f.type === 'number') p[f.name] = v === '' ? null : Number(v);
      else p[f.name] = v === '' ? null : (f.type === 'textarea' ? form[f.name] : v);
    }
    return r.beforeSave ? r.beforeSave(p) : p;
  }
  async function save() {
    if (saving || uploading) return;
    const e = validate(); setErrors(e);
    if (Object.keys(e).length) { toast('err', 'กรุณาตรวจสอบข้อมูลในแบบฟอร์ม'); return; }
    setSaving(true);
    const p = payload();
    const id = editing && editing !== 'new' ? String(editing.id) : null;
    let res;
    if (id) res = await supabase.from(r.table).update(p).eq('id', id).select('id');
    else {
      const { data: u } = await supabase.auth.getUser();
      res = await supabase.from(r.table).insert({ ...p, created_by: u.user?.id }).select('id');
    }
    setSaving(false);
    if (res.error) { toast('err', res.error.code === '23505' ? 'บันทึกไม่สำเร็จ: ข้อมูลซ้ำ (เช่น slug หรือรหัสซ้ำ)' : `บันทึกไม่สำเร็จ: ${res.error.message}`); return; }
    if (!res.data?.length) { toast('err', 'บันทึกไม่สำเร็จ: ไม่มีสิทธิ์หรือไม่พบข้อมูล'); return; }
    toast('ok', id ? `แก้ไข${r.noun}เรียบร้อยแล้ว` : `เพิ่ม${r.noun}เรียบร้อยแล้ว`);
    setEditing(null); load();
  }
  async function remove() {
    if (!toDelete || deleting) return;
    setDeleting(true);
    const { data, error } = await supabase.from(r.table).delete().eq('id', String(toDelete.id)).select('id');
    setDeleting(false);
    if (error || !data?.length) { toast('err', `ลบไม่สำเร็จ${error ? `: ${error.message}` : ': ไม่มีสิทธิ์หรือไม่พบข้อมูล'}`); return; }
    toast('ok', `ลบ${r.noun}เรียบร้อยแล้ว`); setToDelete(null); load();
  }
  async function togglePin(row: Row) {
    const next = !row.is_pinned;
    const { data, error } = await supabase.from(r.table).update({ is_pinned: next }).eq('id', String(row.id)).select('id');
    if (error || !data?.length) { toast('err', 'เปลี่ยนสถานะปักหมุดไม่สำเร็จ'); return; }
    toast('ok', next ? 'ปักหมุดเรียบร้อยแล้ว' : 'ยกเลิกการปักหมุดแล้ว'); load();
  }
  const pinnedLive = r.pinnable ? (rows ?? []).filter(x => x.is_pinned && x[r.pinnable!.statusField] === 'published').length : 0;
  async function upload(f: Field, file: File) {
    if (!IMG_TYPES.includes(file.type)) { toast('err', 'รองรับเฉพาะไฟล์ JPEG, PNG และ WebP'); return; }
    if (file.size > MAX_BYTES) { toast('err', 'ไฟล์ต้องมีขนาดไม่เกิน 5 MB'); return; }
    setUploading(true);
    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from(f.bucket!).upload(path, file, { contentType: file.type });
    setUploading(false);
    if (error) { toast('err', `อัปโหลดรูปไม่สำเร็จ: ${error.message}`); return; }
    set(f.name, supabase.storage.from(f.bucket!).getPublicUrl(path).data.publicUrl);
  }

  const show = (name: string, v: unknown) => {
    if (v == null || v === '') return '—';
    const f = r.fields.find(x => x.name === name);
    if (f?.options) return f.options.find(x => x.value === String(v))?.label ?? String(v);
    if (f?.type === 'boolean') return v ? 'ใช่' : 'ไม่';
    if (f?.type === 'date') return thDate(String(v));
    return String(v);
  };
  const visible = useMemo(() => (rows ?? []).filter(row =>
    r.filterFields.every(n => !filters[n] || String(row[n]) === filters[n]) &&
    (!q.trim() || r.searchFields.some(n => String(row[n] ?? '').toLowerCase().includes(q.trim().toLowerCase())))), [rows, q, filters, r]);

  function control(f: Field) {
    const v = form[f.name] ?? '';
    const c = { id: `f-${f.name}`, 'aria-invalid': !!errors[f.name] };
    const on = (e: { target: { value: string } }) => set(f.name, e.target.value);
    switch (f.type) {
      case 'textarea': return <textarea {...c} rows={f.name === 'content' ? 10 : 4} className={cls} value={v} onChange={on} />;
      case 'select': case 'relation': {
        const opts = f.type === 'select' ? f.options ?? [] : relOpts[f.name] ?? [];
        return <select {...c} className={cls} value={v} onChange={on}><option value="">{f.required ? '— เลือก —' : '— ไม่ระบุ —'}</option>
          {opts.map(x => <option key={x.value} value={x.value}>{x.label}</option>)}</select>;
      }
      case 'boolean': return <input {...c} type="checkbox" className="ml-2 h-4 w-4" checked={v === 'true'} onChange={e => set(f.name, String(e.target.checked))} />;
      case 'image': return (<div className="mt-1 space-y-2">
        {v && <img src={v} alt="ตัวอย่างรูปภาพ" className="max-h-40 rounded" />}
        <input {...c} type="file" accept={IMG_TYPES.join(',')} disabled={uploading} onChange={e => { const file = e.target.files?.[0]; if (file) upload(f, file); e.target.value = ''; }} />
        {uploading && <p className="text-sm text-muted">กำลังอัปโหลด...</p>}
        {v && <button type="button" className="text-sm underline" onClick={() => set(f.name, '')}>ลบรูปออกจากฟอร์ม</button>}</div>);
      case 'slug': return (<div className="flex gap-2"><input {...c} className={cls} value={v} onChange={on} />
        <button type="button" onClick={() => set(f.name, makeSlug(f))} className="mt-1 shrink-0 rounded border border-slate-300 px-3 text-sm">สร้างอัตโนมัติ</button></div>);
      default: return <input {...c} type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'} step="any" className={cls} value={v} onChange={on} />;
    }
  }

  return (<div className="mx-auto max-w-6xl space-y-4">
    <div className="flex items-center justify-between gap-2"><h1 className="text-2xl">{r.title}</h1>
      <button onClick={openNew} className="flex items-center gap-1 rounded bg-navy px-4 py-2 text-white"><Plus className="h-4 w-4" />เพิ่ม{r.noun}</button></div>
    {r.note && <p className="rounded bg-blue-light p-3 text-sm">{r.note}</p>}
    {r.pinnable && <p className={`rounded p-3 text-sm ${pinnedLive > 5 ? 'bg-amber-100 text-amber-900' : 'bg-blue-light'}`}>หน้าแรกแสดงสูงสุด 5 รายการ รวมรายการที่ปักหมุด · ปักหมุดที่เผยแพร่แล้ว {pinnedLive} รายการ{pinnedLive > 5 ? ' (เกิน 5 รายการ: หน้าแรกจะแสดงเฉพาะ 5 รายการที่ปักหมุดล่าสุด)' : ''}</p>}
    <div className="flex flex-wrap gap-2">
      <input aria-label="ค้นหา" placeholder="ค้นหา..." value={q} onChange={e => setQ(e.target.value)} className="rounded border border-slate-300 p-2" />
      {r.filterFields.map(n => { const f = r.fields.find(x => x.name === n)!; return (
        <select key={n} aria-label={f.label} value={filters[n] ?? ''} onChange={e => setFilters(s => ({ ...s, [n]: e.target.value }))} className="rounded border border-slate-300 p-2">
          <option value="">{f.label}: ทั้งหมด</option>{f.options?.map(x => <option key={x.value} value={x.value}>{x.label}</option>)}</select>); })}
    </div>
    {failed ? <ErrorState /> : rows === null ? <LoadingState /> : visible.length === 0 ? <EmptyState text={`ไม่พบ${r.noun}`} /> :
      <div className="overflow-x-auto rounded border border-slate-200 bg-white"><table className="w-full text-left text-sm">
        <thead className="bg-blue-light"><tr>{r.columns.map(n => <th key={n} className="whitespace-nowrap p-3">{r.fields.find(f => f.name === n)?.label}</th>)}<th className="p-3"><span className="sr-only">จัดการ</span></th></tr></thead>
        <tbody>{visible.map(row => <tr key={String(row.id)} className={`border-t border-slate-100 ${row.is_pinned ? 'bg-amber-50' : ''}`}>
          {r.columns.map((n, i) => <td key={n} className="p-3">{i === 0 && !!row.is_pinned && <span className="mr-2 inline-flex items-center gap-1 whitespace-nowrap rounded bg-gold/30 px-1.5 py-0.5 text-xs font-medium text-navy-dark"><Pin className="h-3 w-3" />ปักหมุด</span>}{show(n, row[n])}</td>)}
          <td className="whitespace-nowrap p-3 text-right">
            {r.pinnable && <button aria-label={row.is_pinned ? 'ยกเลิกปักหมุด' : 'ปักหมุด'} title={row.is_pinned ? 'ยกเลิกปักหมุด' : 'ปักหมุด'} onClick={() => togglePin(row)} className={`p-2 ${row.is_pinned ? 'text-gold' : ''}`}>{row.is_pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}</button>}
            <button aria-label="แก้ไข" onClick={() => openEdit(row)} className="p-2"><Pencil className="h-4 w-4" /></button>
            <button aria-label="ลบ" onClick={() => setToDelete(row)} className="p-2 text-red-700"><Trash2 className="h-4 w-4" /></button></td></tr>)}</tbody></table></div>}
    {rows && rows.length >= 500 && <p className="text-sm text-muted">แสดงสูงสุด 500 รายการล่าสุด</p>}
    {editing && (<div className="fixed inset-0 z-40 grid place-items-center bg-black/50 p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="rm-title" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded bg-white p-6">
        <h2 id="rm-title" className="mb-4 text-xl">{editing === 'new' ? `เพิ่ม${r.noun}` : `แก้ไข${r.noun}`}</h2>
        <div className="space-y-4">{r.fields.map(f => (<div key={f.name}>
          <label htmlFor={`f-${f.name}`} className="text-sm font-medium">{f.label}{f.required && <span className="text-red-600"> *</span>}</label>
          {control(f)}{f.hint && <p className="text-xs text-muted">{f.hint}</p>}
          {errors[f.name] && <p role="alert" className="text-sm text-red-700">{errors[f.name]}</p>}</div>))}</div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={() => setEditing(null)} disabled={saving} className="rounded border border-slate-300 px-4 py-2">ยกเลิก</button>
          <button onClick={save} disabled={saving || uploading} className="rounded bg-navy px-4 py-2 text-white disabled:opacity-60">{saving ? 'กำลังบันทึก...' : 'บันทึก'}</button></div>
      </div></div>)}
    <ConfirmDialog open={!!toDelete} title={`ลบ${r.noun}`} message={`ต้องการลบ${r.noun}นี้หรือไม่? การลบไม่สามารถย้อนกลับได้`} busy={deleting} onConfirm={remove} onCancel={() => setToDelete(null)} />
  </div>);
}
