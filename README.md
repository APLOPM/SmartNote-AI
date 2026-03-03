# RAG Event-Driven Memory Platform

## Short Description

Production-grade RAG architecture built on:
- Node.js services
- Kafka event-driven pipeline
- PostgreSQL + pgvector
- Prisma ORM
- Multi-tenant isolation
- Transactional outbox
- Exactly-once processing strategy

This repository defines the structural contract of the system.
All implementations MUST follow this topology and data flow.

## Long Description

This application implements a fully event-driven Retrieval-Augmented Generation (RAG) system designed for:

- Multi-tenant SaaS
- Agent Memory Layer
- Scalable ingestion + embedding
- Deterministic retrieval
- Exactly-once guarantees
- Replayable pipeline

The system separates responsibilities into isolated services:

1. API Service
2. Outbox Publisher
3. Embedding Service
4. Vector Indexer
5. Retrieval Service
6. LLM Orchestrator

All communication between services is asynchronous via Kafka.

## Architecture Contract (Non-Negotiable)

### Event Flow

1. API writes memory + outbox (single DB transaction)
2. Outbox Publisher → memory.ingested
3. Embedding Service → memory.embedded
4. Indexer Service → memory.indexed
5. Query → query.request
6. Retrieval → query.context.ready
7. LLM → response persisted

No direct cross-service DB access allowed.

## Topic Design

| Topic | Purpose |
|--------|---------|
| memory.ingested | raw memory event |
| memory.embedded | embedding created |
| memory.indexed | vector stored |
| query.request | user query |
| query.context.ready | retrieval result |
| memory.failed | DLQ |

Keys:
- Memory events: tenantId:memoryId
- Query events: tenantId:userId

## Guarantees

- Idempotent producers
- Manual offset commit
- Outbox pattern
- Tenant isolation
- Partition locality
- Replay-safe
- Horizontal scaling ready

## Multi-Tenant Rules

- All tables contain tenant_id
- All queries MUST filter by tenant_id
- Kafka key MUST include tenantId
- pgvector query MUST include tenant filter

## Database Strategy

- PostgreSQL primary + read replica
- pgvector (ivfflat)
- Partition by HASH(tenant_id)
- PgBouncer transaction pooling

## Scaling Principles

Embedding bottleneck controlled via:
- Batch processing
- Consumer group scaling
- Backpressure monitoring

Retrieval optimized for:
- Low latency (<50ms vector search)
- Probe tuning
- Indexed filtering

## Failure Handling

- DLQ topic for failures
- Replay via offset reset
- Idempotent writes
- Circuit breaker on LLM

## What MUST NOT Be Changed

- Event-driven topology
- Outbox pattern
- Tenant partition strategy
- Exactly-once semantics
- Kafka key design
- pgvector index strategy

## Deployment Model

- Docker-based
- Horizontal scaling via replicas
- Stateless services
- Externalized configuration
- Observability mandatory

This document defines architectural boundaries.
All contributors must comply.

## Agent Memory Layer ER Model

Detailed data model and Mermaid diagram for task/workflow state, memory layers, tool executions, and conversation context are documented at:

- `docs/agent-memory-layer-er.md`

## Production Autoscaling Configuration (Kafka Consumer Lag)

Recommended autoscaling strategy for Kubernetes + Kafka-based RAG services:

- Primary signal: Kafka consumer lag
- Secondary protection: CPU-based scaling (for non-lag-driven services like LLM orchestrator)
- Guardrail: `maxReplicaCount <= topic partitions`
- Stability: cooldown + scale-down stabilization window

### KEDA Installation

```bash
helm repo add kedacore https://kedacore.github.io/charts
helm install keda kedacore/keda --namespace keda --create-namespace
```

### Included Manifests

- `k8s/autoscaling/keda-kafka-autoscaling.yaml`
  - Embedding scaler (`memory.ingested`, lagThreshold=500, maxReplicaCount=24)
  - Retrieval scaler (`query.request`, lagThreshold=200, maxReplicaCount=48)
- `k8s/autoscaling/deployments-resources-and-rollout.yaml`
  - Rolling update guardrails and CPU/memory requests-limits
- `k8s/autoscaling/hpa-llm-cpu-rps.yaml`
  - LLM orchestrator HPA based on CPU + RPS
- `k8s/autoscaling/alerts-prometheus-rules.yaml`
  - Alerts for high lag, rebalance frequency, and max replica saturation

### Partition Planning Rule

Always ensure:

- `partitions >= maxReplicaCount`
- Example: peak ingest 20k events/min and 1 pod handles 1k events/min means at least 20 partitions and max replicas >= 20.

### Operational Recommendations

- Keep manual offset commits and idempotent processing.
- Add graceful shutdown hooks so consumers commit/disconnect on SIGTERM.
- Monitor lag, partition skew, rebalance frequency, per-message processing latency, DB write latency, and vector insert latency.

## CI/CD Production Template (GitHub Actions + Kubernetes)

This repository now includes a production-ready CI/CD baseline for monorepo, multi-service, Dockerized Node.js + Prisma + PostgreSQL + Kafka systems:

- `.github/workflows/ci.yml`
  - Per-service lint/test/Prisma validation on pull requests.
- `.github/workflows/build.yml`
  - Immutable image build and push to GHCR using `:${GIT_SHA}` tags.
- `.github/workflows/deploy.yml`
  - Migration-first deployment flow, rollout checks, smoke test, and automatic rollback on failure.
- `k8s/cicd/prisma-migrate-job.yaml`
  - Kubernetes migration job template for `prisma migrate deploy`.
- `k8s/cicd/embedding-deployment.yaml`
  - Deployment template for embedding service.

### CI/CD Lock Principles

- Migration runs before rollout.
- Images are immutable (`sha` tags only in deployment flow).
- Services are independently deployable.
- Rollback is a single command (`kubectl rollout undo`).
- No manual DB edits.
- No direct production DB access.
