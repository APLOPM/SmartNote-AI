# SmartNote AI UX Design System (Thai)

เอกสารนี้เป็น **Single Source of Truth** สำหรับ Token, Interaction Rules, Accessibility และ AI Safety UX ของ SmartNote AI เพื่อให้ Product, Design, Engineering และ QA ใช้มาตรฐานเดียวกันเสมอ

---


## 0) Bilingual UX Baseline (TH/EN)

เพื่อให้ประสบการณ์ผู้ใช้สม่ำเสมอทั้งภาษาไทยและอังกฤษ:

- Copy สำคัญต้องมีความหมายเทียบเท่ากันในทั้งสองภาษา โดยเฉพาะข้อความเตือน ความเสี่ยง และการยืนยัน
- สถานะระบบและปุ่มคำสั่งหลักต้องอ่านเข้าใจง่ายทั้ง TH/EN
- ทุกการเปลี่ยนแปลง UX ที่กระทบข้อความ ต้องอัปเดตเอกสารและ mockup ควบคู่กัน

## 1) เป้าหมายระบบ UX

1. ลด Cognitive Load และลดความเสี่ยงจาก AI
2. รักษา Context ต่อเนื่องระหว่าง Chat ↔ Editor ↔ Search
3. ทำให้การใช้ AI โปร่งใส ตรวจสอบได้ และยืนยันได้ก่อนทำงานสำคัญ
4. รักษาความเสถียรเชิง UX ด้วย **Standard A** (Safety + Reliability Baseline)

---

## 2) Design Tokens (Global)

> ใช้ token เท่านั้น ห้าม hardcode สี/spacing ใน component ที่ production

### 2.1 Color Tokens

| Token | ค่า | การใช้งาน |
|---|---|---|
| `--color-bg` | `#F6F8FC` | พื้นหลังหลัก |
| `--color-surface` | `#FFFFFF` | Card/Panel |
| `--color-surface-muted` | `#EEF2FF` | Surface รอง |
| `--color-text-primary` | `#0F172A` | ข้อความหลัก |
| `--color-text-secondary` | `#475569` | ข้อความรอง |
| `--color-brand-500` | `#2563EB` | ปุ่มหลัก / ลิงก์ |
| `--color-brand-600` | `#1D4ED8` | Hover ปุ่มหลัก |
| `--color-ai-accent` | `#7C3AED` | AI Highlight |
| `--color-success` | `#16A34A` | สถานะสำเร็จ |
| `--color-warning` | `#D97706` | คำเตือน |
| `--color-danger` | `#DC2626` | Error/Destructive |
| `--color-border` | `#CBD5E1` | เส้นขอบ |
| `--color-focus` | `#38BDF8` | Focus ring |

### 2.2 Typography Tokens

- `--font-family-base`: `Inter, "Noto Sans Thai", system-ui, sans-serif`
- `--font-size-xs`: `12px`
- `--font-size-sm`: `14px`
- `--font-size-md`: `16px`
- `--font-size-lg`: `20px`
- `--font-size-xl`: `24px`
- `--line-height-body`: `1.6`
- `--line-height-heading`: `1.3`

### 2.3 Spacing / Radius / Shadow Tokens

- Spacing scale: `4, 8, 12, 16, 20, 24, 32`
- Radius: `8, 12, 16, 9999`
- Shadow:
  - `--shadow-soft`: `0 8px 24px rgba(15, 23, 42, 0.08)`
  - `--shadow-elevated`: `0 16px 30px rgba(15, 23, 42, 0.14)`

### 2.4 Motion Tokens

- `--motion-fast`: `120ms`
- `--motion-base`: `180ms`
- `--motion-slow`: `280ms`
- Easing มาตรฐาน: `cubic-bezier(.2,.8,.2,1)`
- ต้องรองรับ `prefers-reduced-motion`

---

## 3) UX Rules (System Rules)

### 3.1 Rule: AI ต้องไม่ทำงานเสี่ยงโดยอัตโนมัติ
- งานที่กระทบข้อมูล/การแชร์/การลบ ต้องมีขั้น Confirm
- ปุ่มยืนยันต้องไม่เป็นค่า default ที่เผลอกดง่าย

### 3.2 Rule: โปร่งใสแต่ไม่ overload
- แสดงสถานะ `Thinking / Tool Running / Completed / Failed`
- รายละเอียดระดับลึก (tool args, score) ให้ซ่อนหลัง toggle

### 3.3 Rule: Context Continuity
- จากผลค้นหาและจากโน้ต ต้องส่งต่อเข้า AI Chat ได้ทันที
- ทุก AI action ต้องบอกว่ากำลังใช้ context จากส่วนใด

### 3.4 Rule: Recoverability
- ทุก error state ต้องมี `Retry` และข้อความที่มนุษย์อ่านเข้าใจ
- ห้ามเจอ dead-end screen

### 3.5 Rule: Accessibility First
- WCAG AA contrast ขั้นต่ำ
- Keyboard-first focus order
- Touch target ขั้นต่ำ 44x44px

