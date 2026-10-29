// About-page content. Every claim below is backed by a source listed in `sources` (press releases, the association's own rules PDFs, the official logo).
// Items NOT verified are listed in `pending` and must not be written as fact until the association confirms them.
const NW = 'https://www.newswit.com/th/';
export const sources = [
  { id: 'logo', label: 'ตราสัญลักษณ์ทางการของสมาคม (ไฟล์ที่สมาคมจัดส่ง)', url: '/logo/tca-logo-original.webp' },
  { id: 'rules', label: 'กฎกติกามาตรฐานเพื่อใช้ในการแข่งขัน (บางกอกครอสเวิร์ดคลับ) — เอกสาร PDF บนเว็บไซต์นี้', url: '/games' },
  { id: 'gamesmith', label: 'The Thai Press (2569): B.Grimm Gamesmith ชิงถ้วยพระราชทานฯ', url: 'https://www.thethaipress.com/2026/166901' },
  { id: 'ryt9-2011', label: 'RYT9 (2554): ไซเบอร์ดิก ครอสเวิร์ดเกม ชิงแชมป์ภาคเหนือ', url: 'https://www.ryt9.com/s/prg/1060469' },
  { id: 'sanook-2010', label: 'Sanook Campus (2553): ไซเบอร์ดิก ร่วมมือกับสมาคมครอสเวิร์ดเกมฯ', url: 'https://www.sanook.com/campus/924646/' },
  { id: 'newswit', label: 'Newswit: ข่าวประชาสัมพันธ์ที่เกี่ยวข้องกับสมาคม (2559–2569)', url: 'https://www.newswit.com/search?q=%E0%B8%AA%E0%B8%A1%E0%B8%B2%E0%B8%84%E0%B8%A1%E0%B8%84%E0%B8%A3%E0%B8%AD%E0%B8%AA%E0%B9%80%E0%B8%A7%E0%B8%B4%E0%B8%A3%E0%B9%8C%E0%B8%94&source=pr' },
  { id: 'fb', label: 'Facebook ของสมาคม', url: 'https://www.facebook.com/tthailandcrossword' },
];
export const games = [
  { name: 'ครอสเวิร์ด', brand: 'Wordsmith Crossword Game', text: 'เกมต่อศัพท์ภาษาอังกฤษ นำเบี้ยตัวอักษรมาผสมเป็นคำบนกระดานในรูปแบบอักษรไขว้', to: '/games/crossword' },
  { name: 'เอแม็ท', brand: 'Mathsmith Mathematics Game', text: 'เกมต่อสมการคณิตศาสตร์ ใช้เบี้ยตัวเลขและเครื่องหมายสร้างสมการที่ถูกต้อง', to: '/games/a-math' },
  { name: 'คำคม', brand: 'Thaismith Thai Language Game', text: 'เกมต่อศัพท์ภาษาไทย นำเบี้ยพยัญชนะและสระมาผสมเป็นคำบนกระดาน', to: '/games/kumkom' },
  { name: 'ซูโดกุ', brand: 'Sudoku', text: 'เกมถอดรหัสตัวเลข ที่ปรากฏเป็นหนึ่งในประเภทการแข่งขันของรายการที่สมาคมร่วมจัด', to: '' }];
export const doing = [
  { title: 'ร่วมจัดและรับรองการแข่งขัน', text: 'ข่าวประชาสัมพันธ์ระบุสมาคมเป็นผู้ร่วมจัดรายการแข่งขันระดับประเทศและนานาชาติ ตั้งแต่เวทีภูมิภาคไปจนถึงรายการชิงถ้วยพระราชทาน และบางรายการระบุว่าได้รับการรับรองโดยสมาคม', src: 'newswit' },
  { title: 'ทำงานร่วมกับภาครัฐและเอกชน', text: 'รายการที่ผ่านมาจัดร่วมกับกระทรวงศึกษาธิการ สำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน (สพฐ.) สถาบันภาษา ศูนย์การค้า และบริษัทผู้สนับสนุนหลายราย', src: 'newswit' },
  { title: 'เปิดเวทีให้ทุกระดับชั้น', text: 'เอกสารกติกามาตรฐานระบุรุ่นการแข่งขันตั้งแต่ประถม มัธยม ไปจนถึงประชาชนทั่วไป และรายการภูมิภาคที่ผ่านมาเปิดแข่งขันหลายประเภทเกมในวันเดียวกัน', src: 'rules' },
  { title: 'เชื่อมต่อกับวงการระดับโลก', text: 'เอกสารกติกามาตรฐานระบุว่าสมาคมเป็นสมาชิกของ WESPA (สมาพันธ์เวิร์ดสแครบเบิลโลก) โดยใช้ตัวย่อ TCA และกติกาหลายข้ออ้างอิง WESPA Rules', src: 'rules' }];
