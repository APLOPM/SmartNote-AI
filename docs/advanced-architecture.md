# SmartNote AI Platform - Advanced Architecture

เอกสารนี้ยกระดับ SmartNote AI จากระบบสเปกพื้นฐานไปสู่ **Advanced Architecture** ที่รองรับการเติบโตแบบ multi-client, multi-model และมี guardrails ด้าน UX/CI/CD ชัดเจนทั้งภาษาไทยและอังกฤษ

## 1. Target Architecture

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

## 2. Layer Responsibilities

### 2.1 Client
- **Web:** collaborative workspace, semantic search, AI command palette
- **Mobile:** quick capture, offline sync, voice/image intake
- **API:** integration surface for enterprise workflows, ingestion, automation

### 2.2 AI Gateway
- **Prompt Router:** เลือก prompt template ตาม intent, locale (TH/EN), risk level และ data sensitivity
- **LLM Router:** เลือกผู้ให้บริการตาม cost, latency, policy, residency, model health และ fallback chain
- **Agent Manager:** จัด orchestration แบบ multi-step, tool execution, human confirmation, retry, snapshot, audit log

### 2.3 Core Services
- **Note Service:** note lifecycle, sharing policy, versioning, retention, chunk lifecycle for retrieval
- **Folder Service:** hierarchy, ACL, team workspace boundaries
- **Search Service:** keyword + semantic search + graph-assisted recall
- **AI Service:** summarization, drafting, translation, extraction, task execution

### 2.3.1 RAG Retrieval Contract
1. Note content is chunked with workspace, locale, and source metadata before indexing.
2. Embedding Engine generates multilingual embeddings and records model/version metadata.
3. Vector DB stores chunk vectors while relational storage keeps note, ACL, and workflow metadata.
4. Search Service performs semantic or hybrid retrieval with tenant/workspace filters first.
5. AI Service assembles grounded context for answer generation, always preserving Human Confirmation for sensitive actions.

### 2.4 AI Infrastructure
- **Vector DB:** semantic retrieval และ hybrid retrieval routing
- **Embedding Engine:** จัดการ model versioning, embedding refresh, backfill, multilingual embeddings
- **Knowledge Graph:** เก็บ relation ระหว่าง note, task, folder, entity, people, meeting, decision

### 2.5 LLM Providers
- ออกแบบแบบ provider-agnostic เพื่อให้สลับระหว่าง **OpenAI, Anthropic, Grok, DeepSeek และ Local LLM** ได้โดยไม่เปลี่ยน UX contract
- ใช้ policy matrix ในการเลือก provider เช่น `high_safety`, `low_latency`, `low_cost`, `offline_only`

## 3. Request Flow (Advanced)

1. Client ส่ง request พร้อม locale, workspace, feature flag, sensitivity label
2. AI Gateway ตรวจ intent และจัดระดับความเสี่ยง
3. Prompt Router สร้าง system/developer/user prompt bundle ตาม UX language baseline
4. LLM Router เลือก primary model และ fallback model
5. Agent Manager เรียก Core Services / tools ตามแผน
6. Search Service ดึงบริบทจาก Vector DB และ Knowledge Graph
7. AI Service สร้างผลลัพธ์แบบ draft-first และคืน Human Confirmation หากเสี่ยง
8. Client แสดงผลตาม AI Safety UX Standard A พร้อม edit / accept / discard

## 4. UX + Security Contracts

### 4.1 Bilingual UX Contract
- **TH:** สำเนาข้อความต้องสั้น ชัด และลดศัพท์เทคนิคเมื่อไม่จำเป็น
- **EN:** Copy must stay concise, consistent, and action-oriented
- Label ที่เกี่ยวกับ confirm / delete / share data ต้องมี semantic parity ระหว่างไทยและอังกฤษ

### 4.2 UX Security Guardrails
- งานที่แตะข้อมูลสำคัญต้องมี **Human Confirmation**
- ต้องอธิบายว่า model ใดถูกใช้ และใช้ข้อมูลใดในภาษาที่อ่านเข้าใจง่าย
- ต้องมี safe exit, retry, rollback, และ visible audit trail สำหรับ agent workflow

### 4.3 Model Governance
- มี allow-list สำหรับ provider/model ต่อ use case
- redact PII ก่อนส่งออกไปยัง external provider
- ใช้ policy-based routing สำหรับ regulated workspace

## 5. CI/CD Recovery & Elastic Scaling

### 5.1 Stable CI Principles
- workflow validation ต้องอิง manifest ไม่ hard-code จำนวนไฟล์ เพื่อป้องกัน false failure เมื่อเพิ่ม workflow ใหม่
- optional stack checks ต้อง skip ได้อย่างชัดเจนเมื่อ repository ไม่มี stack นั้น
- docs validation ต้อง enforce README + UX + architecture parity

### 5.2 Autoscaling & Recovery Controls
- ใช้ **HPA** สำหรับ latency-sensitive services เช่น AI Gateway / API
- ใช้ **KEDA** สำหรับ queue-driven services เช่น embedding, retrieval, background agents
- เพิ่ม **CI fallback queue policy** สำหรับ replay งานตรวจสอบบางประเภทที่ล้มเหลวจากทรัพยากรชั่วคราว เช่น dependency fetch หรือ smoke checks
- หาก CI/CD บางรายการล้มเหลวจากภาวะโหลด ให้ rerun ผ่าน non-blocking fallback checks แทนการ fail ทั้ง pipeline ทันที

### 5.3 Recommended Recovery Policy
- `P0`: deploy, migration, security review = blocking
- `P1`: docs parity, workflow syntax, planner contract = blocking
- `P2`: optional stack checks, autoscaling advisory = non-blocking with notices
- `P3`: expensive smoke/regression reruns = asynchronous fallback or scheduled replay

## 6. Dependency Baseline

- TypeScript runtime/tooling สำหรับ orchestration contracts
- Zod สำหรับ schema validation ระหว่าง planner กับ tools และ RAG retrieval contracts
- Prisma สำหรับ relational metadata และ task orchestration records
- pgvector / Vector DB สำหรับ semantic recall
- Kafka/KEDA สำหรับ asynchronous AI workloads

## 6.1 Vector Search Technology Baseline

- **Vector DB options:** `pgvector` เป็น default สำหรับ PostgreSQL-first deployments; `Weaviate`, `Milvus`, และ `Qdrant` เป็นทางเลือกเมื่อ scale, tenancy model, หรือ infra policy ต้องการแยก vector plane
- **Embedding options:** `OpenAI text-embedding`, `BGE`, `E5`, และ `Instructor` ต้องถูก expose ผ่าน provider contract เดียวกัน เพื่อให้เปลี่ยน model ได้โดยไม่ทำให้ UX หรือ retrieval contract เปลี่ยน
- **Operational baseline:** retrieval jobs ต้องรองรับ backfill, re-index, embedding refresh, score thresholds, และ CI-safe fallback เมื่อ optional vector stack ยังไม่ถูก provision

## 7. Minimum Deliverables for the Next Milestone

1. ทำให้ planner, tool schemas และ tests สอดคล้องกัน
2. ทำ README เป็น single source of truth สำหรับ UX baseline และ CI policy
3. เพิ่ม manifest-driven workflow validation
4. วาง provider routing contract สำหรับ multi-LLM execution
5. ระบุ autoscaling + fallback policy สำหรับ CI/CD และ AI workloads
