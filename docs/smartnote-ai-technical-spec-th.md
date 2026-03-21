# SmartNote AI – Technical Specification (TH)

**เวอร์ชัน:** 2.0  
**วันที่อัปเดต:** 21 มีนาคม 2026  
**สถานะ:** Advanced Architecture Baseline  
**ผู้จัดทำ:** ทีมพัฒนา SmartNote AI

---

## 1. บทนำ

SmartNote AI คือแพลตฟอร์มบันทึกความรู้และ workflow อัจฉริยะที่ออกแบบให้รองรับทั้งการจดบันทึก การค้นคืนความรู้ การประสานงาน agent หลายขั้นตอน และการเชื่อมต่อ LLM ได้หลายผู้ให้บริการ โดยมีเป้าหมายให้ประสบการณ์ใช้งานดีทั้งภาษาไทยและอังกฤษ พร้อมยกระดับ CI/CD และมาตรฐาน UX security ให้พร้อมสำหรับการขยายสู่ระดับ production

### 1.1 วัตถุประสงค์
- รองรับ Web, Mobile และ API client ภายใต้ UX contract เดียวกัน
- ใช้ AI Gateway เพื่อ route prompt, route model และบริหาร agent workflow
- แยก Core Services ให้ปรับขนาดอิสระได้
- ใช้ Vector DB + Embedding Engine + Knowledge Graph เพื่อเพิ่มคุณภาพการค้นหาและการเชื่อมโยงความรู้
- บังคับใช้มาตรฐาน UX ด้านความปลอดภัย, bilingual consistency และ Human Confirmation
- ทำให้ CI/CD มีเสถียรภาพด้วย manifest-driven validation, retry, fallback และ autoscaling policy

### 1.2 ขอบเขต
- **Client:** Web app, mobile app, partner/developer API
- **Backend:** AI Gateway และ Core Services แบบ service-oriented
- **AI Infrastructure:** vector retrieval, embeddings, knowledge graph, audit trails
- **Operations:** GitHub Actions, Kubernetes autoscaling, deployment guardrails

---

## 2. สถาปัตยกรรมระดับสูง

```text
SmartNote AI Platform

Client
 ├─ Web
 ├─ Mobile
 └─ API

AI Gateway
 ├─ Prompt Router
 ├─ LLM Router
 └─ Agent Manager

Core Services
 ├─ Note Service
 ├─ Folder Service
 ├─ Search Service
 └─ AI Service

AI Infrastructure
 ├─ Vector DB
 ├─ Embedding Engine
 └─ Knowledge Graph

LLM Providers
 ├─ OpenAI
 ├─ Anthropic
 ├─ Grok
 ├─ DeepSeek
 └─ Local LLM
```

### 2.1 Architectural Style
- **Service-oriented / Modular microservices** สำหรับการแยก domain responsibility
- **Event-driven architecture** สำหรับ embedding, indexing, workflow execution และ background jobs
- **Provider-agnostic LLM architecture** เพื่อสลับผู้ให้บริการได้ตาม cost, latency, privacy, compliance
- **Offline-aware client architecture** สำหรับ mobile/web capture และ sync

### 2.2 Layer Responsibilities

#### Client
- Web สำหรับการเขียนและค้นหาแบบลึก
- Mobile สำหรับ quick capture, voice/image intake, offline-first
- API สำหรับ enterprise ingestion และ automation

#### AI Gateway
- **Prompt Router:** เลือก prompt template ตาม task type, locale, persona, risk level
- **LLM Router:** เลือก model/provider และ fallback chain
- **Agent Manager:** วางแผน step, จัดการ tool execution, checkpoints, snapshots, retries, audit log

#### Core Services
- **Note Service:** CRUD, share, retention, versioning
- **Folder Service:** hierarchy, permissions, workspace structure
- **Search Service:** hybrid search, semantic recall, graph expansion
- **AI Service:** summarize, translate, draft, extract, classify, agent task execution

#### AI Infrastructure
- **Vector DB:** semantic retrieval และ nearest-neighbor search
- **Embedding Engine:** multilingual embeddings, refresh, backfill, quality scoring
- **Knowledge Graph:** relation ระหว่าง note, folder, entity, task, decision, people

#### LLM Providers
- OpenAI สำหรับ general reasoning / tool use
- Anthropic สำหรับ long-context reasoning และ safety-oriented tasks
- Grok / DeepSeek สำหรับ alternate routing และ cost-performance diversification
- Local LLM สำหรับ privacy-sensitive หรือ offline-controlled environments

---

## 3. เทคโนโลยีและการพึ่งพา

### 3.1 Runtime และภาษา
| ชั้นระบบ | เทคโนโลยี | หมายเหตุ |
|---|---|---|
| Web/API orchestration | TypeScript / Node.js | ใช้กับ planner, contracts, service adapters |
| Mobile | Kotlin / Swift หรือ cross-platform stack | เน้น offline capture และ native capability |
| Data / orchestration records | PostgreSQL + Prisma | จัดเก็บ workflow metadata และ relational state |
| Semantic retrieval | pgvector หรือ external Vector DB | ใช้เก็บ embedding / retrieval index |
| Queue / background | Kafka + KEDA | รองรับ embedding, retrieval, async agent jobs |

### 3.2 Dependency Governance
- ใช้ schema validation ด้วย **Zod** สำหรับ planner/tool contract
- ใช้ **Prisma** เป็น relational contract สำหรับ orchestration metadata
- dependency review ใน GitHub Actions ต้อง fail ตั้งแต่ระดับ **moderate** ขึ้นไป
- optional stack workflows ต้องตรวจ presence ก่อน run เพื่อลด false-negative CI

---

