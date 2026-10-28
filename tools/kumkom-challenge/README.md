# โปรแกรม Challenge คำคม (Thai Word Challenge)

โปรแกรมตรวจคำศัพท์ภาษาไทยสำหรับกรรมการ ควบคุมด้วยคีย์บอร์ดทั้งหมด ใช้ฐานคำจาก `database/words.txt` (1 คำต่อบรรทัด, UTF-8)

## วิธีใช้งาน (ผู้ใช้)
1. เปิดโปรแกรม พิมพ์ **จำนวนคำ** ที่ต้องการตรวจ แล้วกด Enter
2. พิมพ์คำทีละคำ กด Enter เพื่อขึ้นบรรทัดใหม่
3. พิมพ์ครบแล้วกด **Tab** เพื่อตรวจ
4. ✓ = มีครบทุกคำ, ✕ = มีอย่างน้อย 1 คำที่ไม่พบ (โปรแกรมไม่บอกว่าคำใด)
5. กดปุ่มใดก็ได้เพื่อเริ่มรอบใหม่ (หรือรอ 7 วินาที) · Esc ที่หน้าพิมพ์คำ = ย้อนกลับ · F11 = เต็มจอ
- รองรับ Windows 10/11 (64-bit) · ไม่ต้องติดตั้ง Python · ไม่ต้องต่ออินเทอร์เน็ต
- ไฟล์ .exe ที่ไม่ได้ลงลายเซ็นดิจิทัล อาจขึ้นหน้าต่างเตือนของ Windows SmartScreen ให้เลือก "ข้อมูลเพิ่มเติม > เรียกใช้อยู่ดี" และโปรแกรมป้องกันไวรัสบางตัวอาจแจ้งเตือนผิดพลาด (false positive) ซึ่งพบได้กับโปรแกรมที่สร้างด้วย PyInstaller

## วิธีสร้างไฟล์ .exe (ผู้ดูแล) — ต้องทำบน Windows เท่านั้น
PyInstaller สร้างไฟล์ได้เฉพาะระบบปฏิบัติการที่รันอยู่ จึง build บน Mac/Linux แล้วได้ไฟล์ .exe ไม่ได้

### วิธี A: เครื่อง Windows
1. ติดตั้ง Python 3.11+ จาก python.org (ติ๊ก "Add python.exe to PATH")
2. ดับเบิลคลิก `build_windows.bat` ในโฟลเดอร์นี้
3. ได้ไฟล์ `dist\ThaiWordChallenge.exe` (ฝัง `database\words.txt` ไว้ข้างในแล้ว)

### วิธี B: GitHub Actions (ไม่ต้องมีเครื่อง Windows)
1. อัปโปรเจกต์ขึ้น GitHub
2. แท็บ **Actions** → เลือก "Build Kumkom Challenge (Windows .exe)" → **Run workflow**
3. เมื่อเสร็จ ดาวน์โหลด artifact `ThaiWordChallenge-windows`

### เผยแพร่บนเว็บไซต์
1. คัดลอก `ThaiWordChallenge.exe` ไปไว้ที่ `public/downloads/ThaiWordChallenge.exe`
2. ใน `src/content/rules/tools.ts` ตั้ง `kumkomExe.available = true` (และแก้ `sizeLabel`/`updated` ให้ตรง)
3. `npm run build` แล้วนำขึ้นโฮสต์

## อัปเดตคำศัพท์
แก้ `database/words.txt` (และไฟล์ `public/dictionary/kumkom-words.txt` ที่ใช้กับตัวตรวจคำบนเว็บ) แล้ว build ใหม่ — ฐานคำถูกฝังใน .exe จึงแก้ในตัวไฟล์ไม่ได้

## หมายเหตุ
- `RBD2026.py` เป็นซอร์สต้นฉบับที่ได้รับมา ไม่ได้แก้ไข
- ไฟล์ `BUILD_EXE.md` และ `build.yml` เดิมอ้างอิงชื่อ `word_judge.py` / `ThaiWordChecker` ซึ่งไม่ตรงกับไฟล์จริง จึงแทนที่ด้วย `build_windows.bat` และ workflow ในโฟลเดอร์ `.github/workflows/`
- สถานะการทดสอบ: ทดสอบการโหลดฐานคำและการตรวจคำด้วย tkinter แบบ headless บน Linux และทดลอง build บน Linux สำเร็จ แต่**ยังไม่ได้ทดสอบ .exe บนเครื่อง Windows จริง**
