# รายงานตรวจสอบฐานโค้ด: งานแก้ไขที่เสนอ (อย่างละ 1 งาน)

เอกสารนี้สรุปงานแก้ไขที่ควรทำ 4 หมวดตามที่ร้องขอ: ข้อความพิมพ์ผิด, บั๊ก, คอมเมนต์/เอกสารคลาดเคลื่อน, และการปรับปรุงการทดสอบ

## 1) งานแก้ไขข้อความที่พิมพ์ผิด (Typo)
- **ปัญหา:** ชื่อแบรนด์ CDN เขียนเป็น `CloudFlare`
- **ตำแหน่ง:** `docs/smartnote-ai-technical-spec-th.md` (ตารางหัวข้อ Infrastructure)
- **งานที่เสนอ:** แก้เป็น `Cloudflare` ให้ตรงกับการสะกดปัจจุบันของแบรนด์
- **ผลลัพธ์ที่คาดหวัง:** เอกสารมีความเป็นมืออาชีพและลดความคลุมเครือด้านการอ้างอิงเทคโนโลยี

## 2) งานแก้ไขบั๊ก (Bug Fix)
- **ปัญหา:** `Planner.generatePlan()` คืนค่า step `create_document` ที่มีแค่ `{ format: 'docx' }` แต่ schema ของเครื่องมือ `create_document` กำหนดว่าต้องมี `title`, `content`, และ `format`
- **ตำแหน่ง:**
  - `src/llm/planner.ts`
  - `src/llm/tool.registry.ts`
- **ความเสี่ยง:** หากนำแผนจาก Planner ไปใช้กับเส้นทางที่ validate ตาม schema (เช่น agent ที่ใช้ function-calling) จะเกิด validation error ได้ทันที
- **งานที่เสนอ:** ปรับ Planner ให้สร้าง payload ของ `create_document` ให้ครบตามสัญญา schema
- **ผลลัพธ์ที่คาดหวัง:** แผนที่สร้างได้สอดคล้องกับ contract ของเครื่องมือ ลดโอกาส runtime failure

## 3) งานแก้ไขคอมเมนต์/เอกสารคลาดเคลื่อน
- **ปัญหา:** ใน Prisma schema ฟิลด์ `Memory.embedding` เป็น `Bytes?` พร้อมคอมเมนต์ว่าเป็น vector จริงจาก SQL migration ขณะที่ใน SQL migration บังคับชนิด `vector(1536)` โดยตรง
- **ตำแหน่ง:**
  - `prisma/schema.prisma`
  - `sql/pgvector_setup.sql`
- **งานที่เสนอ:** ทำให้คำอธิบายชัดเจนขึ้นว่าฝั่ง Prisma เป็น placeholder/type-level compromise และชนิดจริงใน DB คือ pgvector ผ่าน migration หรือปรับโมเดล Prisma ให้ตรงชนิดจริง (ตามแนวทางที่ทีมเลือก)
- **ผลลัพธ์ที่คาดหวัง:** ลดความสับสนของผู้พัฒนาใหม่และลดความเสี่ยง migration ผิดพลาด

## 4) งานปรับปรุงการทดสอบ
- **ช่องว่างที่พบ:** ยังไม่มี test ที่ยืนยันว่า output ของ Planner สอดคล้องกับ `toolArgumentSchemas`
- **งานที่เสนอ:** เพิ่ม contract test 1 ชุดสำหรับ Planner โดยตรวจว่าแต่ละ step ที่สร้างขึ้น parse ผ่าน schema ของ tool ได้จริง
- **เกณฑ์ผ่าน:**
  1. `summarize_note` ผ่าน `summarize_note` schema
  2. `create_document` ผ่าน `create_document` schema
  3. หากมีการเพิ่มเครื่องมือใหม่ในอนาคต ต้องเพิ่มกรณีทดสอบตาม schema ใหม่
- **ผลลัพธ์ที่คาดหวัง:** ป้องกัน regression เชิงสัญญาระหว่าง planner และ tool registry
