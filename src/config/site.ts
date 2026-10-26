// Verified association details are NOT yet supplied. Replace placeholders only with confirmed values.
export const site = {
  nameTh: 'สมาคมครอสเวิร์ด เอแม็ท คำคม และซูโดกุแห่งประเทศไทย',
  nameEn: null as string | null, // TODO: official English name (awaiting confirmation)
  logoUrl: null as string | null, // TODO: official logo (awaiting confirmation)
  contact: null as { email?: string; phone?: string; address?: string } | null, // TODO: verified contact
  social: [] as { label: string; url: string }[], // TODO: verified accounts only
};
/** Phrase boundaries for line breaking (must join to nameTh). */
export const nameParts = ['สมาคมครอสเวิร์ด ', 'เอแม็ท ', 'คำคม ', 'และซูโดกุ', 'แห่งประเทศไทย'];
export const nav = [
  { to: '/', label: 'หน้าแรก' }, { to: '/about', label: 'เกี่ยวกับสมาคม' }, { to: '/news', label: 'ข่าวประชาสัมพันธ์' },
  { to: '/games', label: 'เกมและกติกา' }, { to: '/events', label: 'การแข่งขัน' },
  { to: '/rankings', label: 'อันดับนักกีฬา' }, { to: '/qa', label: 'ถาม-ตอบ' },
];