## 4. Workflow ระดับ Advanced

### 4.1 Intelligent Request Routing
1. Client ส่ง request พร้อม locale, workspace, sensitivity label
2. AI Gateway ประเมิน intent และ risk
3. Prompt Router เลือก template ตามภาษาไทย/อังกฤษ
4. Search Service เรียก semantic context จาก Vector DB / Knowledge Graph
5. LLM Router เลือก provider หลัก + fallback
6. Agent Manager วางแผนงานและเรียก tools
7. ระบบแสดง draft พร้อม Human Confirmation หากงานมีความเสี่ยง

### 4.2 ตัวอย่าง Agent Workflow
**Use case:** “จากบันทึกประชุมนี้ สร้างรายงานและ action items ภาษาไทยกับอังกฤษ”
- step 1: summarize note
- step 2: classify decisions / actions
- step 3: create document draft
- step 4: translate / localize output
- step 5: ขอ Human Confirmation ก่อนแชร์หรือส่งออก

### 4.3 Planner Contract
ทุก step ที่ planner สร้างต้อง
- map ไปยัง tool ที่ระบบรองรับจริง
- parse ผ่าน schema validation
- ระบุ input ที่ครบถ้วนสำหรับ action สำคัญ เช่น `create_document` ต้องมี `title`, `content`, `format`

---

## 5. ข้อมูลและการค้นคืนความรู้

### 5.1 Data Domains
- Notes
- Folders / workspace
- Agent sessions / tasks / steps
- Conversation history
- Long-term memory references
- Embedding metadata / retrieval traces

### 5.2 Retrieval Strategy
- keyword search สำหรับ exact recall
- semantic search สำหรับ intent-level recall
- graph traversal สำหรับ relation-driven discovery
- hybrid ranking รวม freshness, recency, similarity, and permission filters

---

## 6. UX และมาตรฐานความปลอดภัย

### 6.1 Bilingual UX Baseline
- **TH:** ภาษาไทยต้องเป็นธรรมชาติ สุภาพ และลดคำเทคนิคที่ไม่จำเป็น
- **EN:** English copy must stay concise, direct, and semantically aligned with Thai labels
- ปุ่มหรือคำสั่งที่เกี่ยวข้องกับ confirm, cancel, delete, share data, retry ต้องมี semantic parity

### 6.2 AI Safety UX Standard A
- งานที่แตะข้อมูลสำคัญต้องมี Human Confirmation
- ต้องอธิบายว่า AI กำลังทำอะไร ใช้ข้อมูลใด และส่งต่อไป provider ภายนอกหรือไม่
- ต้องมี accept / modify / discard / retry path
- returning users หลัง 2-3 วันต้องเห็น status ล่าสุด งานค้าง และ next step recommendation ได้ทันที

### 6.3 UX Security Guardrails
- redaction PII ก่อนส่งไปยัง provider ภายนอกเมื่อ policy บังคับ
- audit trail ของ agent steps และ tool execution
- consent / confirmation สำหรับการแชร์ข้อมูลหรือการกระทำถาวร

---

## 7. ความปลอดภัยและการกำกับดูแล

- TLS 1.3 สำหรับ data in transit
- encryption at rest สำหรับ relational/object storage
- RBAC / workspace-level access control
- prompt injection defense, content moderation, output validation
- provider allow-list ตาม use case และระดับความเสี่ยง
- รองรับ PDPA / GDPR delete workflows ในระดับ metadata และ content references

---

## 8. ประสิทธิภาพและการขยายระบบ

### 8.1 Performance Targets
| Metric | เป้าหมาย |
|---|---|
| API p95 | < 250ms สำหรับ CRUD ปกติ |
| AI routing decision | < 500ms |
| Text generation first token | < 2s ในโหมด online |
| Search query p95 | < 700ms แบบ hybrid search |
| Agent planning | < 3s สำหรับงานมาตรฐาน |

### 8.2 Autoscaling Strategy
- **HPA:** AI Gateway / API / latency-sensitive services
- **KEDA:** embedding, retrieval, background workers, queue consumers
- **Fallback CI/CD scaling:** งานตรวจสอบบางประเภทที่ล้มเหลวจากปัจจัยชั่วคราวควรถูก replay ผ่าน asynchronous queue หรืองาน non-blocking แทนการปิด pipeline ทั้งหมด

---

## 9. CI/CD และการส่งมอบ

### 9.1 Stable CI Requirements
- workflow inventory ต้องตรวจด้วย manifest ไม่ผูกกับจำนวนไฟล์แบบตายตัว
- README, UX spec และ architecture doc ต้องสอดคล้องกันเสมอ
- dependency review ต้องเปิดใช้งานสำหรับ pull request
- optional stack workflows ต้อง skip อย่างชัดเจนเมื่อไม่มี stack ที่เกี่ยวข้อง
- deployment workflow ต้อง validate secrets, migration assets และ rollout readiness ก่อน deploy

### 9.2 Release Gates
- **Blocking:** workflow health, dependency review, UX/doc parity, planner contract, deploy prerequisite
- **Non-blocking advisory:** autoscaling checks, optional stack checks, replay recommendations

---

## 10. Roadmap

1. เชื่อม multi-provider routing contract เข้ากับ runtime จริง
2. เพิ่ม app skeleton สำหรับ web/mobile เพื่อให้ CI ทดสอบ build จริง
3. เพิ่ม UX contract tests สำหรับ safety markers และ TH/EN parity
4. เพิ่ม observability dashboards สำหรับ agent execution และ provider routing
5. เพิ่ม self-healing workflow replay สำหรับ CI/CD งานที่เสี่ยงล้มเหลวจากทรัพยากรชั่วคราว
