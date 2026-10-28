import type { RuleSection } from './types';
export const collins = { tools: 'https://scrabble.collinsdictionary.com/tools/', check: 'https://scrabble.collinsdictionary.com/check/' };
/** Set `available: true` once ThaiWordChallenge.exe has been built on Windows and copied to public/downloads/ (see tools/kumkom-challenge/README.md). */
export const kumkomExe = { available: false, url: '/downloads/ThaiWordChallenge.exe', fileName: 'ThaiWordChallenge.exe', sizeLabel: '', updated: '' };
export const dictionaries = {
  en: { url: '/dictionary/enable1.txt', name: 'ENABLE', title: 'ตรวจคำภาษาอังกฤษ', placeholder: 'พิมพ์คำภาษาอังกฤษ 1 คำ เช่น scrabble',
    found: 'พบในฐานคำอ้างอิง ENABLE', missing: 'ไม่พบในฐานคำอ้างอิง ENABLE',
    foundNote: 'ผลนี้เป็นการอ้างอิงเบื้องต้น ไม่ใช่ผลตัดสินอย่างเป็นทางการ', missingNote: 'คำนี้อาจยังถูกต้องใน Collins Official SCRABBLE™ Words (2024) ให้ยืนยันด้วยโปรแกรมของ Collins' },
  th: { url: '/dictionary/kumkom-words.txt', name: 'ฐานคำศัพท์คำคม', title: 'ตรวจคำภาษาไทย', placeholder: 'พิมพ์คำภาษาไทย 1 คำ',
    found: 'มีคำนี้ในฐานคำศัพท์คำคม', missing: 'ไม่พบคำนี้ในฐานคำศัพท์คำคม',
    foundNote: 'ตรวจแบบตรงตัวอักษร (รวมการสะกด สระ และวรรณยุกต์) การตัดสินในการแข่งขันให้ยึดกรรมการ', missingNote: 'ตรวจแบบตรงตัวอักษร ลองตรวจการสะกดและตำแหน่งวรรณยุกต์ หากยังไม่พบให้สอบถามกรรมการ' } } as const;
export const toolsSection = (kind: 'crossword' | 'kumkom'): RuleSection => ({ id: 'tools', title: 'โปรแกรม Challenge และตัวตรวจคำ', blocks: kind === 'crossword'
  ? [{ t: 'tool', tool: 'crossword-challenge' }, { t: 'h', text: 'ตรวจคำบนเว็บไซต์' }, { t: 'tool', tool: 'checker-en' }]
  : [{ t: 'tool', tool: 'kumkom-challenge' }, { t: 'h', text: 'ตรวจคำบนเว็บไซต์' }, { t: 'tool', tool: 'checker-th' }] });
