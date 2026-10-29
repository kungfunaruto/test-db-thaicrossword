import { Building2, CalendarClock, CalendarDays, MapPin } from 'lucide-react';
import type { FilterDef, ResourceDef, Row } from './ResourceManager';
import { competitionStatus } from '../../services/publicService';
import { th } from '../../i18n/th';
import { fmtDate, fmtRange } from '../../lib/dates';
import { STATUS_DOT, STATUS_STYLE } from '../../utils/labels';

const GAMES = (['crossword', 'a_math', 'kumkom', 'sudoku'] as const).map(g => ({ value: g, label: th.games[g] }));
const NEWS_CATS = [{ value: 'general', label: 'ประกาศทั่วไป' }, { value: 'competition', label: 'ประกาศการแข่งขัน' }];
const eq = (k: string): FilterDef['test'] => (row, v) => String(row[k]) === v;
const evStatus = (row: Row) => competitionStatus({ registration_deadline: (row.registration_deadline as string | null) ?? null, last_date: String(row.last_date) });
export const CompStatus = ({ row }: { row: Row }) => { const s = evStatus(row); return <span className={`chip ${STATUS_STYLE[s]}`}><span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[s]}`} />{th.events.status[s]}</span>; };

export const newsResource: ResourceDef = {
  table: 'news', title: 'จัดการข่าว', noun: 'ข่าว', slugPrefix: 'news', thumb: true, revisions: true, pinnable: true,
  statusField: 'status', statusMode: 'publish-draft', searchFields: ['title', 'title_en', 'excerpt'],
  filters: [{ key: 'category', label: 'หมวดหมู่', options: NEWS_CATS, test: eq('category') }, { key: 'status', label: 'สถานะ', options: [{ value: 'published', label: 'เผยแพร่' }, { value: 'draft', label: 'ฉบับร่าง' }], test: eq('status') }],
  defaults: { category: 'general', is_pinned: false },
  rowMeta: row => <span className="flex flex-wrap gap-x-3"><span>{NEWS_CATS.find(c => c.value === row.category)?.label}</span>
    <span>{row.published_at ? `เผยแพร่ ${fmtDate(String(row.published_at), 'th', 'medium')}` : `สร้าง ${fmtDate(String(row.created_at), 'th', 'medium')}`}</span>
    {Array.isArray(row.images) && row.images.length > 1 && <span>{row.images.length} รูป</span>}</span>,
  fields: [
    { name: 'title', label: 'หัวข้อข่าว', type: 'text', required: true, en: true },
    { name: 'excerpt', label: 'เนื้อหาย่อ (แสดงบนการ์ด)', type: 'textarea', rows: 3, en: true, hint: 'สรุปสั้น ๆ 1–2 ประโยค' },
    { name: 'content', label: 'เนื้อหาข่าว', type: 'textarea', rows: 14, required: true, en: true, hint: 'ข้อความธรรมดา ขึ้นบรรทัดใหม่ได้' },
    { name: 'images', label: 'รูปภาพ', type: 'images', bucket: 'news-images', hint: 'รูปแรกเป็นภาพปก' },
    { name: 'category', label: 'หมวดหมู่', type: 'pills', options: NEWS_CATS, required: true, side: true },
    { name: 'published_at', label: 'วันที่เผยแพร่', type: 'date', side: true, hint: 'เว้นว่างเพื่อใช้วันที่กดเผยแพร่' },
    { name: 'external_url', label: 'ลิงก์ภายนอก', type: 'url', side: true, placeholder: 'https://' },
    { name: 'is_pinned', label: 'ปักหมุด', type: 'boolean', side: true, hint: 'ปักหมุดไว้ที่หน้าแรก (แสดงก่อนรายการอื่น)' },
  ],
};

export const eventsResource: ResourceDef = {
  table: 'events', title: 'จัดการการแข่งขัน', noun: 'การแข่งขัน', slugPrefix: 'event', thumb: true, revisions: true, pinnable: true,
  statusField: 'publication_status', statusMode: 'publish-draft', searchFields: ['title', 'title_en', 'venue'],
  note: <>สถานะคำนวณจากวันที่อัตโนมัติ (เวลาประเทศไทย): ถ้าใส่วันรับสมัครวันสุดท้าย <b>เปิดรับสมัคร</b> → <b>ปิดรับสมัคร</b> → <b>สิ้นสุดการแข่งขัน</b> · ถ้าไม่เปิดรับสมัคร (เว้นว่าง) <b>เร็ว ๆ นี้</b> → <b>สิ้นสุดการแข่งขัน</b> · หน้าการแข่งขันเรียงตามวันแข่งวันแรก โดยรายการที่ปักหมุดขึ้นก่อน</>,
  filters: [{ key: 'comp', label: 'สถานะการแข่งขัน', options: (['open', 'closed', 'upcoming', 'ended'] as const).map(s => ({ value: s, label: th.events.status[s] })), test: (row, v) => evStatus(row) === v },
    { key: 'publication_status', label: 'การเผยแพร่', options: [{ value: 'published', label: 'เผยแพร่' }, { value: 'draft', label: 'ฉบับร่าง' }], test: eq('publication_status') }],
  defaults: { games: [], is_pinned: false },
  validate: v => {
    const e: Record<string, string> = {}; const s = String(v.start_date ?? ''), en = String(v.end_date ?? ''), d = String(v.registration_deadline ?? '');
    if (s && en && en < s) e.end_date = 'วันสิ้นสุดต้องไม่ก่อนวันเริ่มแข่งขัน';
    if (s && d && d > (en || s)) e.registration_deadline = 'วันรับสมัครวันสุดท้ายต้องไม่หลังวันแข่งขันวันสุดท้าย';
    return e;
  },
  rowMeta: row => <span className="flex flex-wrap items-center gap-x-3 gap-y-1"><CompStatus row={row} />
    <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{fmtRange(String(row.start_date), row.end_date as string | null, 'th', 'medium')}</span>
    <span className="inline-flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" />{row.registration_deadline ? `รับสมัครถึง ${fmtDate(String(row.registration_deadline), 'th', 'medium')}` : 'ไม่เปิดรับสมัคร'}</span>
    {!!row.organizer && <span className="inline-flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />{String(row.organizer)}</span>}
    {!!row.venue && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{String(row.venue)}</span>}
    {Array.isArray(row.games) && <span>{(row.games as string[]).map(g => th.games[g]).join(', ')}</span>}</span>,
  fields: [
    { name: 'title', label: 'ชื่อการแข่งขัน', type: 'text', required: true, en: true },
    { name: 'games', label: 'ประเภทการแข่งขัน (เลือกได้หลายประเภท)', type: 'chips', options: GAMES, required: true },
    { name: 'description', label: 'รายละเอียด', type: 'textarea', rows: 12, required: true, en: true, hint: 'ข้อความธรรมดา ขึ้นบรรทัดใหม่ได้' },
    { name: 'organizer', label: 'ผู้จัดการแข่งขัน (บริษัท / หน่วยงาน)', type: 'text', en: true, hint: 'แสดงบนการ์ดการแข่งขันและหน้ารายละเอียด' },
    { name: 'venue', label: 'สถานที่', type: 'text', en: true },
    { name: 'images', label: 'รูปภาพ / โปสเตอร์', type: 'images', bucket: 'event-images', hint: 'รูปแรกเป็นภาพปก โปสเตอร์แนวตั้งจะแสดงเต็มรูปโดยไม่ถูกตัด' },
    { name: 'start_date', label: 'วันเริ่มแข่งขัน', type: 'date', required: true, side: true },
    { name: 'end_date', label: 'วันแข่งขันวันสุดท้าย', type: 'date', side: true, hint: 'เว้นว่างถ้าแข่งวันเดียว' },
    { name: 'registration_deadline', label: 'วันรับสมัครวันสุดท้าย', type: 'date', side: true, hint: 'เว้นว่างถ้างานนี้ไม่เปิดรับสมัคร' },
    { name: 'result_url', label: 'ลิงก์ผลการแข่งขัน', type: 'url', side: true, placeholder: 'https://' },
    { name: 'teacher_certificate_url', label: 'ลิงก์เกียรติบัตรครู', type: 'url', side: true, placeholder: 'https://' },
    { name: 'student_certificate_url', label: 'ลิงก์เกียรติบัตรนักเรียน', type: 'url', side: true, placeholder: 'https://' },
    { name: 'is_pinned', label: 'ปักหมุด', type: 'boolean', side: true, hint: 'ปักหมุดไว้ที่หน้าแรก (แสดงก่อนรายการอื่น)' },
  ],
};

export const faqsResource: ResourceDef = {
  table: 'faqs', title: 'คำถาม-คำตอบที่เผยแพร่', noun: 'คำถาม', statusField: 'status', statusMode: 'publish-archive', searchFields: ['question', 'answer', 'question_en'],
  note: 'คำถามและคำตอบที่แสดงในหน้า "ถาม-ตอบ" เรียงตามวันที่เพิ่ม (ใหม่สุดก่อน)',
  filters: [{ key: 'status', label: 'สถานะ', options: [{ value: 'published', label: 'เผยแพร่' }, { value: 'archived', label: 'จัดเก็บ' }], test: eq('status') },
    { key: 'game_type', label: 'หมวดเกม', options: [{ value: 'general', label: 'ทั่วไป' }, ...GAMES], test: (row, v) => (v === 'general' ? !row.game_type : row.game_type === v) }],
  defaults: { status: 'published' },
  rowMeta: row => <span className="flex gap-3"><span>{row.game_type ? th.games[String(row.game_type)] : 'ทั่วไป'}</span><span>เพิ่มเมื่อ {fmtDate(String(row.created_at), 'th', 'medium')}</span></span>,
  fields: [
    { name: 'question', label: 'คำถาม', type: 'text', required: true, en: true },
    { name: 'answer', label: 'คำตอบ', type: 'textarea', rows: 8, required: true, en: true },
    { name: 'game_type', label: 'หมวดเกม (เว้นว่าง = ทั่วไป)', type: 'select', options: GAMES, side: true },
  ],
};
