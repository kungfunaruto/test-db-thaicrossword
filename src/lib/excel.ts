// Excel (.xlsx) download / upload for athletes and ratings. exceljs is loaded only when an admin uses these buttons.
// The same file is the template, the export and the import: download it, edit it in Excel, upload it back.
import type * as ExcelNS from 'exceljs';

export const RATED = ['crossword', 'a_math'] as const;
export type Rated = typeof RATED[number];
export interface AthleteLite { id: string; full_name: string; full_name_en: string | null; publication_status: 'published' | 'archived' }
export const HEADERS = { id: 'รหัสนักกีฬา (ห้ามแก้ไข / เว้นว่างสำหรับคนใหม่)', full_name: 'ชื่อ-นามสกุล (ไทย)', full_name_en: 'ชื่อ-นามสกุล (อังกฤษ)',
  crossword: 'เรตติ้งครอสเวิร์ด', a_math: 'เรตติ้งเอแม็ท', status: 'สถานะ (เผยแพร่ / จัดเก็บ)' } as const;
const ORDER = ['id', 'full_name', 'full_name_en', 'crossword', 'a_math', 'status'] as const;
const STATUS_TH = { published: 'เผยแพร่', archived: 'จัดเก็บ' } as const;

// The browser build of exceljs is a CommonJS bundle: depending on the bundler the API is on `default` or on the module itself.
const load = async () => { const m = await import('exceljs'); return ((m as unknown as { default?: typeof ExcelNS }).default ?? m) as typeof ExcelNS; };
const save = (blob: Blob, name: string) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); };
const todayStr = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

