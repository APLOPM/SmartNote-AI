# SmartNote-AI: RAG Event-Driven Memory Platform

> **Status:** This repository is currently architecture-first (contract and platform blueprint). It defines production constraints, data flow, and deployment baseline for implementation teams.

## Overview

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

## Repository Contents

- `README.md` — system architecture contract and operations baseline
- `docs/` — deep technical specifications and design references
- `docs/ai-ux-design-system-th.md` — UX design baseline for Chat, Editor, Dashboard, Search, and Agent transparency
- `prisma/schema.prisma` — core data model baseline
- `sql/` — SQL scripts (pgvector + operational rollouts)
- `k8s/` — Kubernetes manifests for autoscaling and CI/CD deployment flow

## Quick Start (Local Reference Environment)

This project includes `docker-compose.yml` for standing up local infrastructure dependencies.

```bash
docker compose up -d
```

Recommended next steps:

1. Initialize PostgreSQL extensions (`pgvector`) via scripts in `sql/`.
2. Apply Prisma migrations/schema for your service implementation.
3. Start service workers and verify Kafka topic provisioning matches the contract below.

> Note: Service code may be introduced incrementally, but event naming, outbox rules, and tenant isolation MUST remain compatible with this README contract.


## UX Specification Baseline (Always Included)

To keep implementation aligned with product UX expectations, every feature proposal and release checklist MUST include these UX references:

- `docs/ai-ux-design-system-th.md` (design tokens, IA, interaction, accessibility)
- `docs/smartnote-serene-dashboard-mockup.html` (dashboard UX baseline)
- `docs/smartnote-serene-search-mockup.html` (search UX baseline)
- `docs/editor-ui-mockup.html` (editor UX baseline)

### Standardized Large-Screen UX Requirements

Use proven responsive patterns so users get a consistent experience across **tablets, foldables, ChromeOS devices, and all phone sizes**:

- Prefer adaptive layouts with clear breakpoints and stable information hierarchy for expanded screens.
- Use standard navigation components (`NavigationRail`, `NavigationDrawer`, or equivalent web patterns) to keep navigation discoverable but uncluttered.
- Keep primary content focused while secondary actions move into drawers/panels to reduce UI noise.
- Ensure keyboard and pointer workflows remain first-class on large-screen and ChromeOS form factors.
- Validate accessibility basics (focus order, contrast, touch target size, and responsive text scaling) for each layout mode.

### UX Review Gate in CI

CI now validates that the baseline UX documents above remain present and that this README continues to declare the UX baseline section. This acts as a minimum guardrail when workflows or architecture contracts are updated.

When updating architecture, workflows, or service contracts, add a UX impact note in the related PR description and verify these docs remain current.

## Google Cloud SDK Installation (for Stitch Authentication)

If you use Stitch workflows that authenticate through Google Cloud, install the `gcloud` CLI first.

### Standalone Install

```bash
# Download and install (simplified for standard environments)
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Set local configuration to avoid prompts
export CLOUDSDK_CORE_DISABLE_PROMPTS=1
```

### Homebrew Install (macOS)

```bash
brew install --cask google-cloud-sdk

# Set local configuration to avoid prompts
export CLOUDSDK_CORE_DISABLE_PROMPTS=1
```


## CI Prerequisites (Security & Dependency Review)

To keep pull request checks stable and actionable:

- Enable **Dependency graph** in repository settings: `Settings > Security > Security analysis`.
- Keep `dependency-review` workflow enabled for PRs to detect risky dependency changes when support is available.
- If Dependency graph is disabled, CI will skip dependency review with a notice and link to enablement instructions.

## System Intent

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

## Implementation Checklist

Use this checklist before promoting any environment:

- [ ] API writes domain data + outbox in a single transaction
- [ ] Outbox publisher is idempotent and retriable
- [ ] Consumers use manual commits and are replay-safe
- [ ] All read/write paths include `tenant_id`
- [ ] Kafka keys include tenant scope
- [ ] DLQ (`memory.failed`) is configured and monitored
- [ ] Vector queries include tenant filter and index tuning
- [ ] Autoscaling limits are aligned with partition counts

## Deployment Model

- Docker-based
- Horizontal scaling via replicas
- Stateless services
- Externalized configuration
- Observability mandatory

## Recommended Observability Baseline

- Traces: request lifecycle across API → Kafka → workers
- Metrics: consumer lag, per-topic throughput, retry count, DLQ rate
- DB metrics: write latency, lock waits, vector query latency, replica lag
- Logs: structured JSON logs with `tenantId`, `memoryId`, `queryId`, `eventType`

## Documentation Map

Key references for implementers:

- `docs/production-rag-kafka-node-prisma-postgres.md`
- `docs/background-queue-worker-and-kafka-rag.md`
- `docs/agent-memory-layer-er.md`
- `docs/smartnote-ai-technical-spec-th.md`
- `docs/smartnote-ai-product-overview-th.md`
- `docs/codebase-audit-fix-proposals-th.md`
- `docs/self-hosted-runner-guide-th.md`

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
