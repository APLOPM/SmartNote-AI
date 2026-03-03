# Background Queue Worker Version + RAG Retrieval Pipeline (Event-Driven Kafka)

เอกสารนี้สรุป 2 แนวทางที่ใช้ร่วมกันได้สำหรับ Agent Memory Layer:

1. **Background Worker (BullMQ + Redis)** สำหรับงาน async ภายในโดเมนเดียว
2. **Event-Driven RAG (Kafka)** สำหรับ pipeline ที่ต้อง scale ข้ามหลาย service

> แนวทางแนะนำใน production: ใช้ BullMQ สำหรับ local async jobs ที่ latency-sensitive ภายใน service และใช้ Kafka สำหรับ cross-service event backbone ที่ต้องการ replay, decoupling และ throughput สูง

---

## 1) Background Queue Worker (Node.js + TypeScript + BullMQ)

### 1.1 Job Types

```ts
// jobs/types.ts
export type MemoryJob =
  | { type: "INGEST_MESSAGE"; messageId: string }
  | { type: "SUMMARIZE_THREAD"; threadId: string }
  | { type: "EMBED_MEMORY"; memoryId: string };
```

### 1.2 Queue Setup

```ts
// queue/index.ts
import { Queue } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(process.env.REDIS_URL!);

export const memoryQueue = new Queue("memory-queue", { connection });
```

### 1.3 Worker Implementation

```ts
// worker/memory.worker.ts
import { Worker, Job } from "bullmq";
import IORedis from "ioredis";
import { PrismaClient } from "@prisma/client";
import { MemoryJob } from "../jobs/types";
import { memoryQueue } from "../queue";
import { embedText, summarizeText } from "../services/llm.service";

const prisma = new PrismaClient();
const connection = new IORedis(process.env.REDIS_URL!);

export const memoryWorker = new Worker<MemoryJob>(
  "memory-queue",
  async (job: Job<MemoryJob>) => {
    switch (job.data.type) {
      case "INGEST_MESSAGE":
        return handleIngest(job.data.messageId);
      case "SUMMARIZE_THREAD":
        return handleSummarize(job.data.threadId);
      case "EMBED_MEMORY":
        return handleEmbed(job.data.memoryId);
    }
  },
  {
    connection,
    concurrency: Number(process.env.MEMORY_WORKER_CONCURRENCY ?? 10),
  }
);

async function handleIngest(messageId: string) {
  const message = await prisma.message.findUnique({ where: { id: messageId } });
  if (!message) return;

  const memory = await prisma.memory.create({
    data: {
      threadId: message.threadId,
      role: message.role,
      content: message.content,
      metadata: { source: "message" },
    },
  });

  await memoryQueue.add(
    "embed",
    { type: "EMBED_MEMORY", memoryId: memory.id },
    {
      attempts: 5,
      backoff: { type: "exponential", delay: 1000 },
      removeOnComplete: true,
      removeOnFail: false,
      jobId: `embed:${memory.id}`,
    }
  );

  return memory.id;
}

async function handleSummarize(threadId: string) {
  const memories = await prisma.memory.findMany({
    where: { threadId },
    orderBy: { createdAt: "asc" },
  });

  const fullText = memories.map((m) => m.content).join("\n");
  const summary = await summarizeText(fullText);

  return prisma.thread.update({ where: { id: threadId }, data: { summary } });
}

async function handleEmbed(memoryId: string) {
  const memory = await prisma.memory.findUnique({ where: { id: memoryId } });
  if (!memory) return;

  const vector = await embedText(memory.content);

  return prisma.memory.update({
    where: { id: memoryId },
    data: { embedding: vector },
  });
}
```

### 1.4 LLM Service Wrapper

```ts
// services/llm.service.ts
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function summarizeText(text: string) {
  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "Summarize for long-term memory." },
      { role: "user", content: text },
    ],
  });

  return res.choices[0].message.content ?? "";
}

export async function embedText(text: string) {
  const res = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });

  return res.data[0].embedding;
}
```

### 1.5 Enqueue from Service Layer

```ts
// services/memory.service.ts
import { memoryQueue } from "../queue";

export async function enqueueIngest(messageId: string) {
  await memoryQueue.add(
    "ingest",
    { type: "INGEST_MESSAGE", messageId },
    {
      attempts: 5,
      backoff: { type: "exponential", delay: 1000 },
      removeOnComplete: true,
      removeOnFail: false,
      jobId: `ingest:${messageId}`,
    }
  );
}
```

