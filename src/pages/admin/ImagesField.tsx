import { useRef, useState } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight, ImagePlus, Loader2, Star, Trash2, UploadCloud } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { compressImage, extFor, IMG_TYPES, MAX_UPLOAD_BYTES } from '../../lib/images';

type Pending = { id: string; name: string; preview: string; state: 'working' | 'error'; msg?: string };

/** Upload one or many images. Images are resized in the browser, then uploaded. Drag to reorder; the first image is the cover. */
export default function ImagesField({ value, onChange, bucket, max = 20, single = false, maxSide = 2000, onBusy }:
  { value: string[]; onChange: (v: string[]) => void; bucket: string; max?: number; single?: boolean; maxSide?: number; onBusy?: (b: boolean) => void }) {
  const [pending, setPending] = useState<Pending[]>([]);
  const [over, setOver] = useState(false); const [drag, setDrag] = useState<number | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const latest = useRef(value); latest.current = value;
  const limit = single ? 1 : max;

  async function addFiles(list: FileList | File[]) {
    const files = Array.from(list).filter(f => f.type.startsWith('image/'));
    const room = single ? 1 : Math.max(0, limit - latest.current.length);
    const take = files.slice(0, room || (single ? 1 : 0));
    if (!take.length) return;
    onBusy?.(true);
    const jobs = take.map(f => ({ file: f, p: { id: crypto.randomUUID(), name: f.name, preview: URL.createObjectURL(f), state: 'working' as const } }));
    setPending(s => [...s, ...jobs.map(j => j.p)]);
    const uploaded: string[] = [];
    for (const { file, p } of jobs) {
      try {
        if (!IMG_TYPES.includes(file.type)) throw new Error('รองรับเฉพาะ JPEG, PNG และ WebP');
        const blob = await compressImage(file, maxSide);
        if (blob.size > MAX_UPLOAD_BYTES) throw new Error('ไฟล์ใหญ่เกิน 5 MB หลังย่อขนาด');
        const path = `${new Date().getFullYear()}/${crypto.randomUUID()}.${extFor(blob.type)}`;
        const { error } = await supabase.storage.from(bucket).upload(path, blob, { contentType: blob.type, cacheControl: '31536000' });
        if (error) throw new Error(error.message);
        uploaded.push(supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl);
        setPending(s => s.filter(x => x.id !== p.id)); URL.revokeObjectURL(p.preview);
        onChange(single ? uploaded.slice(-1) : [...latest.current, uploaded[uploaded.length - 1]]);
      } catch (e) {
        setPending(s => s.map(x => (x.id === p.id ? { ...x, state: 'error', msg: (e as Error).message } : x)));
      }
    }
    onBusy?.(false);
  }
  const move = (from: number, to: number) => { if (to < 0 || to >= value.length || from === to) return; const v = [...value]; const [x] = v.splice(from, 1); v.splice(to, 0, x); onChange(v); };
  const remove = (i: number) => onChange(value.filter((_, k) => k !== i));
  const canAdd = single || value.length < limit;

  return (<div className="space-y-3">
    {(value.length > 0 || pending.length > 0) && <ul className={`grid gap-3 ${single ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3'}`}>
      {value.map((src, i) => (<li key={src} draggable={!single} onDragStart={() => setDrag(i)} onDragEnd={() => setDrag(null)}
        onDragOver={e => { if (drag !== null) e.preventDefault(); }} onDrop={e => { e.preventDefault(); if (drag !== null) move(drag, i); setDrag(null); }}
        className={`group relative aspect-[4/3] animate-scale-in overflow-hidden rounded-xl bg-slate-100 ring-1 ring-line transition ${drag === i ? 'opacity-40' : ''} ${!single ? 'cursor-grab active:cursor-grabbing' : ''}`}>
        <img src={src} alt={`รูปที่ ${i + 1}`} className="h-full w-full object-cover" />
        {!single && i === 0 && <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-gold px-2 py-0.5 text-[11px] font-semibold text-navy-deep shadow"><Star className="h-3 w-3" />ภาพปก</span>}
        {!single && <span className="absolute right-2 top-2 rounded-full bg-black/55 px-2 text-[11px] text-white">{i + 1}</span>}
        <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
          {!single ? <span className="flex gap-1"><button type="button" aria-label="เลื่อนไปก่อนหน้า" disabled={i === 0} onClick={() => move(i, i - 1)} className="grid h-7 w-7 place-items-center rounded-full bg-white/90 text-navy disabled:opacity-40"><ArrowLeft className="h-4 w-4" /></button>
            <button type="button" aria-label="เลื่อนไปถัดไป" disabled={i === value.length - 1} onClick={() => move(i, i + 1)} className="grid h-7 w-7 place-items-center rounded-full bg-white/90 text-navy disabled:opacity-40"><ArrowRight className="h-4 w-4" /></button></span> : <span />}
          <button type="button" aria-label="ลบรูปนี้" onClick={() => remove(i)} className="grid h-7 w-7 place-items-center rounded-full bg-red-600 text-white"><Trash2 className="h-4 w-4" /></button></div></li>))}
      {pending.map(p => (<li key={p.id} className="relative aspect-[4/3] overflow-hidden rounded-xl ring-1 ring-line">
        <img src={p.preview} alt="" className={`h-full w-full object-cover ${p.state === 'working' ? 'opacity-50 blur-[1px]' : 'opacity-30'}`} />
        <div className="absolute inset-0 grid place-items-center p-2 text-center text-xs">{p.state === 'working' ? <span className="flex flex-col items-center gap-1 text-navy-dark"><Loader2 className="h-6 w-6 animate-spin" />กำลังย่อและอัปโหลด...</span>
          : <span className="flex flex-col items-center gap-1 text-red-700"><AlertCircle className="h-5 w-5" />{p.msg}<button type="button" className="underline" onClick={() => setPending(s => s.filter(x => x.id !== p.id))}>ปิด</button></span>}</div></li>))}
    </ul>}
    {canAdd && <div onDragOver={e => { if (e.dataTransfer.types.includes('Files')) { e.preventDefault(); setOver(true); } }} onDragLeave={() => setOver(false)}
      onDrop={e => { if (e.dataTransfer.files.length) { e.preventDefault(); setOver(false); addFiles(e.dataTransfer.files); } }}
      className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-6 text-center transition ${over ? 'scale-[1.01] border-gold bg-gold/10' : 'border-slate-300 bg-gray-light/60 hover:border-navy/40'}`}>
      {value.length ? <ImagePlus className="h-7 w-7 text-navy/60" /> : <UploadCloud className="h-8 w-8 text-navy/60" />}
      <p className="text-sm text-ink">ลากรูปมาวางที่นี่ หรือ <button type="button" onClick={() => input.current?.click()} className="font-semibold text-navy underline">เลือกไฟล์</button></p>
      <p className="text-xs text-muted">{single ? 'JPEG, PNG, WebP · ระบบย่อรูปให้อัตโนมัติ' : `เลือกได้หลายรูป (สูงสุด ${limit} รูป) · รูปแรกคือภาพปก · ลากเพื่อสลับลำดับ`}</p>
      <input ref={input} type="file" accept={IMG_TYPES.join(',')} multiple={!single} className="hidden" onChange={e => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }} /></div>}
  </div>);
}
