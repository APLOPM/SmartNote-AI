# SmartNote AI UX Design System (Thai)

เอกสารนี้สรุปหลักการ UX ระดับระบบสำหรับ SmartNote AI เพื่อให้ทีม Product, Design และ Engineering ใช้เป็น baseline เดียวกันในการออกแบบและพัฒนา UI/UX ที่ต่อเนื่องทั้ง Web และ Mobile

---

## 1) UX Design Principles (System-Level)

### 1.1 Cognitive Load ต่ำ
- ไม่แสดง AI controls ที่ไม่จำเป็นในหน้าหลัก
- ฟีเจอร์ขั้นสูง (Agent tools, RAG context, debug) ต้องซ่อนไว้หลัง `Advanced` toggle

### 1.2 Context Continuity
- ทุกหน้าควรเรียกใช้ AI assistant ได้
- บริบทการทำงานระหว่าง Chat ↔ Editor ↔ Search ควรเชื่อมถึงกัน

### 1.3 AI as Assistant, Not Driver
- AI มีหน้าที่เสนอแผน/ข้อแนะนำก่อน
- ผู้ใช้ต้องยืนยันก่อน execute workflow ที่สำคัญ
- Tool calls ควร inspect ได้ (โปร่งใส)

### 1.4 Latency Transparency
UI ต้องสื่อสถานะชัดเจนระหว่างรอผล เช่น:
- Typing indicator
- Tool running indicator
- Streaming response

### 1.5 Progressive Disclosure
- แสดงข้อมูลที่จำเป็นก่อน
- Insight ขั้นสูง (token usage, source nodes, retrieval score) ให้เปิดดูภายหลังได้

---

## 2) Chat Interface (Core Interaction Layer)

### 2.1 Layout Structure
```text
┌─────────────────────────────────────────┐
│ ← SmartNote AI Assistant        ⚙ ⋯   │
├─────────────────────────────────────────┤
│ Conversation Timeline                  │
│                                         │
│  [User Bubble]                         │
│  [AI Bubble]                           │
│  [Tool Card]                           │
│  [Quick Action Buttons]                │
│                                         │
├─────────────────────────────────────────┤
│  @  📎  🎤  Type message...        ➤   │
└─────────────────────────────────────────┘
```

### 2.2 Chat States (State Machine)
| State | UI Behavior |
|---|---|
| Idle | Input enabled |
| Streaming | AI bubble streaming text |
| ToolExecuting | Tool card with progress |
| AwaitingConfirmation | Confirm/Cancel buttons |
| Error | Retry + Details toggle |

### 2.3 AI Message Types
1. **Plain Response**
   - รองรับ Markdown
   - Bullet lists จัดรูปแบบอัตโนมัติ
2. **Structured Output Card**
   - Action items
   - Task list
   - Table
   - Timeline
   - Email draft
3. **Tool Card (Agent Execution UI)**

```text
┌─────────────────────────────┐
│ 🔧 Creating PowerPoint...   │
│ Step 2 of 4                 │
│ Progress: ███████░░         │
│ [View details]              │
└─────────────────────────────┘
```

รายละเอียดใน detail view:
- Called function
- Parameters
- Status
- Result

### 2.4 Quick Actions Layer
ใต้ AI response ควรมี quick actions เช่น:
- `[✉ Draft Email]`
- `[📅 Create Event]`
- `[🧠 Save as Memory]`

โดย quick action ต้อง trigger ผ่าน structured function-calling

### 2.5 Agent Transparency Toggle
เมนู dropdown ขนาดเล็กสำหรับ:
- View retrieved context
- View embeddings used
- View reasoning summary (**ไม่**เปิด chain-of-thought แบบเต็ม)

### 2.6 Advanced Mode (Power Users)
เมื่อเปิด Advanced mode ให้เห็น:
- Tool console view
- Token usage
- Model used
- Latency metrics
- Retry with different model

---

## 3) Note Editor (AI-Augmented Writing)

### 3.1 Layout
```text
┌─────────────────────────────────────────┐
│ ← Note Title                 ⭐ ⋯      │
├─────────────────────────────────────────┤
│ Tags: #meeting #ai                    │
├─────────────────────────────────────────┤
│ Editor Canvas                         │
│                                       │
│                                       │
│                                       │
│                                       │
│ AI Sidebar (collapsible)              │
└─────────────────────────────────────────┘
```

### 3.2 Editor Capabilities
- Inline AI Suggestion
  - แสดง suggestion สีเทา
  - กด `Tab` เพื่อ accept
