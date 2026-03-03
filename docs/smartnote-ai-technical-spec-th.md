# SmartNote AI – สมุดบันทึกอัจฉริยะ

| เวอร์ชัน | วันที่แก้ไข | ผู้จัดทำ | รายละเอียดการแก้ไข |
|---|---|---|---|
| 1.0 | 3 มีนาคม 2026 | ทีมพัฒนา | สร้างเอกสารฉบับสมบูรณ์ |

---

## สารบัญ

1. [บทนำ](#1-บทนำ)
2. [ภาพรวมสถาปัตยกรรมระบบ](#2-ภาพรวมสถาปัตยกรรมระบบ)
3. [เทคโนโลยีและเครื่องมือที่ใช้](#3-เทคโนโลยีและเครื่องมือที่ใช้)
4. [โครงสร้างระบบย่อย (Subsystems)](#4-โครงสร้างระบบย่อย-subsystems)
5. [การออกแบบฐานข้อมูล](#5-การออกแบบฐานข้อมูล)
6. [API และการเชื่อมต่อ](#6-api-และการเชื่อมต่อ)
7. [ความปลอดภัยของระบบ](#7-ความปลอดภัยของระบบ)
8. [ข้อกำหนดด้านประสิทธิภาพ](#8-ข้อกำหนดด้านประสิทธิภาพ)
9. [แผนการพัฒนาและการส่งมอบ](#9-แผนการพัฒนาและการส่งมอบ)
10. [ภาคผนวก](#10-ภาคผนวก)
11. [AI Agent Architecture](#11-ai-agent-architecture)
12. [Implementation Roadmap for AI Agent](#12-implementation-roadmap-for-ai-agent)
13. [KPI สำหรับ AI Agent](#13-kpi-สำหรับ-ai-agent)
14. [ความเสี่ยงและการควบคุม](#14-ความเสี่ยงและการควบคุม)

---

## 1. บทนำ

### 1.1 ที่มาและความสำคัญ

SmartNote AI ถูกพัฒนาขึ้นเพื่อแก้ปัญหาการจัดการข้อมูลและความคิดที่กระจัดกระจาย โดยใช้เทคโนโลยีปัญญาประดิษฐ์ช่วยเพิ่มประสิทธิภาพในการจดบันทึก เขียนเอกสาร และเชื่อมโยงข้อมูลอย่างชาญฉลาด

### 1.2 วัตถุประสงค์

- พัฒนาแอปพลิเคชันข้ามแพลตฟอร์มที่รองรับการจดบันทึกหลายรูปแบบ
- ผสาน AI ในการประมวลผลภาษา เสียง และภาพ
- สร้างระบบจัดการข้อมูลอัจฉริยะที่เรียนรู้พฤติกรรมผู้ใช้
- รองรับการทำงานแบบเรียลไทม์และออฟไลน์

### 1.3 ขอบเขตของระบบ

- **Frontend:** แอปพลิเคชันบน iOS, Android และ Web Application
- **Backend:** RESTful API และ Microservices
- **AI Services:** โมเดลประมวลผลภาษา เสียง และภาพ
- **Storage:** ระบบจัดเก็บข้อมูลบนคลาวด์และการซิงค์ออฟไลน์

---

## 2. ภาพรวมสถาปัตยกรรมระบบ

### 2.1 สถาปัตยกรรมระดับสูง (High-Level Architecture)

```text
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Client Layer  │────▶│   API Gateway    │────▶│  Microservices  │
│ - iOS App       │     │ - Authentication │     │ - User Service  │
│ - Android App   │     │ - Rate Limiting  │     │ - Note Service  │
│ - Web App       │     │ - Request Routing│     │ - AI Service    │
└─────────────────┘     └──────────────────┘     │ - Sync Service  │
                                                    └────────┬────────┘
                                                             │
                                                    ┌────────▼────────┐
                                                    │   Data Layer    │
                                                    │ - PostgreSQL    │
                                                    │ - MongoDB       │
                                                    │ - Redis Cache   │
                                                    │ - Object Storage│
                                                    └─────────────────┘
```

### 2.2 รูปแบบสถาปัตยกรรม

- **Microservices Architecture:** แบ่งระบบเป็นบริการย่อยอิสระ
- **Event-Driven Architecture:** ใช้ Message Queue (RabbitMQ/Kafka) สำหรับการสื่อสารระหว่างบริการ
- **Offline-First Architecture:** ข้อมูลถูกเก็บในเครื่องก่อน แล้วค่อยซิงค์กับเซิร์ฟเวอร์

---

## 3. เทคโนโลยีและเครื่องมือที่ใช้

### 3.1 Frontend

| แพลตฟอร์ม | เทคโนโลยีหลัก | เหตุผลในการเลือก |
|---|---|---|
| iOS | SwiftUI + UIKit | รองรับฟีเจอร์ Core ML และ PencilKit |
| Android | Kotlin + Jetpack Compose | รองรับ ML Kit และการเขียนด้วยปากกา |
| Web | React + TypeScript | Performance สูง, ecosystem ใหญ่ |
| Cross-platform logic | Rust (WebAssembly) | แชร์โค้ดประมวลผลระหว่างแพลตฟอร์ม |

### 3.2 Backend

| บริการ | เทคโนโลยี | รายละเอียด |
|---|---|---|
| API Gateway | Nginx + Kong | จัดการ route, authentication |
| User Service | Node.js + Express | จัดการผู้ใช้และสิทธิ์ |
| Note Service | Go (Gin) | Performance สูง, concurrent users |
| AI Orchestrator | Python (FastAPI) | เชื่อมต่อ AI models |
| Sync Service | Elixir (Phoenix) | Real-time sync, WebSocket |
| Message Queue | RabbitMQ | จัดการ event ระหว่าง services |
| Container | Docker + Kubernetes | จัดการ deployment และ scaling |

### 3.3 ฐานข้อมูล

| ระบบ | ประเภท | การใช้งาน |
|---|---|---|
| PostgreSQL | Relational | ข้อมูลผู้ใช้, metadata, สิทธิ์ |
| MongoDB | NoSQL | เนื้อหาบันทึก (flexible schema) |
| Redis | In-memory | Cache, session, real-time data |
| MinIO / S3 | Object Storage | รูปภาพ, เสียง, ไฟล์แนบ |

### 3.4 AI และ Machine Learning

| งาน | เทคโนโลยี | โมเดล/API |
|---|---|---|
| NLP (หลัก) | OpenAI API / Self-hosted LLM | GPT-4 / Llama 3 |
| Speech-to-Text | Whisper API / Faster-Whisper | Real-time transcription |
| OCR | Tesseract + Google ML Kit | Text extraction from images |
| Handwriting Recognition | MyScript / Apple PencilKit | ลายมือเป็นข้อความ |
| Semantic Search | Pinecone / Weaviate | Vector database |
| Recommendation | TensorFlow / PyTorch | Collaborative filtering |
| Speaker Diarization | pyannote.audio | ระบุผู้พูดในการประชุม |

### 3.5 โครงสร้างพื้นฐาน (Infrastructure)

| องค์ประกอบ | เทคโนโลยี | รายละเอียด |
|---|---|---|
| Cloud Provider | AWS / Google Cloud / Azure | Multi-region support |
| Container Orchestration | Kubernetes (EKS/GKE/AKS) | Auto-scaling |
| CI/CD | GitLab CI / GitHub Actions | Automated testing & deployment |
| Monitoring | Prometheus + Grafana | System metrics |
| Logging | ELK Stack | Log aggregation |
| CDN | CloudFlare | เนื้อหา static, รูปภาพ |

---

## 4. โครงสร้างระบบย่อย (Subsystems)

### 4.1 User Service

หน้าที่: จัดการบัญชีผู้ใช้ การยืนยันตัวตน และโปรไฟล์

**API Endpoints**

- `POST /api/v1/auth/register` - สมัครสมาชิก
- `POST /api/v1/auth/login` - เข้าสู่ระบบ
- `POST /api/v1/auth/refresh` - ต่ออายุ token
- `GET /api/v1/users/profile` - ดูโปรไฟล์
- `PUT /api/v1/users/profile` - แก้ไขโปรไฟล์
- `DELETE /api/v1/users/account` - ลบบัญชี

**Database Schema (PostgreSQL)**

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    avatar_url TEXT,
    subscription_tier VARCHAR(50) DEFAULT 'free',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    last_login TIMESTAMP,
    settings JSONB
);

CREATE TABLE sessions (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    refresh_token TEXT UNIQUE,
    device_info JSONB,
    expires_at TIMESTAMP,
    created_at TIMESTAMP
);
```

### 4.2 Note Service

หน้าที่: จัดการบันทึก เนื้อหา metadata และการค้นหา

**API Endpoints**

- `GET /api/v1/notes`
- `POST /api/v1/notes`
- `GET /api/v1/notes/{id}`
- `PUT /api/v1/notes/{id}`
- `DELETE /api/v1/notes/{id}`
- `POST /api/v1/notes/{id}/share`
- `GET /api/v1/notes/search?q=`

**Database Schema (MongoDB)**

```javascript
// notes collection
{
  "_id": ObjectId,
  "user_id": UUID,
  "title": String,
  "content": {
    "type": String,
    "data": Mixed,
    "embeddings": [Float]
  },
  "tags": [String],
  "folder_id": ObjectId,
  "attachments": [
    {
      "type": String,
      "url": String,
      "metadata": Object
    }
  ],
  "ai_metadata": {
    "summary": String,
    "keywords": [String],
    "entities": [Object],
    "sentiment": String,
    "language": String
  },
  "version": Number,
  "is_archived": Boolean,
  "is_favorite": Boolean,
  "created_at": ISODate,
  "updated_at": ISODate,
  "deleted_at": ISODate
}
```

### 4.3 AI Orchestrator Service

หน้าที่: ประสานงานการทำงานของ AI models ต่างๆ

**API Endpoints**

- `POST /api/v1/ai/process-text`
- `POST /api/v1/ai/generate`
- `POST /api/v1/ai/summarize`
- `POST /api/v1/ai/transcribe`
- `POST /api/v1/ai/extract-text`
- `POST /api/v1/ai/suggest-tags`
- `POST /api/v1/ai/connect-notes`

**Workflow ตัวอย่าง: การบันทึกเสียง**

1. Client อัปโหลดไฟล์เสียง → AI Orchestrator
2. ส่งไฟล์ไปยัง Speech-to-Text service (Whisper)
3. ได้ข้อความ transcript + speaker diarization
4. ส่ง transcript ไปยัง NLP service เพื่อสรุป/ดึงคำสำคัญ/วิเคราะห์อารมณ์
5. บันทึกผลลัพธ์ลงฐานข้อมูล
6. สร้าง vector embeddings สำหรับ semantic search
7. ส่ง notification กลับไปยัง client

### 4.4 Sync Service

หน้าที่: จัดการการซิงค์ข้อมูลระหว่างอุปกรณ์

- WebSocket สำหรับ real-time sync
- Conflict Resolution ใช้ CRDT หรือ Last-Write-Wins
- Offline Queue ผ่าน IndexedDB/SQLite

```json
{
  "client_id": "device-uuid",
  "last_sync": "2026-03-03T10:00:00Z",
  "changes": [
    {
      "note_id": "uuid",
      "operation": "create|update|delete",
      "data": {},
      "timestamp": "2026-03-03T10:05:00Z",
      "version": 3
    }
  ]
}
```

### 4.5 Collaboration Service

หน้าที่: จัดการการทำงานร่วมกันแบบเรียลไทม์

- WebSocket + OT หรือ CRDTs
- แสดง cursor/selection
- version history
- comments และ mentions

---

## 5. การออกแบบฐานข้อมูล

### 5.1 Entity-Relationship Diagram

```text
┌─────────┐       ┌────────────┐       ┌─────────┐
│  users  │───────│    notes   │───────│ folders │
└─────────┘       └────────────┘       └─────────┘
     │                   │
     ▼                   ▼
┌─────────┐       ┌────────────┐
│shares   │       │ attachments│
└─────────┘       └────────────┘
     │                   │
     ▼                   ▼
┌─────────┐       ┌────────────┐
│comments │       │   tags     │
└─────────┘       └────────────┘
```

### 5.2 ตารางหลัก (PostgreSQL)

```sql
CREATE TABLE tags (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    name VARCHAR(50),
    color VARCHAR(7),
    created_at TIMESTAMP,
    UNIQUE(user_id, name)
);

CREATE TABLE notes_tags (
    note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (note_id, tag_id)
);

CREATE TABLE shares (
    id UUID PRIMARY KEY,
    note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
    shared_by UUID REFERENCES users(id),
    shared_with_email VARCHAR(255),
    permission VARCHAR(20),
    share_token VARCHAR(100) UNIQUE,
    expires_at TIMESTAMP,
    created_at TIMESTAMP
);

CREATE TABLE comments (
    id UUID PRIMARY KEY,
    note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    parent_id UUID REFERENCES comments(id),
    content TEXT,
    position JSONB,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### 5.3 Vector Database (Pinecone/Weaviate)

```python
{
  "id": "note_uuid",
  "values": [0.1, 0.2, ...],
  "metadata": {
    "user_id": "uuid",
    "title": "string",
    "tags": ["tag1", "tag2"],
    "created_at": "timestamp",
    "note_type": "text|audio|image"
  }
}
```

---

## 6. API และการเชื่อมต่อ

### 6.1 รูปแบบ API

- RESTful API สำหรับ CRUD
- GraphQL (optional)
- WebSocket สำหรับ real-time

### 6.2 Authentication

- JWT
- OAuth 2.0
- Refresh token rotation

### 6.3 ตัวอย่าง API Request/Response

```http
POST /api/v1/notes
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "title": "ประชุมทีมพัฒนา 3 มี.ค.",
  "content": {
    "type": "text",
    "data": "วันนี้เราคุยเรื่องฟีเจอร์ใหม่สำหรับ SmartNote AI..."
  },
  "attachments": [],
  "tags": ["ประชุม", "พัฒนา"],
  "enable_ai_processing": true
}
```

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "ประชุมทีมพัฒนา 3 มี.ค.",
  "content": {},
  "ai_metadata": {
    "summary": "ประชุมเพื่อวางแผนฟีเจอร์ AI Writing Assistant และกำหนด timeline",
    "keywords": ["AI", "ฟีเจอร์ใหม่", "timeline"],
    "action_items": [
      "ออกแบบ UX สำหรับ AI writing assistant",
      "ทดสอบ OCR กับเอกสารภาษาไทย"
    ],
    "sentiment": "positive"
  },
  "created_at": "2026-03-03T14:30:00Z"
}
```

---

## 7. ความปลอดภัยของระบบ

### 7.1 การเข้ารหัสข้อมูล

- Data at rest: AES-256
- Data in transit: TLS 1.3
- End-to-end encryption (optional)

### 7.2 การควบคุมการเข้าถึง

- RBAC
- Row-Level Security
- API Rate Limiting

### 7.3 ความปลอดภัยของ AI

- PII Detection
- Content Moderation
- Prompt Injection Protection

### 7.4 การปฏิบัติตามมาตรฐาน

- GDPR / PDPA
- SOC2 Type II
- HIPAA (optional)

---

## 8. ข้อกำหนดด้านประสิทธิภาพ

### 8.1 เป้าหมายประสิทธิภาพ

| Metric | เป้าหมาย |
|---|---|
| API Response Time (p95) | < 200ms |
| AI Processing Time (text) | < 3 วินาที |
| AI Processing Time (audio 1 นาที) | < 10 วินาที |
| Sync Latency | < 2 วินาที |
| Uptime | 99.9% |
| Concurrent Users per Server | 10,000+ |
| Search Query Time | < 500ms |

### 8.2 การขยายระบบ (Scalability)

- Horizontal scaling
- Database sharding ตาม `user_id`
- Caching: Redis + CDN + Client cache

### 8.3 การจัดการ Offline

- Local DB: IndexedDB / SQLite
- Queue สำหรับ pending changes
- Conflict resolution ผ่าน UI

---

## 9. แผนการพัฒนาและการส่งมอบ

### 9.1 ระยะที่ 1: MVP (3 เดือน)

- Authentication
- CRUD note พื้นฐาน
- Tags
- Sync ข้ามอุปกรณ์
- Search พื้นฐาน

### 9.2 ระยะที่ 2: AI Integration (2 เดือน)

- แก้ไขภาษา/ตรวจคำผิด
- ถอดเสียงเป็นข้อความ
- OCR จากรูปภาพ
- แนะนำแท็กอัตโนมัติ
- Semantic search

### 9.3 ระยะที่ 3: Advanced Features (2 เดือน)

- สร้างเอกสารจากหัวข้อ
- สรุปเนื้อหาอัตโนมัติ
- แปลงเป็นผังความคิด
- เชื่อมโยงบันทึกที่เกี่ยวข้อง
- Real-time collaboration

### 9.4 ระยะที่ 4: Enterprise & Scaling (2 เดือน)

- SSO และ enterprise features
- Developer API
- Advanced analytics
- Multi-region deployment

---

## 10. ภาคผนวก

### 10.1 Glossary

| คำศัพท์ | ความหมาย |
|---|---|
| CRDT | Conflict-free Replicated Data Type |
| OT | Operational Transformation |
| Vector Embedding | การแปลงข้อความเป็นเวกเตอร์สำหรับ semantic search |
| Speaker Diarization | การระบุว่าใครพูดตอนไหน |
| PII | Personally Identifiable Information |

### 10.2 การติดตั้งและพัฒนาเบื้องต้น

```bash
git clone https://github.com/company/smartnote-ai.git

cd backend
docker-compose up -d

cd frontend/web
npm install
npm run dev

cd frontend/ios
pod install
open SmartNote.xcworkspace
```

### 10.3 Environment Variables ตัวอย่าง

```env
JWT_SECRET=your-secret-key
REFRESH_TOKEN_SECRET=another-secret
DATABASE_URL=postgresql://user:pass@localhost:5432/smartnote
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=sk-...
WHISPER_API_KEY=...
PINECONE_API_KEY=...
PINECONE_ENVIRONMENT=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=smartnote-uploads
```

---

## 11. AI Agent Architecture

### 11.1 วัตถุประสงค์ของ AI Agent

AI Agent เป็นระบบที่สามารถ:

- วิเคราะห์บริบทจากบันทึกผู้ใช้ (Context-Aware)
- วางแผนการทำงานแบบหลายขั้นตอน (Multi-step Planning)
- เรียกใช้เครื่องมือ (Tool Use / Function Calling)
- จัดการ workflow อัตโนมัติจนจบกระบวนการ

### 11.2 ตำแหน่งในสถาปัตยกรรมระบบ

```text
Client
  │
  ▼
AI Orchestrator (Agent Mode)
  │
  ├── Planner (LLM)
  ├── Tool Executor
  ├── Memory Store (Redis)
  ├── RAG Retriever
  └── Result Composer
```

### 11.3 Agent Execution Flow

1. **Context Gathering**: MongoDB + Vector DB + Redis
2. **Planning Phase**: LLM สร้าง structured plan
3. **Tool Invocation Loop**: เรียก tools ตาม schema และวนจน task สำเร็จ

```python
while not task_completed:
    response = llm(context, available_tools)
    if response.tool_call:
        result = execute_tool(response.tool_call)
        context.append(result)
    else:
        task_completed = True
```

### 11.4 Tool Registry Design

#### 11.4.1 Internal Tools

| Tool | Description |
|---|---|
| summarize_note | สรุปเนื้อหา |
| semantic_search | ค้นหาบันทึกที่เกี่ยวข้อง |
| create_note | สร้างบันทึกใหม่ |
| update_note | แก้ไขบันทึก |

#### 11.4.2 Productivity Tools

| Tool | Description |
|---|---|
| create_word_doc | สร้างไฟล์ .docx |
| generate_ppt | สร้างสไลด์ |
| create_excel | สร้างไฟล์ Excel |
| create_calendar_event | สร้าง event |
| send_email | ส่งอีเมล |

#### 11.4.3 External Intelligence Tools

| Tool | Description |
|---|---|
| web_search | ค้นข้อมูลออนไลน์ |
| execute_python | วิเคราะห์ข้อมูล |
| currency_lookup | อัตราแลกเปลี่ยน |
| translate | แปลภาษา |

### 11.5 Memory Architecture

1. **Short-term memory**: Redis (24 ชม.)
2. **Long-term semantic memory**: embeddings ใน Vector DB
3. **Structured task memory**: workflow state สำหรับ resume task

### 11.6 Agent Modes

1. **Quick Action Mode**: งานสั้น (3–5 steps)
2. **Deep Workflow Mode**: งานซับซ้อน (20+ steps)
3. **Autonomous Mode (Optional Premium)**: background execution

### 11.7 Prompt Engineering Strategy

```text
You are SmartNote AI Agent.
Your job is to:
1. Analyze context carefully
2. Create a structured plan
3. Call tools only when necessary
4. Validate outputs before proceeding
5. Stop when goal is achieved
```

Constraints:

- ห้าม hallucinate tool
- ต้องเรียก tool ตาม schema เท่านั้น
- ตรวจสอบผลลัพธ์ก่อน step ถัดไป
- จำกัด recursive depth

### 11.8 Cost Optimization Strategy

| Strategy | Description |
|---|---|
| Model routing | งานง่ายใช้ Lightning |
| Token trimming | สรุป context ก่อนส่งเข้า LLM |
| Step limiter | จำกัด max step ต่อ workflow |
| Caching | Cache tool results ที่ซ้ำ |

ต้นทุนคาดการณ์: `~0.8–1.2 USD / 1 ชั่วโมง agent execution` และลดได้ `40%` ด้วย context compression

### 11.9 Security Considerations for Agent

1. Tool Sandboxing
2. Prompt Injection Protection
3. PII Filtering

### 11.10 Competitive Advantage Analysis

| Feature | Notion AI | Evernote | SmartNote AI Agent |
|---|---:|---:|---:|
| Multi-step execution | ❌ | ❌ | ✅ |
| Tool calling | จำกัด | ❌ | ✅ |
| Auto workflow | ❌ | ❌ | ✅ |
| Semantic memory | จำกัด | จำกัด | Advanced |
| Cost optimization | สูง | - | ต่ำกว่า |

---

## 12. Implementation Roadmap for AI Agent

### Phase 1: Agent Core (4 สัปดาห์)

- Tool registry
- Planning loop
- Memory layer
- Basic workflow (summarize + create doc)

### Phase 2: Productivity Integration (4 สัปดาห์)

- Email
- Calendar
- Document generation
- Excel automation

### Phase 3: Advanced Intelligence (6 สัปดาห์)

- Autonomous triggers
- Multi-agent coordination
- Long-running task orchestration

---

## 13. KPI สำหรับ AI Agent

| Metric | Target |
|---|---|
| Task Completion Rate | > 85% |
| Average Steps per Task | < 8 |
| User Time Saved | > 40% |
| Failure Recovery Rate | > 90% |
| Agent Cost per Active User | < $3/month |

---

## 14. ความเสี่ยงและการควบคุม

| Risk | Mitigation |
|---|---|
| Infinite loop | Max step limit |
| Tool misuse | Strict schema validation |
| Hallucinated results | Tool result verification |
| High token cost | Context summarization |
| Privacy leakage | PII masking + audit logs |

---

## บทสรุปเชิงกลยุทธ์

AI Agent จะเปลี่ยน SmartNote AI จาก “แอปจดบันทึกที่มี AI ช่วยเขียน” เป็น “AI Productivity Operating System” โดยมีจุดขายหลักคือการทำงานแทนผู้ใช้ เชื่อม workflow จริง ลดเวลาทำงานเอกสาร 30–60% และรองรับตลาดองค์กรในระยะต่อไป

---

จัดทำโดย: ทีมพัฒนา SmartNote AI  
วันที่อนุมัติ: 3 มีนาคม 2026  
สถานะ: ฉบับร่างเพื่อการพัฒนา
