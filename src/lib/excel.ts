// Reads a rating file (.xlsx or .csv) in the browser. The file is never uploaded or stored: only the confirmed
// names and ratings are sent to the database. exceljs is loaded only when an admin uses the import.
import type * as ExcelNS from 'exceljs';

// The browser build of exceljs is a CommonJS bundle: depending on the bundler the API is on `default` or on the module itself.
const load = async () => { const m = await import('exceljs'); return ((m as unknown as { default?: typeof ExcelNS }).default ?? m) as typeof ExcelNS; };
export type CellValue = string | number | null;
export interface Sheet { name: string; grid: CellValue[][] }

function plain(v: unknown): CellValue {
  if (v == null) return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>;
    if (Array.isArray(o.richText)) return (o.richText as { text: string }[]).map(x => x.text).join('');
    if ('result' in o) return plain(o.result);
    if ('text' in o) return plain(o.text);
    return null;
  }
  return String(v);
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
/** Reads every sheet of the workbook (or the CSV) into plain values. Throws a Thai message for files it cannot read. */
export async function readSheets(file: File): Promise<Sheet[]> {
  const name = file.name.toLowerCase();
  if (file.size > 10 * 1024 * 1024) throw new Error('ไฟล์ใหญ่เกิน 10 MB');
  if (name.endsWith('.csv')) return [{ name: 'CSV', grid: parseCsv(await file.text()).map(r => r.map(c => (c.trim() === '' ? null : c))) }];
  if (name.endsWith('.xls')) throw new Error('ไฟล์ .xls (Excel รุ่นเก่า) ยังไม่รองรับ กรุณาเปิดใน Excel แล้ว "บันทึกเป็น" .xlsx');
  if (!name.endsWith('.xlsx')) throw new Error('รองรับเฉพาะไฟล์ .xlsx หรือ .csv');
  const ExcelJS = await load();
  const wb = new ExcelJS.Workbook();
  try { await wb.xlsx.load(await file.arrayBuffer()); } catch { throw new Error('เปิดไฟล์ไม่ได้ ไฟล์อาจเสียหายหรือมีรหัสผ่าน'); }
  const sheets = wb.worksheets.map(ws => { const grid: CellValue[][] = [];
    ws.eachRow({ includeEmpty: true }, (row, n) => { grid[n - 1] = (row.values as unknown[]).slice(1).map(plain); });
    for (let i = 0; i < grid.length; i++) grid[i] ??= [];
    return { name: ws.name, grid }; }).filter(s => s.grid.some(r => r.some(c => c !== null && String(c).trim() !== '')));
  if (!sheets.length) throw new Error('ไม่พบข้อมูลในไฟล์');
  return sheets;
}

export interface Columns { header: number; name: number | null; rating: number | null }
const isNum = (v: CellValue) => typeof v === 'number' || (typeof v === 'string' && /^\s*-?[\d,]+(\.\d+)?\s*$/.test(v));
const isText = (v: CellValue) => typeof v === 'string' && /[A-Za-z฀-๿]/.test(v) && !isNum(v);
/** Guesses which row is the header and which columns hold the name and the rating. */
export function guessColumns(grid: CellValue[][]): Columns {
  const width = Math.max(0, ...grid.map(r => r.length));
  for (let h = 0; h < Math.min(10, grid.length); h++) {
    const cells = (grid[h] ?? []).map(c => String(c ?? '').toLowerCase());
    const find = (re: RegExp, not?: RegExp) => { const i = cells.findIndex(c => re.test(c) && !(not && not.test(c))); return i < 0 ? null : i; };
    const rating = find(/เรต|เรท|rating|elo|คะแนน/);
    const name = find(/ชื่อ|name|รายชื่อ|นักกีฬา|player/, /อังกฤษ|english|\(en\)|name.?en/);
    if (name !== null && rating !== null) return { header: h, name, rating };
  }
  // No recognisable header: first mostly-text column = names, first mostly-number column (not a small rank) = ratings.
  const data = grid.slice(0, 50);
  const share = (col: number, f: (v: CellValue) => boolean) => data.filter(r => f(r[col] ?? null)).length / Math.max(1, data.filter(r => r.some(c => c !== null)).length);
  let name: number | null = null, rating: number | null = null;
  for (let c = 0; c < width; c++) {
    if (name === null && share(c, isText) > 0.6) name = c;
    else if (rating === null && share(c, isNum) > 0.6 && data.some(r => Number(String(r[c] ?? '').replace(/,/g, '')) > 100)) rating = c;
  }
  const header = data.findIndex(r => r.some(c => c !== null)) ;
  const headerLooksLikeData = header >= 0 && name !== null && isText(data[header][name] ?? null) && rating !== null && isNum(data[header][rating] ?? null);
  return { header: headerLooksLikeData ? -1 : header, name, rating };
}
export const colLetter = (i: number) => { let s = ''; i += 1; while (i) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; };
export function toNumber(v: CellValue): number | null | 'invalid' {
  if (v === null) return null;
  if (typeof v === 'number') return v;
  const s = v.replace(/[,\s]/g, '');
  if (!s || s === '-' || s === '—') return null;
  const n = Number(s); return Number.isFinite(n) ? n : 'invalid';
}

/** Small sample file: the two columns the import needs (names may be Thai or English). */
export async function downloadSample() {
  const ExcelJS = await load();
  const wb = new ExcelJS.Workbook(); const ws = wb.addWorksheet('เรตติ้ง', { views: [{ state: 'frozen', ySplit: 1 }] });
  ws.columns = [{ header: 'รายชื่อ', key: 'n', width: 34 }, { header: 'เรตติ้ง', key: 'r', width: 14 }];
  ws.getRow(1).eachCell(c => { c.font = { bold: true, color: { argb: 'FFFFFFFF' } }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F2A47' } }; });
  for (let r = 2; r <= 1000; r++) ws.getCell(r, 2).dataValidation = { type: 'decimal', operator: 'greaterThanOrEqual', formulae: [0], allowBlank: true, showErrorMessage: true, error: 'กรุณาใส่ตัวเลข' };
  const buf = await wb.xlsx.writeBuffer();
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  a.download = 'ตัวอย่างไฟล์เรตติ้ง.xlsx'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
