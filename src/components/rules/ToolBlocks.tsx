import { Download, ExternalLink, Hourglass, Monitor } from 'lucide-react';
import { collins, kumkomExe } from '../../content/rules/tools';
import WordChecker from './WordChecker';

const Card = ({ accent, title, children }: { accent: string; title: string; children: React.ReactNode }) => (
  <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card"><div className="h-1.5" style={{ background: accent }} />
    <div className="p-5"><h4 className="flex items-center gap-2 font-sans text-lg font-semibold text-navy"><Monitor className="h-5 w-5" />{title}</h4>{children}</div></div>);

export default function ToolBlock({ tool, accent }: { tool: 'crossword-challenge' | 'kumkom-challenge' | 'checker-en' | 'checker-th'; accent: string }) {
  if (tool === 'checker-en') return <WordChecker lang="en" />;
  if (tool === 'checker-th') return <WordChecker lang="th" />;
  if (tool === 'crossword-challenge') return (<Card accent={accent} title="โปรแกรม Challenge ครอสเวิร์ด (Collins)">
    <p className="mt-3">ดาวน์โหลดโปรแกรมตรวจคำศัพท์ทางการได้จากหน้า Tools ของ Collins Scrabble (เช่น Collins Zyzzyva สำหรับ Collins Scrabble Words 2024 ตามที่หน้า Tools ระบุสำหรับ Windows และ macOS)</p>
    <a href={collins.tools} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 rounded bg-navy px-5 py-2.5 font-medium text-white hover:brightness-110"><Download className="h-4 w-4" />ไปหน้าดาวน์โหลดของ Collins<ExternalLink className="h-4 w-4" /></a>
    <p className="mt-3 text-xs text-muted">ไฟล์โปรแกรมให้บริการโดย Collins โดยตรง เว็บไซต์นี้เป็นเพียงลิงก์ไปยังหน้าทางการ รายการคำของ Collins มีลิขสิทธิ์ ให้ใช้ตามเงื่อนไขของ Collins</p></Card>);
  return (<Card accent={accent} title="โปรแกรม Challenge คำคม (Windows)">
    <p className="mt-3">โปรแกรมตรวจคำศัพท์ภาษาไทยสำหรับกรรมการ ควบคุมด้วยคีย์บอร์ดทั้งหมด ฝังฐานคำไว้ในตัวโปรแกรม ไม่ต้องติดตั้ง Python และไม่ต้องต่ออินเทอร์เน็ต</p>
    {kumkomExe.available
      ? <a href={kumkomExe.url} download={kumkomExe.fileName} className="mt-4 inline-flex items-center gap-2 rounded bg-navy px-5 py-2.5 font-medium text-white hover:brightness-110"><Download className="h-4 w-4" />ดาวน์โหลด {kumkomExe.fileName}{kumkomExe.sizeLabel && ` (${kumkomExe.sizeLabel})`}</a>
      : <p className="mt-4 flex gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900"><Hourglass className="mt-0.5 h-4 w-4 shrink-0" />ไฟล์ติดตั้ง .exe อยู่ระหว่างจัดเตรียม ระหว่างนี้สามารถใช้ตัวตรวจคำบนเว็บไซต์ด้านล่างได้</p>}
    <h5 className="mt-5 font-sans font-semibold text-navy-dark">วิธีใช้โปรแกรม</h5>
    <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm"><li>เปิดโปรแกรม พิมพ์จำนวนคำที่ต้องการตรวจ แล้วกด Enter</li><li>พิมพ์คำทีละคำ กด Enter เพื่อขึ้นบรรทัดใหม่</li><li>พิมพ์ครบแล้วกด Tab เพื่อตรวจ</li>
      <li>เครื่องหมาย ✓ หมายถึงมีครบทุกคำ ส่วน ✕ หมายถึงมีอย่างน้อย 1 คำที่ไม่พบ (โปรแกรมไม่ระบุว่าคำใด)</li><li>กดปุ่มใดก็ได้เพื่อเริ่มรอบใหม่ กด Esc ที่หน้าพิมพ์คำเพื่อย้อนกลับ และกด F11 เพื่อเต็มจอ</li></ol>
    <p className="mt-3 text-xs text-muted">ออกแบบสำหรับ Windows 10/11 (64-bit) หากขึ้นหน้าต่างเตือนของ Windows SmartScreen ให้เลือก “ข้อมูลเพิ่มเติม” แล้ว “เรียกใช้อยู่ดี” (ไฟล์ที่ยังไม่ลงลายเซ็นดิจิทัลมักมีคำเตือนนี้)</p></Card>);
}