### 1.6 Recommended production hardening (BullMQ)

- ใช้ `attempts + backoff` ทุก job
- กำหนด `jobId` เป็น idempotency key (กันงานซ้ำ)
- ตั้ง queue แยก `ingest`, `embed`, `summarize` เมื่อ traffic สูง
- ตั้ง dead-letter strategy (failed set + alert + replay command)
- แยก worker process ออกจาก API process

---

## 2) Event-Driven RAG Retrieval Pipeline (Kafka-based)

### 2.1 High-Level Flow

```text
User Request -> API Layer -> topic: query.request
                              -> Retrieval Service
                              -> topic: query.context.ready
                              -> LLM Orchestrator
                              -> Response Store
```

### 2.2 Topic Design

| Topic | Purpose |
|---|---|
| `memory.ingested` | new raw memory |
| `memory.embedded` | embedding created |
| `memory.indexed` | vector DB updated |
| `query.request` | user query |
| `query.context.ready` | retrieval context ready |

### 2.3 Ingestion Pipeline

1. API produce `memory.ingested`
2. Embedding consumer consume → create embedding → produce `memory.embedded`
3. Indexer consumer consume → upsert vector store → produce `memory.indexed`

### 2.4 Query Pipeline

1. API produce `query.request`
2. Retrieval consume query → embed query → vector search + filter
3. Produce `query.context.ready`
4. LLM orchestrator consume context → generate answer → persist output

### 2.5 Production retrieval policy

- Hybrid search: vector similarity + BM25
- Metadata filter: tenant/user/thread scope
- Re-ranking: cross-encoder + recency boost
- Context compression: dedup + summarize + token budget enforcement

---

## 3) Hybrid Architecture (BullMQ + Kafka) ที่แนะนำ

ใช้ **BullMQ** กับงานที่เป็น local workflow ใน service เดียว (เช่น post-processing, summarization ภายใน bounded context) และใช้ **Kafka** สำหรับ event integration ข้าม service

```text
API Service
  |- local async work -> BullMQ (Redis)
  \- cross-service event -> Kafka

Embedding Service
  |- consume Kafka memory.ingested
  \- optional local batching via BullMQ

Retrieval Service
  |- consume Kafka query.request
  \- produce query.context.ready
```

**เหตุผล**
- ลด coupling ระหว่างทีม/บริการ
- ได้ replayability จาก Kafka
- ยังเก็บ simplicity ของงาน local async ด้วย BullMQ
- scale แยกตาม workload ได้ชัดเจน

---

## 4) Exactly-once + Idempotency checklist

- API เขียน DB + outbox ใน transaction เดียว
- Outbox publisher ใช้ idempotent producer
- consumer commit offset หลัง side effect สำเร็จ
- ทุก write path มี idempotency key (`memoryId`, `requestId`)
- รองรับ replay โดยไม่สร้างข้อมูลซ้ำ

---

## 5) Multi-tenant isolation

- key แนะนำ: `tenantId:memoryId` และ `tenantId:userId`
- partition by tenantId เพื่อให้ locality ดีขึ้น
- vector search ต้อง filter tenant เสมอ
- หลีกเลี่ยง topic per tenant ถ้า tenant จำนวนมาก

---

## 6) Stack recommendations by environment

### A) Early stage (small team)
- API + Worker: Node.js + BullMQ + Redis
- DB: PostgreSQL + pgvector
- ใช้ Kafka เฉพาะ critical integration flow

### B) Growth stage
- Kafka เต็มรูปแบบทุก event หลัก
- แยก service: ingest / embedding / indexer / retrieval / llm-orchestrator
- autoscale ตาม consumer lag

### C) Enterprise scale
- transactional outbox + schema registry
- DLQ automation + replay tooling
- dedicated embedding GPU pool + batcher
- observability ครบ: lag, p95 latency, rebalance, fail ratio

---

## 7) Practical migration path

1. เริ่มจาก BullMQ แยกงาน ingestion/embedding ออกจาก HTTP
2. เติม outbox table และ publisher
3. ย้าย embedding/indexing ไป Kafka consumers
4. ย้าย retrieval pipeline (`query.request` -> `query.context.ready`)
5. เปิด replay + autoscaling ตาม lag

แนวทางนี้ช่วย migrate แบบ incremental โดยไม่ต้อง rewrite ทั้งระบบครั้งเดียว