export interface Milestone { year: number; yearBE: number; title: string; text: string; src: { label: string; url: string } }
export const timeline: Milestone[] = [
  { year: 2010, yearBE: 2553, title: 'ไซเบอร์ดิก ร่วมมือกับสมาคม', text: 'ข่าวประชาสัมพันธ์ระบุความร่วมมือระหว่างไซเบอร์ดิกและสมาคม เพื่อจัดการแข่งขันครอสเวิร์ดเกมชิงแชมป์ประเทศไทย', src: { label: 'Sanook Campus', url: 'https://www.sanook.com/campus/924646/' } },
  { year: 2011, yearBE: 2554, title: 'ไซเบอร์ดิก ครอสเวิร์ดเกม ชิงแชมป์ภาคเหนือ ครั้งที่ 14', text: 'การแข่งขัน 6 ประเภท ที่เชียงใหม่ ครอบคลุมครอสเวิร์ดเกม เอแม็ท คำคม และซูโดกุ', src: { label: 'RYT9', url: 'https://www.ryt9.com/s/prg/1060469' } },
  { year: 2016, yearBE: 2559, title: 'แบรนด์เกมส์ กีฬาเพิ่มปัญญา นานาชาติ', text: 'จัดร่วมกับกระทรวงศึกษาธิการและสมาคม รวมการแข่งขันครอสเวิร์ดเกมชิงแชมป์ประเทศไทยและนานาชาติ ชิงถ้วยพระราชทาน ครั้งที่ 31', src: { label: 'Newswit', url: `${NW}iwwftluimb3myscllyjgwseszy98jvhj` } },
  { year: 2017, yearBE: 2560, title: 'อีซีซี พัซเซิล ไทยแลนด์โอเพ่น ครั้งที่ 8 และคำคม ชิงแชมป์ประเทศไทย ครั้งที่ 10', text: 'สถาบันภาษาอีซีซีร่วมกับสมาคมจัดการแข่งขันเกมกีฬาทางวิชาการ รวมรายการ “คำคม” ชิงแชมป์ประเทศไทย', src: { label: 'Newswit', url: `${NW}iwu9uc8ve83wbcu97b2qkh0q7d5zs8ju` } },
  { year: 2018, yearBE: 2561, title: 'แบรนด์เกมส์ กีฬาเพิ่มปัญญา นานาชาติ 2561 และ อีซีซี ครอสเวิร์ดเกมเยาวชนนานาชาติ ครั้งที่ 30', text: 'มหกรรมเกมกีฬาทางปัญญาที่เซ็นทรัลพลาซา เวสต์เกต และการแข่งขันเยาวชนนานาชาติที่เซ็นทรัลพลาซา บางนา (24–25 พ.ย. 2561)', src: { label: 'Newswit', url: `${NW}ihb6oea5trigdihspg04bld7e19ced28` } },
  { year: 2019, yearBE: 2562, title: 'แม็กซ์พลอยส์ ครอสเวิร์ดเกม ชิงแชมป์ภาคเหนือ ครั้งที่ 22 และ แบรนด์ เบรน อินเตอร์เนชั่นแนล ชาเลนจ์ 2019', text: 'ภาคเหนือเปิดแข่งขัน 7 ประเภท ส่วนมหกรรมแบรนด์เกมส์ปี 2562 มีข่าวระบุว่ามีผู้มาร่วมงานต้อนรับกว่า 5,000 คน', src: { label: 'Newswit', url: `${NW}ih5gmbeerixrxboqsen4ja9o00hjypho` } },
  { year: 2023, yearBE: 2566, title: 'Jooze Crossword Game Grandprix Thailand Championship 2023', text: 'การแข่งขันสะสมคะแนนรวม 4 สนาม 3 ประเภทเกม สำหรับนักต่อศัพท์ภาษาอังกฤษ ต่อสมการตัวเลข และถอดรหัสตัวเลข', src: { label: 'Newswit', url: `${NW}ifpa7259t8jmw292maa4kjvo1gshuji5` } },
  { year: 2024, yearBE: 2567, title: 'To Autocar Bangkok International Crossword Game Championship 2024 และ Magnolia Crossword Game Thailand Series ภาคกลาง', text: 'ศึกครอสเวิร์ดนานาชาติ 12–14 ต.ค. 2567 และรายการชิงแชมป์ภาคกลาง 16–17 พ.ย. 2567 ที่ระบุว่าได้รับการรับรองโดยสมาคม', src: { label: 'Newswit', url: `${NW}ifc08d9f50xqgp6ds9xs4xbp28zve97x` } },
  { year: 2025, yearBE: 2568, title: 'Magnolia Crossword Game 2025 · Magnolia Mathsmith National Championship 2025 · To Autocar 2025', text: 'ปี 2568 มีรายการภาคกลาง (5–6 ก.ค. เงินรางวัลรวมกว่า 60,000 บาท) รายการแมทสมิธระดับชาติ (15–17 ส.ค. เงินรางวัลรวมกว่า 100,000 บาท) และรายการนานาชาติ (11–13 ต.ค.) ที่พาราไดซ์ พาร์ค', src: { label: 'Newswit', url: `${NW}iewjpdfc1iw1rnrwws5doad6ebirgs2c` } },
  { year: 2026, yearBE: 2569, title: 'B.Grimm Gamesmith Thailand Championship 2026', text: 'รายการใหญ่แห่งปี 18–19 ก.ค. 2569 ที่พาราไดซ์ พาร์ค ชิงถ้วยพระราชทาน แข่งขัน 3 ประเภท ได้แก่ Wordsmith, Mathsmith และ Thaismith', src: { label: 'The Thai Press', url: 'https://www.thethaipress.com/2026/166901' } }];
export const pending = ['ปีก่อตั้งและประวัติความเป็นมาของสมาคม', 'วิสัยทัศน์ พันธกิจ และวัตถุประสงค์ตามข้อบังคับ', 'รายชื่อนายกสมาคมและกรรมการปัจจุบัน (ข่าวปี 2560–2562 ระบุว่า นายวิโรจน์ ถาวรวัฒนยงค์ เป็นนายกสมาคม ณ ขณะนั้น)', 'ที่อยู่ โทรศัพท์ และอีเมลสำหรับติดต่ออย่างเป็นทางการ', 'สถิติจำนวนสมาชิก นักกีฬา และรายการแข่งขันสะสม'];
