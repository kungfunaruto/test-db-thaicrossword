import { nb } from '../utils/labels';
export type FieldType = 'text' | 'textarea' | 'select' | 'date' | 'number' | 'url' | 'image' | 'slug' | 'boolean' | 'relation';
export interface Option { value: string; label: string }
export interface Field {
  name: string; label: string; type: FieldType; required?: boolean; options?: Option[]; bucket?: string;
  slugFrom?: string; relation?: { table: string; label: string }; hint?: string;
}
export interface Resource {
  table: string; title: string; noun: string; note?: string; fields: Field[]; columns: string[];
  searchFields: string[]; filterFields: string[]; orderBy: string; slugPrefix?: string;
  defaults: Record<string, string>;
  validate?: (v: Record<string, string>) => Record<string, string>;
  beforeSave?: (p: Record<string, unknown>) => Record<string, unknown>;
}
const o = (pairs: [string, string][]): Option[] => pairs.map(([value, label]) => ({ value, label: nb(label) }));
const PUB = o([['draft', 'ฉบับร่าง'], ['published', 'เผยแพร่'], ['archived', 'เก็บถาวร']]);
const GAMES = o([['crossword', 'ครอสเวิร์ด'], ['a_math', 'เอแม็ท'], ['kumkom', 'คำคม'], ['sudoku', 'ซูโดกุ']]);
const NEWS_CATS = ['ประกาศทั่วไป', 'ประกาศการแข่งขัน', 'ผลการแข่งขัน', 'ข่าวกิจกรรม', 'ข่าวอื่น ๆ'].map(v => ({ value: v, label: v }));

export const newsResource: Resource = {
  table: 'news', title: 'จัดการข่าวประชาสัมพันธ์', noun: 'ข่าว', slugPrefix: 'news', orderBy: 'created_at',
  columns: ['title', 'category', 'status', 'published_at'], searchFields: ['title'], filterFields: ['category', 'status'],
  defaults: { category: NEWS_CATS[0].value, status: 'draft' },
  fields: [
    { name: 'image_url', label: 'รูปภาพ', type: 'image', bucket: 'news-images' },
    { name: 'category', label: 'หมวดหมู่', type: 'select', options: NEWS_CATS, required: true },
    { name: 'title', label: 'หัวข้อข่าว', type: 'text', required: true },
    { name: 'slug', label: 'Slug (ลิงก์)', type: 'slug', slugFrom: 'title', hint: 'เว้นว่างเพื่อสร้างอัตโนมัติ (a-z, 0-9, -)' },
    { name: 'excerpt', label: 'เนื้อหาย่อ', type: 'textarea' },
    { name: 'content', label: 'เนื้อหาข่าว (ข้อความธรรมดา)', type: 'textarea', required: true },
    { name: 'external_url', label: 'ลิงก์ภายนอก', type: 'url' },
    { name: 'published_at', label: 'วันที่เผยแพร่', type: 'date', hint: 'เว้นว่างเพื่อใช้วันที่เผยแพร่จริง' },
    { name: 'status', label: 'สถานะ', type: 'select', options: PUB, required: true },
  ],
};
export const eventsResource: Resource = {
  table: 'events', title: 'จัดการการแข่งขันและกิจกรรม', noun: 'กิจกรรม', slugPrefix: 'event', orderBy: 'start_date',
  columns: ['title', 'game_type', 'start_date', 'competition_status', 'publication_status'], searchFields: ['title'],
  filterFields: ['competition_status', 'publication_status', 'game_type'],
  defaults: { category: 'tournament', game_type: 'crossword', competition_status: 'upcoming', publication_status: 'draft' },
  validate: (v): Record<string, string> => (v.start_date && v.end_date && v.end_date < v.start_date ? { end_date: 'วันสิ้นสุดต้องไม่ก่อนวันเริ่มต้น' } : {}),
  fields: [
    { name: 'image_url', label: 'ภาพปก', type: 'image', bucket: 'event-images' },
    { name: 'title', label: 'ชื่อกิจกรรม', type: 'text', required: true },
    { name: 'slug', label: 'Slug (ลิงก์)', type: 'slug', slugFrom: 'title', hint: 'เว้นว่างเพื่อสร้างอัตโนมัติ' },
    { name: 'category', label: 'ประเภทกิจกรรม', type: 'select', required: true,
      options: o([['tournament', 'การแข่งขัน'], ['event', 'กิจกรรม'], ['training', 'การอบรม'], ['other', 'อื่น ๆ']]) },
    { name: 'game_type', label: 'ประเภทเกม', type: 'select', required: true, options: [...GAMES, ...o([['multiple', 'หลายเกม'], ['other', 'อื่น ๆ']])] },
    { name: 'start_date', label: 'วันเริ่มต้น', type: 'date', required: true },
    { name: 'end_date', label: 'วันสิ้นสุด', type: 'date' },
    { name: 'venue', label: 'สถานที่', type: 'text' },
    { name: 'description', label: 'รายละเอียด (ข้อความธรรมดา)', type: 'textarea', required: true },
    { name: 'result_url', label: 'ลิงก์ผลการแข่งขัน', type: 'url' },
    { name: 'teacher_certificate_url', label: 'ลิงก์เกียรติบัตรครู', type: 'url' },
    { name: 'student_certificate_url', label: 'ลิงก์เกียรติบัตรนักเรียน', type: 'url' },
    { name: 'competition_status', label: 'สถานะการแข่งขัน', type: 'select', required: true,
      options: o([['upcoming', 'เร็ว ๆ นี้'], ['registration_open', 'เปิดรับสมัคร'], ['in_progress', 'กำลังแข่งขัน'], ['completed', 'สิ้นสุดแล้ว'], ['cancelled', 'ยกเลิก']]) },
    { name: 'publication_status', label: 'สถานะการเผยแพร่', type: 'select', options: PUB, required: true },
  ],
};

export const faqsResource: Resource = {
  table: 'faqs', title: 'จัดการถาม-ตอบ (Q&A)', noun: 'คำถาม', orderBy: 'created_at',
  columns: ['question', 'game_type', 'sort_order', 'status'], searchFields: ['question', 'answer'], filterFields: ['game_type', 'status'],
  defaults: { sort_order: '0', status: 'published' },
  note: 'เพิ่มคำถามและคำตอบที่จะแสดงในหน้า "ถาม-ตอบ" ของเว็บไซต์ เรียงตามเลขลำดับ (น้อยแสดงก่อน) เนื้อหาเป็นข้อความธรรมดา',
  fields: [
    { name: 'question', label: 'คำถาม', type: 'text', required: true },
    { name: 'answer', label: 'คำตอบ', type: 'textarea', required: true },
    { name: 'game_type', label: 'หมวดเกม (เว้นว่าง = ทั่วไป)', type: 'select', options: o([['crossword', 'ครอสเวิร์ด'], ['a_math', 'เอแม็ท'], ['kumkom', 'คำคม'], ['sudoku', 'ซูโดกุ']]) },
    { name: 'sort_order', label: 'ลำดับการแสดง', type: 'number', required: true, hint: 'เลขน้อยแสดงก่อน' },
    { name: 'status', label: 'สถานะ', type: 'select', options: PUB, required: true },
  ],
};
