// Official identity. Name and English name are taken from the official logo supplied by the association.
export const site = {
  nameTh: 'สมาคมครอสเวิร์ดเกม เอแม็ท คำคม และซูโดกุ แห่งประเทศไทย',
  nameEn: 'Thailand Crossword Game A-Math Kumkom and Sudoku Association',
  abbreviation: 'TCA',
  logoUrl: '/logo/tca-logo.jpg' as string | null, // original file, never resized/re-coloured; keep the aspect ratio below
  logoSize: { width: 637, height: 535 },
  contact: null as { email?: string; phone?: string; address?: string } | null, // TODO: verified contact details (awaiting confirmation)
  social: [{ label: 'Facebook: สมาคมครอสเวิร์ดเกมฯ', url: 'https://www.facebook.com/tthailandcrossword' }] as { label: string; url: string }[],
};
/** Phrase boundaries for line breaking (must join to nameTh). */
export const nameParts = ['สมาคมครอสเวิร์ดเกม ', 'เอแม็ท ', 'คำคม ', 'และซูโดกุ ', 'แห่งประเทศไทย'];
export const nav = [
  { to: '/', label: 'หน้าแรก' }, { to: '/about', label: 'เกี่ยวกับสมาคม' }, { to: '/news', label: 'ข่าวประชาสัมพันธ์' },
  { to: '/games', label: 'เกมและกติกา' }, { to: '/events', label: 'การแข่งขัน' }, { to: '/rankings', label: 'อันดับนักกีฬา' }, { to: '/qa', label: 'ถาม-ตอบ' },
];
