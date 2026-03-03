# รายงานตรวจสอบฐานโค้ด: ข้อเสนอแก้ไขอย่างละ 1 งาน

เอกสารนี้สรุปปัญหาที่ตรวจพบจากโค้ดปัจจุบัน พร้อม “งานที่ควรทำ” อย่างละ 1 งานตามที่ร้องขอ: พิมพ์ผิด, บั๊ก, คอมเมนต์/เอกสารคลาดเคลื่อน, และการทดสอบ

## 1) งานแก้ไขข้อความที่พิมพ์ผิด (Typo)
- **ปัญหา:** ชื่อผู้ให้บริการ CDN เขียนเป็น `CloudFlare`
- **หลักฐาน:** ในตารางเทคโนโลยีของสเปกภาษาไทยระบุ `CloudFlare`
- **ตำแหน่ง:** `docs/smartnote-ai-technical-spec-th.md`
- **งานที่เสนอ:** เปลี่ยนเป็น `Cloudflare`
- **เกณฑ์เสร็จงาน:** ไม่พบคำว่า `CloudFlare` ในเอกสารสเปก

## 2) งานแก้ไขบั๊ก (Bug Fix)
- **ปัญหา:** `Planner.generatePlan()` สร้าง step `create_document` ด้วย input ไม่ครบ contract
- **หลักฐาน:**
  - `src/llm/planner.ts` ส่ง `{ format: 'docx' }`
  - `src/llm/tool.registry.ts` กำหนด `create_document` ต้องมี `title`, `content`, `format`
- **ผลกระทบ:** เมื่อเชื่อมกับเส้นทางที่ validate argument ตาม schema จะเกิด validation error runtime
- **งานที่เสนอ:** ปรับ planner ให้สร้าง payload ที่ครบฟิลด์บังคับ (อย่างน้อย `title`, `content`, `format`)
- **เกณฑ์เสร็จงาน:** step `create_document` ที่ planner คืนค่า parse ผ่าน schema ของ `toolArgumentSchemas.create_document`

## 3) งานแก้ไขคอมเมนต์/เอกสารคลาดเคลื่อน
- **ปัญหา:** Prisma model ระบุ `Memory.embedding` เป็น `Bytes?` พร้อมคอมเมนต์ว่า vector จริงมาจาก SQL migration ขณะที่ migration กำหนดเป็น `vector(1536)` โดยตรง
- **หลักฐาน:**
  - `prisma/schema.prisma` ใช้ `embedding Bytes?`
  - `sql/pgvector_setup.sql` บังคับชนิดคอลัมน์เป็น `vector(1536)`
- **งานที่เสนอ:** เพิ่มคำอธิบายใน schema/doc ให้ชัดเจนว่าทำไม Prisma กับ DB type จึงต่างกัน และแนวทางใช้งานที่ถูกต้อง
- **เกณฑ์เสร็จงาน:** มีข้อความอธิบายที่ชัดเจนในจุดเดียวที่ทีมใช้เป็นแหล่งอ้างอิงหลัก (single source of truth)

## 4) งานปรับปรุงการทดสอบ
- **ช่องว่าง:** ยังไม่มี automated test ที่ตรวจความสอดคล้องระหว่าง output ของ planner กับ tool schemas
- **งานที่เสนอ:** เพิ่ม contract test ของ planner 1 ชุด
- **ขอบเขตทดสอบขั้นต่ำ:**
  1. ทุก step ที่ planner สร้างต้องเป็น tool ที่รองรับจริง
  2. input ของแต่ละ step ต้อง parse ผ่าน schema ของ tool นั้น
  3. เคส `create_document` ต้องมี `title`, `content`, `format`
- **เกณฑ์เสร็จงาน:** test fail เมื่อ planner คืน payload ไม่ตรง schema และ pass เมื่อแก้ครบ

## หมายเหตุการจัดลำดับความสำคัญ
1. **บั๊ก planner/schema mismatch** (กระทบ runtime โดยตรง)
2. **เพิ่ม contract test** (ป้องกัน regression)
3. **เอกสาร/คอมเมนต์คลาดเคลื่อน** (ลดความสับสนระยะยาว)
4. **typo** (ความถูกต้องเชิงเอกสาร)
