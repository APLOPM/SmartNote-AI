# Production Blueprint: RAG + Event-Driven Kafka (Node.js + Prisma + PostgreSQL/pgvector)

เอกสารนี้เป็น **production runbook + architecture contract** สำหรับระบบ RAG แบบ event-driven ที่ใช้ Node.js, Prisma, PostgreSQL (pgvector), และ Apache Kafka โดยโฟกัสที่ topology, partition strategy, consumer config, exactly-once, และ multi-tenant isolation ระดับ production

---

## 1) Overall Topology (Production)

```text
Client / Gateway
      |
      v
  API Service (stateless, autoscale)
      |
      |  (DB transaction: memory + outbox)
      v
  PostgreSQL Primary  <---------------------------+
      |                                          |
      | poll unpublished outbox                   |
      v                                          |
Outbox Publisher (idempotent producer)           |
      |                                          |
      +------------> Kafka Cluster (3-5 brokers) |
                        |                        |
                        +--> memory.ingested ----+----> Embedding Service (group A)
                        |                               |
                        |                               +--> memory.embedded
                        |
                        +--> memory.embedded ----------> Indexer Service (group B)
                        |                               |
                        |                               +--> memory.indexed
                        |
                        +--> query.request ------------> Retrieval Service (group C)
                        |                               |
                        |                               +--> query.context.ready
                        |
                        +--> query.context.ready ------> LLM Orchestrator (group D)
                                                        |
                                                        +--> QueryResponse / side-effects

PostgreSQL Read Replica(s):
- Retrieval read path
- Analytics/observability read path
```

**Design principles**
- บริการทั้งหมด stateless, scale แบบ horizontal
- สื่อสารระหว่าง service ด้วย Kafka เท่านั้น (no cross-service direct DB writes)
- DB writes อยู่ที่ owner service ของตารางนั้น
- tenant isolation ต้องอยู่ทั้งใน key, topic contract, และ SQL filter

---

## 2) Topic Design (Production Grade)

| Topic | Partitions | RF | Cleanup | Retention | Purpose |
|---|---:|---:|---|---|---|
| `memory.ingested` | 24 | 3 | compact | N/A (compaction-based) | raw memory event |
| `memory.embedded` | 24 | 3 | compact | N/A | embedding ready |
| `memory.indexed` | 24 | 3 | compact | N/A | indexed marker/state |
| `query.request` | 48 | 3 | delete | 7d | user query events |
| `query.context.ready` | 48 | 3 | delete | 3d | retrieved context payload |
| `memory.failed` (DLQ) | 12 | 3 | delete | 14d | unrecoverable failures |

### Why compact for memory state topics
- key = `tenantId:memoryId`
- ใช้ replay/rebuild ได้ง่าย
- state ล่าสุดต่อ key จะถูกเก็บเป็นหลัก
- ช่วยลด storage growth เมื่อเทียบ append-only state stream

---

## 3) Partition Strategy (Critical)

### 3.1 Memory lifecycle events
- Key: `tenantId:memoryId`
- เหตุผล:
  - ordering ต่อ memory เดียวกัน deterministic
  - tenant locality ดีขึ้น (cache/index locality)
  - กระจายโหลดได้สมดุลกว่าการใช้ memoryId ล้วน

### 3.2 Query events
- Key: `tenantId:userId`
- เหตุผล:
  - คำถามของ user เดิมไป partition เดิม (warm retrieval cache)
  - ป้องกัน cross-tenant mixing
  - ง่ายต่อการทำ per-user sequencing policy

### 3.3 Capacity rule of thumb
- `maxConsumerReplicas <= numPartitions`
- เผื่อ headroom 20-30% สำหรับ burst และ rebalance
- ถ้าคาดโตเร็ว ให้เพิ่ม partitions ตั้งแต่แรก (repartition ภายหลัง cost สูง)

---

## 4) Kafka Cluster Settings (Prod Baseline)

```properties
num.partitions=12
min.insync.replicas=2
unclean.leader.election.enable=false
log.retention.hours=168
compression.type=zstd
auto.create.topics.enable=false
default.replication.factor=3
offsets.topic.replication.factor=3
transaction.state.log.replication.factor=3
transaction.state.log.min.isr=2
```

**Notes**
- ปิด auto topic creation เพื่อลด config drift
- RF=3 + min ISR=2 เพื่อ survive broker loss 1 node โดยยังคง durability
- แนะนำ rack-aware assignment ถ้า deploy multi-AZ

---

## 5) Producer Config (Node.js / KafkaJS)

```ts
import { CompressionTypes, Kafka, logLevel } from "kafkajs";

const kafka = new Kafka({
  clientId: "outbox-publisher",
  brokers: process.env.KAFKA_BROKERS!.split(","),
  ssl: true,
  sasl: {
    mechanism: "scram-sha-512",
    username: process.env.KAFKA_USERNAME!,
    password: process.env.KAFKA_PASSWORD!,
  },
  logLevel: logLevel.INFO,
});

export const producer = kafka.producer({
  idempotent: true,
  maxInFlightRequests: 5,
  allowAutoTopicCreation: false,
  transactionTimeout: 60_000,
  retry: {
    retries: 10,
    initialRetryTime: 300,
    maxRetryTime: 30_000,
  },
});
```

**Mandatory**
- `acks=-1` (all in-sync replicas) ตอน send
- idempotent producer ต้องเปิดเสมอ
- ควรส่ง message key ตาม strategy ด้านบนทุกครั้ง

---

## 6) Consumer Group Design + Config

