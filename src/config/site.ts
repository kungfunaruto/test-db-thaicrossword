// Official identity. Name and English name are taken from the official logo supplied by the association.
// UI text in both languages lives in src/i18n (th.ts / en.ts).
export const site = {
  nameTh: 'สมาคมครอสเวิร์ดเกม เอแม็ท คำคม และซูโดกุ แห่งประเทศไทย',
  nameEn: 'Thailand Crossword Game A-Math Kumkom and Sudoku Association',
  abbreviation: 'TCA',
  contact: null as { email?: string; phone?: string; address?: string } | null, // TODO: verified contact details (awaiting confirmation)
  social: [{ label: 'Facebook', url: 'https://www.facebook.com/tthailandcrossword' }] as { label: string; url: string }[],
};