- Highlight Actions (เมื่อผู้ใช้เลือกข้อความ)
  - `[Summarize] [Expand] [Rewrite] [Translate] [Generate Tasks]`

### 3.3 AI Sidebar Panel Modes
- Improve writing
- Convert to presentation
- Extract tasks
- Ask about this note
- Generate mind map

### 3.4 Versioning UI
- Version timeline slider
- Show diff view
- Restore option

---

## 4) Dashboard (AI-Orchestrated Overview)

### 4.1 Layout
```text
┌────────────────────────────┐
│ Welcome back, Somchai     │
├────────────────────────────┤
│ Search Bar                │
├────────────────────────────┤
│ Quick Create Buttons      │
├────────────────────────────┤
│ Recent Notes              │
├────────────────────────────┤
│ AI Insights               │
├────────────────────────────┤
│ Smart Folders             │
└────────────────────────────┘
```

### 4.2 AI Insights Module
ตัวอย่าง insight:
- "3 action items overdue"
- "Marketing plan connected to Budget 2026"
- "Meeting transcript ready for review"

ทุก insight ต้อง clickable และเปิดต่อใน Chat context ได้

---

## 5) Search Interface (Hybrid Search UX)

### 5.1 Search Modes
- Keyword
- Semantic
- Hybrid (default)

### 5.2 Result Card Structure
- Note title
- Snippet (highlighted)
- Similarity score (optional toggle)
- Tags
- Last updated

### 5.3 Advanced Search Panel
ตัวกรองที่ควรมี:
- Date
- Tag
- Has attachment
- AI-generated only
- Task only
- Toggle `Exact match only`

### 5.4 RAG Transparency
Optional toggle เพื่ออธิบายผลค้นหา เช่น:
- 2 results via semantic match
- 1 via keyword match

---

## 6) Mind Map View (Graph-Based Knowledge UX)

### 6.1 Interaction Model
- Drag nodes
- Zoom wheel
- Expand children
- Click to open note preview

### 6.2 Node Types
- Main Note
- Sub-topic
- Task
- Linked Note
- External reference

ควรแยกสีแต่ละประเภทอย่างชัดเจน

### 6.3 Export Options
- PNG
- PDF
- Markdown hierarchy
- JSON

---

## 7) Navigation System

### 7.1 Mobile Bottom Navigation
| Icon | Function |
|---|---|
| 🏠 | Dashboard |
| 🔍 | Search |
| 💬 | Chat |
| 📁 | Notes |
| ⚙ | Settings |

### 7.2 Web Sidebar
- Dashboard
- Threads
- Smart Folders
- Shared
- Trash
- Settings

รองรับ collapsible sidebar

---

## 8) Mobile-Specific UX Enhancements

### 8.1 Thumb-Optimized Layout
- Input bar fixed ที่ด้านล่าง
- Primary actions อยู่บริเวณมุมล่างขวา

### 8.2 Voice-First Interaction
- Long press mic → record → auto-transcribe

### 8.3 Offline Mode UI
แสดงสถานะชัดเจน เช่น:
- `⚠ Offline – changes will sync later`
- Queue icon พร้อม pending count

---

## 9) Agent Workflow UX Pattern

Pattern สำหรับงานซับซ้อน:
**User → Agent Plan Preview → Confirm → Execute → Progress → Result**

ตัวอย่าง preview:
```text
I will:
1. Summarize meeting
2. Generate report
3. Draft email

Proceed? [Yes] [Modify]
```

แนวทางนี้ช่วยป้องกัน runaway automation

---

## 10) Visual Design System

### 10.1 Color
- Primary: Neutral modern blue
- Accent: AI highlight purple
- Success: Green
- Warning: Amber
- Error: Red

### 10.2 Typography
- Inter / SF Pro
- Body: 14–16px
- Header: 20–24px

### 10.3 Elevation & Shape
- Soft shadows
- Rounded corners 12–16px
- Minimal gradients

---

## 11) Accessibility
- รองรับ WCAG AA contrast
- Keyboard navigation
- Screen reader friendly labels
- Reduce motion toggle

---

## 12) UX Anti-Patterns to Avoid
- Auto-executing destructive agent actions
- Overloading UI with tool details ตั้งแต่แรก
- Blocking editor ระหว่าง AI process
- บังคับผู้ใช้ให้เข้าฟลู AI-first เสมอ

---

## 13) Future UX Enhancements
- Multi-agent panel (Research Agent / Writing Agent)
- Knowledge Graph mode
- Real-time collaboration cursors
- Agent memory timeline viewer
- AI workload dashboard (enterprise)
