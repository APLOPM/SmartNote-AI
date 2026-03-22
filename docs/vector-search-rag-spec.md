# Vector Search / RAG Specification

เอกสารนี้ระบุ baseline สำหรับการเพิ่ม **Vector Search + Retrieval-Augmented Generation (RAG)** ให้ SmartNote AI เพื่อให้ระบบค้นหาโน้ตด้วยความหมาย, ทำ Chat with your notes, และทำ Knowledge retrieval ได้อย่างปลอดภัยทั้งภาษาไทยและอังกฤษ

## 1. Note Ingestion -> Embedding -> Vector Index -> Retrieval -> Answer

```text
Note
 └─ content
    └─ chunking + metadata
          │
          ▼
Embedding Model
 ├─ OpenAI text-embedding
 ├─ BGE
 ├─ E5
 └─ Instructor
          │
          ▼
Vector Database
 ├─ pgvector
 ├─ Weaviate
 ├─ Milvus
 └─ Qdrant
          │
          ▼
Semantic / Hybrid Search
          │
          ▼
LLM Answer + Human Confirmation
```

## 2. Product Outcomes

- **Meaning-based search:** ผู้ใช้ค้นหาโน้ตด้วย intent, synonym, topic similarity, และ bilingual phrasing ได้
- **Chat with your notes:** assistant ต้องใช้ retrieved note context ก่อนตอบหรือสั่งงานต่อ
- **Knowledge retrieval:** ระบบรวม note chunks, memory summaries, และ metadata links เป็น grounded context pack ได้
- **Bilingual experience:** fallback states, loading states, และ confirmation labels ต้องคง semantic parity ระหว่างไทยและอังกฤษ

## 3. Technology Baseline

### 3.1 Vector DB
- `pgvector`: default สำหรับ PostgreSQL-first deployment และทีมที่ต้องการ operational simplicity
- `Weaviate`: เหมาะเมื่ออยากใช้ built-in schema/search features ระดับ higher-level
- `Milvus`: เหมาะกับ workload ที่ vector scale สูงและมี dedicated infra team
- `Qdrant`: เหมาะสำหรับ metadata filtering ที่ชัดเจนและ deployment ที่ยืดหยุ่น

### 3.2 Embedding
- `OpenAI text-embedding`: fast default สำหรับ managed cloud workflow
- `BGE`: strong multilingual/open-weight option
- `E5`: retrieval-oriented embedding family สำหรับ search-heavy use case
- `Instructor`: useful when instruction-conditioned embeddings improve note/task recall

## 4. Data Contract Baseline

- เก็บ note metadata, ACL, workflow state, และ audit trail ใน relational layer
- เก็บ vector index ใน vector layer พร้อม `workspaceId`, `noteId`, `chunkId`, `locale`, `embeddingModel`, `embeddingVersion`
- บังคับ tenant/workspace filters ก่อน score ranking ทุกครั้ง
- รองรับ backfill/re-embed เมื่อเปลี่ยน model, locale policy, หรือ chunking strategy

## 5. Retrieval UX + Safety Contract

- Search result explanations ต้องบอกว่าทำไมโน้ตนั้นจึงถูกดึงมา
- เมื่อไม่พบบริบทเพียงพอ ระบบต้องชวน refine query แทนการเดา
- Chat with your notes ต้องเปิดเผยว่าคำตอบมาจาก retrieved notes ใด
- งานที่นำไปสู่การแชร์ ลบ หรือแก้ข้อมูลสำคัญ ต้องมี Human Confirmation เสมอ
- TH/EN copy สำหรับ `Confirm`, `Cancel`, `Delete`, `Share data`, `Retry` ต้องตรงเจตนาเดียวกัน

## 6. CI/CD and Reliability Expectations

- README, architecture docs, และ RAG spec ต้องมี marker ที่ตรงกันเพื่อกัน documentation drift
- optional vector stacks ต้องถูกตรวจแบบ skip-safe ถ้ายังไม่มี runtime implementation ใน repo
- autoscaling manifests สำหรับ embedding/retrieval workloads ต้องคงอยู่เพื่อรองรับ recovery หลัง queue spike หรือ CI/CD backlog
- dependency/runtime checks ควรแยก blocking กับ advisory path ให้ชัด เมื่อ provider หรือ vector backend บางตัวเป็น optional

## 7. Recommended Next Implementation Slice

1. เพิ่ม note chunk table / SQL migration สำหรับ pgvector หรือ adapter ของ external vector DB
2. เพิ่ม embedding worker contract พร้อม batching, retry, และ model/version tagging
3. เพิ่ม semantic retrieval service ที่คืน evidence + rationale ไม่ใช่ score อย่างเดียว
4. เพิ่ม chat orchestration ที่บังคับ grounded answer เมื่อเปิดโหมด knowledge retrieval
5. เพิ่ม bilingual UX states สำหรับ loading, no-results, stale-index, confirmation, และ retry