### 6.1 Group layout
- Embedding: `embedding-service-v1` (24 partitions, 6 pods)
- Indexer: `indexer-service-v1` (24 partitions, 4-6 pods)
- Retrieval: `retrieval-service-v1` (48 partitions, 8-12 pods)
- LLM: `llm-orchestrator-v1` (48 partitions, 8+ pods)

### 6.2 Consumer config (KafkaJS)

```ts
const consumer = kafka.consumer({
  groupId: "embedding-service-v1",
  sessionTimeout: 30_000,
  heartbeatInterval: 3_000,
  maxBytesPerPartition: 1_048_576,
  allowAutoTopicCreation: false,
  rebalanceTimeout: 60_000,
});
```

### 6.3 Throughput + ordering control

```ts
await consumer.run({
  autoCommit: false,
  partitionsConsumedConcurrently: 3,
  eachMessage: async ({ topic, partition, message, heartbeat, pause }) => {
    try {
      await processMessage(message);           // embed/index/retrieve
      await commitAfterDbSuccess(topic, partition, message.offset);
      await heartbeat();
    } catch (err) {
      pause();
      throw err;
    }
  },
});
```

**Production policy**
- commit offset หลัง DB transaction สำเร็จเท่านั้น
- กรณี retriable error: retry ด้วย exponential backoff
- กรณี poison message: ส่ง `memory.failed` พร้อม error metadata + original key

---

## 7) PostgreSQL + pgvector (Production)

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE memory (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  thread_id UUID NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX memory_tenant_idx ON memory (tenant_id);

CREATE INDEX memory_embedding_idx
ON memory
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 200);
```

### Query pattern (tenant-safe)

```sql
SET ivfflat.probes = 15;

SELECT id, content
FROM memory
WHERE tenant_id = $1
ORDER BY embedding <-> $2
LIMIT 10;
```

**Tuning**
- หลัง bulk ingest ให้ `ANALYZE memory;`
- ปรับ `lists` ตาม cardinality (ทดลอง A/B ด้วย p95 latency)
- ปรับ `probes` ช่วง 10-20 เพื่อ balance recall/latency

---

## 8) Exactly-Once via Transactional Outbox

```ts
await prisma.$transaction(async (tx) => {
  const memory = await tx.memory.create({
    data: {
      tenantId,
      threadId,
      content,
    },
  });

  await tx.outbox.create({
    data: {
      topic: "memory.ingested",
      key: `${tenantId}:${memory.id}`,
      payload: { memoryId: memory.id, tenantId },
      published: false,
    },
  });
});
```

Outbox publisher flow:
1. select unpublished rows (`FOR UPDATE SKIP LOCKED`)
2. produce to Kafka (idempotent)
3. mark published=true

ผลลัพธ์: แก้ปัญหา dual-write และรองรับ replay/restart ได้ปลอดภัย

---

## 9) Backpressure & Flow Control

Embedding มักเป็น bottleneck หลัก:
- batch size 50-100 records ต่อ embedding call
- semaphore limiter เช่น `maxConcurrent=5`
- pause/resume consumer เมื่อ DB pool ใกล้อิ่ม
- แยก timeout budget: embedding API, DB write, Kafka produce

**Monitor ที่ต้องมี**
- consumer lag per partition
- rebalance frequency
- Prisma pool saturation / connection wait
- vector search p95/p99

---

## 10) Multi-Tenant Isolation Strategy

### Recommended: Shared table + hash partition by tenant

```sql
CREATE TABLE memory_partitioned (
  id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  thread_id UUID NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536),
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (tenant_id, id)
) PARTITION BY HASH (tenant_id);
```

สร้าง 16 partitions (เริ่มต้น) และทำ index ต่อ partition ชัดเจน

ข้อดี:
- ลด index bloat
- vacuum/maintenance ทำได้ granular
- predictable performance เมื่อจำนวน tenant โต

---

## 11) Failure Scenarios & Recovery

- **Consumer crash กลางงาน** → ไม่ commit offset จน DB write สำเร็จ
- **Broker failure 1 node** → RF=3, min ISR=2 ยัง produce/consume ได้
- **Vector index corruption/rebuild** → reset offsets แล้ว replay `memory.embedded`

ตัวอย่าง replay:
```bash
kafka-consumer-groups \
  --bootstrap-server <broker> \
  --group indexer-service-v1 \
  --topic memory.embedded \
  --reset-offsets --to-earliest --execute
```

---

## 12) Observability & SLO

### Metrics mandatory
- Kafka consumer lag (topic/partition/group)
- partition skew
- end-to-end pipeline latency
- embedding latency
- retrieval latency p95/p99
- DB lock wait, slow queries, Prisma query duration

### Target baseline
- Embedding throughput: `2k-5k / min`
- Retrieval latency: `< 50ms` (vector phase)
- LLM total latency: `< 1.5s` (budgeted)
- Kafka lag: ไม่ควรค้างเกิน 2 partition backlog ต่อ group ใน steady state

---

## 13) Production Hardening Checklist

- [x] idempotent producer
- [x] transactional outbox
- [x] manual offset commit
- [x] DLQ + retry policy
- [x] tenant-safe SQL filter ทุก query
- [x] pgvector tuned (`lists`, `probes`, `ANALYZE`)
- [x] connection pool cap + PgBouncer
- [x] structured logging + trace correlation id
- [x] circuit breaker / timeout budget for LLM providers

---

## 14) Optional Advanced Layer (Scale > 10M vectors)

- แยก vector workload ไป dedicated cluster/engine
- shard ตาม tenant range
- add reranker (cross-encoder) หลัง candidate retrieval
- เพิ่ม Redis query-context cache สำหรับ hot prompts