/** Builds and downloads the workbook. `athletes` empty = blank template. */
export async function downloadAthletesWorkbook(athletes: AthleteLite[], cur: (id: string, g: Rated) => number | undefined, blank = false) {
  const ExcelJS = await load();
  const wb = new ExcelJS.Workbook(); wb.creator = 'TCA Admin'; wb.created = new Date();
  const ws = wb.addWorksheet('นักกีฬา', { views: [{ state: 'frozen', ySplit: 1 }], properties: { defaultRowHeight: 20 } });
  ws.columns = ORDER.map(k => ({ header: HEADERS[k], key: k, width: k === 'id' ? 40 : k.startsWith('full') ? 32 : 18 }));
  const list = blank ? [] : [...athletes].sort((a, b) => a.full_name.localeCompare(b.full_name, 'th'));
  for (const a of list) ws.addRow({ id: a.id, full_name: a.full_name, full_name_en: a.full_name_en ?? '', crossword: cur(a.id, 'crossword') ?? null, a_math: cur(a.id, 'a_math') ?? null, status: STATUS_TH[a.publication_status] });
  const header = ws.getRow(1); header.height = 34;
  header.eachCell(c => { c.font = { bold: true, color: { argb: 'FFFFFFFF' } }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F2A47' } }; c.alignment = { vertical: 'middle', wrapText: true }; });
  ws.autoFilter = { from: 'A1', to: 'F1' };
  const last = Math.max(list.length + 1, 2) + 500; // room to add new athletes below
  for (let r = 2; r <= last; r++) {
    const row = ws.getRow(r);
    row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F4F8' } }; row.getCell(1).font = { color: { argb: 'FF5F6B7A' }, size: 9 };
    for (const c of [4, 5]) { row.getCell(c).numFmt = '#,##0.##'; row.getCell(c).dataValidation = { type: 'decimal', operator: 'greaterThanOrEqual', formulae: [0], allowBlank: true, showErrorMessage: true, errorTitle: 'เรตติ้งไม่ถูกต้อง', error: 'กรุณาใส่ตัวเลขที่ไม่ติดลบ หรือเว้นว่าง' }; }
    row.getCell(6).dataValidation = { type: 'list', allowBlank: true, formulae: ['"เผยแพร่,จัดเก็บ"'], showErrorMessage: true, errorTitle: 'สถานะไม่ถูกต้อง', error: 'เลือก เผยแพร่ หรือ จัดเก็บ' };
  }
  const help = wb.addWorksheet('วิธีใช้'); help.getColumn(1).width = 110;
  ['วิธีใช้ไฟล์นี้ (นำเข้า / แก้ไขนักกีฬาและเรตติ้ง)', '',
    '1) แก้ไขในแผ่นงาน "นักกีฬา" แล้วบันทึกเป็น .xlsx จากนั้นกด "นำเข้า Excel" ในหน้า นักกีฬาและอันดับ',
    '2) คอลัมน์ "รหัสนักกีฬา" ใช้จับคู่กับข้อมูลในระบบ ห้ามแก้ไข · นักกีฬาคนใหม่ให้เว้นว่างไว้ แล้วกรอกชื่อไทยและอังกฤษให้ครบ',
    '3) ถ้าไม่มีรหัส ระบบจะจับคู่ด้วยชื่อภาษาไทยที่ตรงกันทุกตัวอักษร (ถ้ามีชื่อซ้ำกันในระบบ ต้องใส่รหัส)',
    '4) ช่องว่าง = ไม่เปลี่ยนแปลง (ไม่ลบข้อมูลเดิม) · ใส่เรตติ้งของเกมใด ระบบจะเพิ่มเกมนั้นให้นักกีฬาอัตโนมัติ',
    '5) เรตติ้งที่เปลี่ยนจะถูกบันทึกเป็นประวัติใหม่ตาม "วันที่มีผล" ที่เลือกตอนนำเข้า ประวัติเดิมไม่หาย · เรตติ้งที่เท่าเดิมจะไม่ถูกบันทึกซ้ำ',
    '6) สถานะ: "เผยแพร่" = แสดงในหน้าอันดับ · "จัดเก็บ" = ไม่แสดง',
    '7) ก่อนบันทึก ระบบจะแสดงตัวอย่างการเปลี่ยนแปลงทุกแถวให้ตรวจ ถ้าแถวใดผิด จะถูกข้ามและแจ้งเหตุผล',
    '8) ไฟล์ .csv ใช้ได้เช่นกัน (หัวคอลัมน์เหมือนไฟล์นี้)'].forEach((t, i) => { const c = help.getCell(i + 1, 1); c.value = t; if (i === 0) c.font = { bold: true, size: 14 }; c.alignment = { wrapText: true }; });
  const buf = await wb.xlsx.writeBuffer();
  save(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), blank ? 'แม่แบบนำเข้านักกีฬา.xlsx' : `นักกีฬาและเรตติ้ง-${todayStr()}.xlsx`);
}

export type Num = number | null | 'invalid';
export interface SheetRow { row: number; id: string; full_name: string; full_name_en: string; ratings: Record<Rated, Num>; status: 'published' | 'archived' | null | 'invalid' }

type Cell = unknown;
function text(v: Cell): string {
  if (v == null) return '';
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>;
    if (Array.isArray(o.richText)) return (o.richText as { text: string }[]).map(x => x.text).join('').trim();
    if ('result' in o) return text(o.result);
    if ('text' in o) return text(o.text);
    return '';
  }
  return String(v).replace(/[​-‍⁠﻿]/g, '').replace(/\s+/g, ' ').trim();
}
function num(v: Cell): Num {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 'invalid';
  if (v && typeof v === 'object' && 'result' in (v as object)) return num((v as { result: unknown }).result);
  const s = text(v).replace(/[,\s]/g, '');
  if (!s || s === '-' || s === '—') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : 'invalid';
}
function status(v: Cell): SheetRow['status'] {
  const s = text(v).toLowerCase();
  if (!s) return null;
  if (['เผยแพร่', 'published', 'publish', 'แสดง'].includes(s)) return 'published';
  if (['จัดเก็บ', 'archived', 'archive', 'ซ่อน', 'เก็บ'].includes(s)) return 'archived';
  return 'invalid';
}
/** Which column holds what, decided from the header text (columns may be moved or renamed slightly). */
function mapHeader(cells: string[]): Partial<Record<typeof ORDER[number], number>> {
  const m: Partial<Record<typeof ORDER[number], number>> = {};
  cells.forEach((raw, i) => {
    const h = raw.toLowerCase();
    if (!h) return;
    if (m.id === undefined && (h.includes('รหัส') || /\bid\b/.test(h))) m.id = i;
    else if (m.crossword === undefined && (h.includes('ครอสเวิร์ด') || h.includes('crossword'))) m.crossword = i;
    else if (m.a_math === undefined && (h.includes('เอแม็ท') || h.includes('เอแมท') || /a[-_ ]?math/.test(h))) m.a_math = i;
    else if (m.status === undefined && (h.includes('สถานะ') || h.includes('status'))) m.status = i;
    else if (m.full_name_en === undefined && (h.includes('อังกฤษ') || h.includes('english') || /\ben\b/.test(h))) m.full_name_en = i;
    else if (m.full_name === undefined && (h.includes('ชื่อ') || h.includes('name'))) m.full_name = i;
  });
  return m;
}
function toRows(grid: Cell[][]): SheetRow[] {
  const hi = grid.slice(0, 10).findIndex(r => { const m = mapHeader(r.map(text)); return m.full_name !== undefined || m.id !== undefined; });
  if (hi < 0) throw new Error('ไม่พบแถวหัวตาราง (ต้องมีคอลัมน์ "ชื่อ-นามสกุล (ไทย)" หรือ "รหัสนักกีฬา") กรุณาใช้ไฟล์แม่แบบ');
  const m = mapHeader(grid[hi].map(text));
  if (m.crossword === undefined && m.a_math === undefined && m.full_name === undefined) throw new Error('ไม่พบคอลัมน์ชื่อหรือเรตติ้ง กรุณาใช้ไฟล์แม่แบบ');
  const at = (r: Cell[], k: keyof typeof m) => (m[k] === undefined ? undefined : r[m[k]!]);
  const out: SheetRow[] = [];
  grid.slice(hi + 1).forEach((r, k) => {
    if (!r.some(c => text(c))) return; // empty row
    out.push({ row: hi + k + 2, id: text(at(r, 'id')), full_name: text(at(r, 'full_name')), full_name_en: text(at(r, 'full_name_en')),
      ratings: { crossword: num(at(r, 'crossword')), a_math: num(at(r, 'a_math')) }, status: status(at(r, 'status')) });
  });
  return out;
}
function parseCsv(src: string): string[][] {
  const s = src.replace(/^﻿/, ''); const first = s.split(/\r?\n/, 1)[0];
  const sep = [',', ';', '\t'].sort((a, b) => first.split(b).length - first.split(a).length)[0];
  const rows: string[][] = []; let row: string[] = []; let cell = ''; let q = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { if (c === '"') { if (s[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; continue; }
    if (c === '"') q = true; else if (c === sep) { row.push(cell); cell = ''; } else if (c === '\n' || c === '\r') { if (c === '\r' && s[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; } else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}
/** Reads the first sheet of an .xlsx (or a .csv) into rows. Throws a Thai message for files it cannot read. */
export async function readAthletesFile(file: File): Promise<SheetRow[]> {
  const name = file.name.toLowerCase();
  if (file.size > 10 * 1024 * 1024) throw new Error('ไฟล์ใหญ่เกิน 10 MB');
  if (name.endsWith('.csv')) return toRows(parseCsv(await file.text()));
  if (name.endsWith('.xls')) throw new Error('ไฟล์ .xls (Excel รุ่นเก่า) ยังไม่รองรับ กรุณาเปิดใน Excel แล้ว "บันทึกเป็น" .xlsx');
  if (!name.endsWith('.xlsx')) throw new Error('รองรับเฉพาะไฟล์ .xlsx หรือ .csv');
  const ExcelJS = await load();
  const wb = new ExcelJS.Workbook();
  try { await wb.xlsx.load(await file.arrayBuffer()); } catch { throw new Error('เปิดไฟล์ไม่ได้ ไฟล์อาจเสียหายหรือมีรหัสผ่าน'); }
  const ws = wb.worksheets.find(w => w.name === 'นักกีฬา') ?? wb.worksheets[0];
  if (!ws) throw new Error('ไม่พบแผ่นงานในไฟล์');
  const grid: Cell[][] = [];
  ws.eachRow({ includeEmpty: true }, (row, n) => { const vals = (row.values as Cell[]).slice(1); grid[n - 1] = vals; });
  for (let i = 0; i < grid.length; i++) grid[i] ??= [];
  return toRows(grid);
}