---

## 4) AI Safety UX Standard A (บังคับใช้ขั้นต่ำ)

### 4.1 มาตรฐานที่ต้องเห็นใน UI
1. **Risk Notice** เมื่อ AI เรียกใช้เครื่องมือหรือบริบทสำคัญ
2. **Source Transparency** แสดงแหล่งที่มา/คะแนนความเกี่ยวข้องแบบย่อ
3. **Human Confirmation** ก่อน execute action สำคัญ
4. **Policy Surface** มีพื้นที่บอก policy และผลบล็อก
5. **Audit Clarity** ผู้ใช้เห็นว่า action ใดถูกเรียกด้วยพารามิเตอร์อะไร

> Baseline marker: **Risk Notice / Human Confirmation / Audit Clarity** ต้องพบได้เสมอใน UI และเอกสารที่เกี่ยวข้อง

### 4.2 Checklist ก่อนปล่อยงาน
- มี loading state และ error state ครบ
- ไม่มี destructive auto-run
- README และ CI ระบุ UX baseline docs ครบ
- เอกสาร mockup (editor/search) อัปเดตตาม token ล่าสุด

---

## 5) Component Contracts

### 5.1 AI Response Card
ต้องมี:
- หัวข้อผลลัพธ์
- เนื้อหาสรุป
- สถานะแหล่งข้อมูล (`context badges`)
- Quick Actions (`Refine`, `Open Source`, `Save as Note`)

### 5.2 Tool Execution Card
ต้องมี:
- Tool Name
- Progress
- Current step
- `View details`
- `Cancel` (ถ้ายกเลิกได้)

### 5.3 Confirmation Dialog
ต้องมี:
- เหตุผลที่ต้องยืนยัน
- ผลกระทบของการยืนยัน
- ปุ่ม `ยืนยัน` และ `ยกเลิก` ชัดเจน

---

## 6) Editor UX Baseline

- มี AI Assistant ฝังด้านข้าง (collapsible)
- มี inline suggestion + accept ผ่านคีย์ลัด
- มี quick action จากข้อความที่เลือก
- มี safety strip เมื่อใช้ external context

---

## 7) Semantic Search UX Baseline

- รองรับ `Keyword / Semantic / Hybrid`
- มี smart answer + citation preview
- มี panel อธิบายเหตุผลการแมตช์ (why this result)
- มีตัวกรองด้านความปลอดภัย (sensitive/source scope)

---


## 8) Conversational Onboarding Baseline (TH/EN)

### 8.1 Progressive Disclosure
- ช่วงแรกของบทสนทนาให้ตอบสั้น กระชับ และโฟกัส **ผลลัพธ์ที่ผู้ใช้จะได้ (Benefit-first)** มากกว่าการอธิบายเทคโนโลยี
- หากผู้ใช้ต้องการรายละเอียดเชิงเทคนิค ค่อยเปิดเผยรายละเอียดเพิ่มเป็นลำดับชั้น
- English baseline: start with concise, benefit-first responses before exposing implementation details.

### 8.2 Contextual Awareness (Re-engagement 2-3 days)
- หากระบบตรวจพบว่าผู้ใช้ไม่ได้เข้าใช้งาน 2-3 วัน เมื่อผู้ใช้กลับมาให้สรุปงานค้างทันทีแบบสั้น
- ตัวอย่าง TH: `ยินดีที่ได้พบกันอีกครั้งครับ เมื่อวันก่อนเราค้างเรื่องแผนการตลาด Q3 ไว้ คุณอยากดูต่อไหมครับ?`
- Example EN: `Welcome back. Last time we paused on the Q3 marketing plan—would you like to continue from there?`
- ต้องเปิดโอกาสให้ผู้ใช้ข้าม/เปลี่ยนหัวข้อได้ทันที

### 8.3 Privacy Assurance (Standard A Trust Line)
- ตอนท้าย onboarding ต้องมีข้อความยืนยันความเป็นส่วนตัวอย่างน้อยหนึ่งบรรทัด
- ข้อความบังคับ TH: `ข้อมูลของคุณปลอดภัยและเป็นส่วนตัวที่สุด ผมจะเรียนรู้และเติบโตไปพร้อมกับคุณคนเดียวเท่านั้นครับ`
- Required EN equivalent: `Your data is secure and private. I learn and improve only for your experience.`
- ข้อความนี้ต้องแสดงใน flow เริ่มต้นใช้งานและถูกทดสอบโดย CI marker

---

## 9) Governance

หากแก้ token หรือ interaction rule ต้องอัปเดตพร้อมกันทั้ง:
1. `docs/editor-ui-mockup.html`
2. `docs/smartnote-serene-search-mockup.html`
3. `README.md` ส่วน UX baseline
4. CI gate ที่เกี่ยวข้อง
5. ข้อกำหนด Conversational Onboarding (TH/EN) และ Privacy Assurance

