# 🧠 SmartNote AI

> Your intelligent second brain, supercharged by AI agents.

SmartNote AI is a bilingual (Thai/English) product concept for AI-assisted note capture, retrieval, and workflow orchestration. The current repository primarily contains architecture notes, UX specifications, mockups, Kubernetes deployment assets, and GitHub Actions workflows that keep documentation and CI/CD policy aligned.

---

## ✨ Core Features

- **🤖 AI Agent Workflows:** Coordinate multi-step tasks such as summarization, retrieval, drafting, and workflow hand-offs from a note-centric UI.
- **✍️ Intelligent Writing Assistant:** Improve, translate, summarize, and expand note content with inline AI assistance.
- **🎙️ Multi-Modal Notes:** Support text, voice, image, OCR, and structured AI output blocks in a single workspace.
- **🔎 Semantic Search:** Retrieve notes by intent and meaning, not only literal keywords.
- **🧠 Chat with Your Notes:** Ground answers in retrieved note context with bilingual Thai/English UX safeguards.
- **🕸️ Knowledge Mapping:** Visualize relationships between notes, tasks, and AI-generated insights.
- **🔄 Sync & Reliability Controls:** Design for cross-platform sync, offline resilience, and operational guardrails in CI/CD.

## 🚀 Repository Focus

This repository is currently organized around product and platform foundations rather than a fully checked-in application runtime.

- **Product documentation:** bilingual UX/design system notes, architecture specifications, and audit proposals.
- **Experience mockups:** HTML mockups that define dashboard, search, and editor flows.
- **Platform operations:** Kubernetes manifests for autoscaling, rollout, and migration jobs.
- **CI/CD governance:** GitHub Actions workflows that validate docs, dependency policy, deployment readiness, and operational smoke checks.

## 🏗️ Advanced Platform Architecture (Target State)

SmartNote AI is evolving toward a provider-agnostic, agent-driven architecture that separates user channels, orchestration, domain services, AI infrastructure, and model providers.

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

### Why this architecture

- **Channel separation:** web, mobile, and external API consumers can evolve independently.
- **AI Gateway control plane:** prompt routing, provider routing, and agent execution policies stay centralized.
- **Composable core services:** notes, folders, search, and AI processing can scale independently.
- **RAG-ready retrieval path:** Note content flows through chunking, embeddings, vector indexing, semantic search, and LLM answer synthesis.
- **Provider portability:** OpenAI, Anthropic, Grok, DeepSeek, and Local LLM remain interchangeable behind routing policy.
- **Retrieval depth:** Vector DB + Embedding Engine + Knowledge Graph give better recall than keyword-only search.

## 🔍 Vector Search / RAG Architecture Baseline

The note retrieval stack is now defined as a Retrieval-Augmented Generation (RAG) contract so semantic search, chat-with-your-notes, and knowledge retrieval stay aligned across docs, CI, and future implementations.

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

### RAG product outcomes

- **Meaning-based note retrieval:** users can find notes by intent, topic similarity, and multilingual phrasing.
- **Chat with your notes:** answers must be grounded in retrieved context before the assistant drafts or acts.
- **Knowledge retrieval:** search can assemble note chunks, summaries, and related memory links into reusable evidence packs.
- **Bilingual UX requirement:** TH/EN copy for search, fallback, and confirmation states must remain semantically aligned.

## 🧱 System Structure by Layer

### 1) Experience Layer

User-facing surfaces are designed for web, mobile, and AI-assisted editing experiences.

- **Dashboard / workspace surfaces:** defined by the serene dashboard mockup for overview and return-user orientation.
- **Search surface:** optimized for semantic lookup and recovery of prior context.
- **Editor surface:** supports inline AI actions, generated content blocks, and review/accept flows.
- **Bilingual UX baseline:** Thai and English copy must remain consistent in intent, privacy messaging, and task confirmation behavior.

### 2) Intelligence Layer

The AI layer is responsible for orchestration rather than single-shot generation only.

- **Agent memory:** persistent context and workflow state are described in the Agent Memory Layer ERD.
- **AI patterns:** command palette, slash commands, AI cards, and streaming feedback are documented in the design system.
- **Safety model:** sensitive operations require Human Confirmation and explicit data-use disclosure.

### 3) Platform & Delivery Layer

Operational assets support reliability, scaling, and deployment governance.

- **Kubernetes manifests:** autoscaling, rollout, and migration jobs are stored in `k8s/`.
- **GitHub Actions workflows:** repository automation validates workflow health, dependency review, deployment readiness, and optional stacks such as Android, Next.js, Conda, and Webpack.
- **Documentation-driven quality:** CI verifies that README and UX docs stay synchronized.

## 🗂️ Repository Structure

```text
.
├── .github/
│   ├── labeler.yml
│   └── workflows/                  # CI/CD, deployment, labeling, stale handling, AI summaries
├── docs/
│   ├── ai-ux-design-system-th.md   # UX principles, AI interaction patterns, safety markers
│   ├── agent-memory-layer-er.md    # Agent memory/data relationship overview
│   ├── smartnote-serene-*.html     # Dashboard and search mockups
│   └── editor-ui-mockup.html       # Editor UX reference
├── k8s/
│   ├── autoscaling/                # HPA, KEDA, rollout resources, Prometheus rules
│   └── cicd/                       # Deployment and Prisma migration job assets
└── README.md
```

## 🧭 Key Documentation Map

- [AI UX Design System](docs/ai-ux-design-system-th.md)
- [Advanced Architecture](docs/advanced-architecture.md)
- [Vector Search / RAG UX & Platform Spec](docs/vector-search-rag-spec.md)
- [Agent Memory Layer ERD](docs/agent-memory-layer-er.md)
- [Technical Specification (TH)](docs/smartnote-ai-technical-spec-th.md)
- [Product Overview (TH)](docs/smartnote-ai-product-overview-th.md)
- [Dashboard Mockup](docs/smartnote-serene-dashboard-mockup.html)
- [Search Mockup](docs/smartnote-serene-search-mockup.html)
- [Editor Mockup](docs/editor-ui-mockup.html)
- [Codebase Audit & Fix Proposals (TH)](docs/codebase-audit-fix-proposals-th.md)

## 🎨 UX Specification Baseline (Always Included)

To keep product quality stable across releases, every UX proposal, implementation plan, and PR should preserve these baseline requirements.

- **Bilingual Conversational UX Baseline (TH/EN):**
  - TH: ใช้ภาษาไทยที่เป็นธรรมชาติ สุภาพ กระชับ และสอดคล้องกับบริบทของงาน โดยหลีกเลี่ยงศัพท์เทคนิคที่ไม่จำเป็น
  - EN: Use clear, concise English with consistent intent, terminology, and action labels across screens.
- **Progressive Disclosure (Benefit-first):** Start with the user benefit, then reveal technical detail only when the task or risk requires it.
- **Contextual Awareness (2-3 day return):** UX must help a returning user understand the latest state, unfinished work, and next action within a few seconds.
- **Privacy Assurance (Standard A):** Tasks involving sensitive content must provide Human Confirmation and a plain-language explanation of how data will be used.
- **AI Safety UX Standard A:** Important AI actions must expose safety markers, confirmation checkpoints, and clear recovery paths.

## Minimum UX Release Gate

These minimum UX release requirements are now treated as part of CI reliability policy so the pipeline can block real UX regressions without failing on unrelated optional stacks.

- **TH baseline: ผู้ใช้ต้องเข้าใจประโยชน์ก่อนรายละเอียดเชิงเทคนิค** และต้องเห็นสถานะล่าสุด งานค้าง และทางเลือกถัดไปอย่างรวดเร็ว
- **EN baseline: Users should understand the benefit before technical detail appears.** Returning users should also see the latest state, pending work, and a clear next action immediately.
- **TH gate: flow ที่เกี่ยวข้องกับข้อมูลสำคัญต้องมี Human Confirmation** พร้อมคำอธิบายว่าระบบ AI ใช้ข้อมูลใด ส่งไปที่ไหน และยกเลิกได้อย่างไร
- **EN gate: Sensitive flows must include Human Confirmation** plus a plain-language explanation of what data is used, where it is sent, and how the user can cancel safely.
- **TH/EN parity gate:** ปุ่ม Confirm / Cancel / Delete / Share Data / Retry ต้องมีเจตนาเดียวกันทั้งสองภาษา
- **Recovery gate:** หากการตรวจสอบบางรายการล้มเหลวจากปัจจัยชั่วคราว ให้ใช้ **Asynchronous fallback replay workflow** เพื่อยืนยันซ้ำแบบไม่บล็อกทันทีแทนการปกปิดความเสี่ยงจริง

## ✅ UX Safety Acceptance Checklist

Every UX-affecting change should be reviewed against this checklist.

- **TH:** ทุก flow ที่กระทบข้อมูลสำคัญต้องมี Human Confirmation ที่เข้าใจง่าย และยกเลิกได้
- **EN:** Sensitive flows must provide an understandable Human Confirmation step with a safe cancel path.
- **TH:** ต้องระบุให้ผู้ใช้ทราบว่า AI กำลังทำอะไร ใช้ข้อมูลใด และผลลัพธ์สามารถแก้ไขหรือปฏิเสธได้
- **EN:** Users must be told what the AI is doing, which data is being used, and whether results can be edited or discarded.
- **TH:** ผู้ใช้ที่กลับมาใช้งานหลัง 2-3 วันต้องเห็นสถานะล่าสุด สรุปสิ่งค้าง และทางเลือกถัดไปอย่างชัดเจน
- **EN:** Returning users should immediately see recent status, pending items, and recommended next actions.
- **TH:** คำศัพท์ไทยและอังกฤษต้องตรงกัน โดยเฉพาะปุ่มที่เกี่ยวกับการยืนยัน การลบ และการแชร์ข้อมูล
- **EN:** Thai and English labels should stay semantically aligned, especially for confirm, delete, and data-sharing actions.

## 🛠️ CI/CD Reliability Standards

The workflow set is designed to fail only on genuine issues and to skip optional stacks safely when a matching project is not present.

- **Workflow reliability:** CI validates workflow inventory, syntax, README/UX documentation alignment, and RAG architecture markers.
- **Dependency guardrails:** pull requests are reviewed with `actions/dependency-review-action` and gated at moderate severity or higher.
- **Optional stack detection:** Android, Next.js, Conda, and Webpack workflows now detect whether their stack exists before trying to build it.
- **Deployment readiness:** deployment automation validates kubeconfig secrets, migration manifests, autoscaling files, and rollout behavior before continuing.
- **Autoscaling readiness for recovery:** Kubernetes autoscaling manifests are continuously checked so the platform can recover when workloads or CI/CD operations become unstable.

## ♻️ CI/CD Recovery & Elastic Scaling Policy

To keep CI stable without hiding real risk, the repository uses a tiered reliability policy.

- **Blocking checks:** workflow syntax, dependency review, README/UX parity, planner/tool contract validation, and deploy prerequisites.
- **Elastic non-blocking checks:** autoscaling advisory checks and optional-stack validation can emit notices without failing the full pipeline when the repository does not contain that stack.
- **Retry-first operations:** dependency installation and rollout checks should retry before failing to reduce transient network or registry noise.
- **Recovery-aware autoscaling:** Kubernetes HPA/KEDA assets are maintained so API, embedding, retrieval, and AI workloads can recover when CI/CD or background demand spikes.
- **Fallback replay design:** selected expensive or transient checks should be rerun asynchronously rather than immediately blocking all delivery paths.

## 🔍 Improvements Applied in the Current Baseline

- Stabilized optional workflows so absent app stacks do not create false-negative CI failures.
- Added stronger preflight validation for Algorithmia test input, deployment prerequisites, and manual issue-summary runs.
- Tightened README/UX documentation coupling so CI can enforce bilingual UX, RAG retrieval behavior, and safety expectations.
- Clarified that the repository currently centers on specs, mockups, and delivery assets, avoiding drift between documentation and actual contents.

## 🧪 Suggested Validation Routine

When changing docs or workflow policy, run these checks locally when the tools are available:

```bash
python3 - <<'PY'
from pathlib import Path
for path in sorted(Path('.github/workflows').glob('*.yml')):
    print(path)
PY

for workflow in .github/workflows/*.yml; do
  ruby -e "require 'yaml'; YAML.load_file(ARGV[0])" "$workflow"
done

rg -n "UX Specification Baseline|UX Safety Acceptance Checklist|System Structure by Layer" README.md
```

## 🔧 Recommendations for Further Fixes

1. **Add repository-local schema/tests for workflows:** include a pinned local linter setup (for example, vendored `actionlint` in tooling or a containerized validation script) so workflow syntax can be checked even in restricted environments.
2. **Introduce reusable workflows:** extract repeated retry/detect logic into shared workflows or composite actions to reduce maintenance overhead.
3. **Add deployment environment matrices:** parameterize cluster names, namespaces, and service lists so deploy automation matches actual environments instead of assuming a fixed set.
4. **Version bilingual UX copy:** store canonical TH/EN labels in a single source of truth to keep mockups, docs, and application code aligned.
5. **Expand smoke tests:** add artifact-free documentation tests and manifest validation (for example kubeconform or policy checks) to catch operational regressions earlier.

## 🚀 Recommendations for Future Expansion

1. **Check in runnable app surfaces:** add minimal web/mobile service skeletons so the workflows can validate real builds instead of documentation-only structure.
2. **Add UX contract tests:** verify mandatory safety markers, confirmation flows, and bilingual label parity in UI snapshots or end-to-end tests.
3. **Connect docs to architecture decisions:** formalize ADRs for AI orchestration, data retention, and sync guarantees.
4. **Strengthen observability:** extend Prometheus rules, rollout metrics, and incident playbooks for AI-heavy workloads.
5. **Add release readiness dashboards:** summarize workflow health, documentation drift, and deployment guardrail status in a single report.

## 🙌 Contributing

1. Fork the repository.
2. Create a feature branch.
3. Update workflows, docs, or manifests with bilingual UX and safety requirements in mind.
4. Run the relevant local checks.
5. Open a pull request with notes about CI impact, UX impact, and any follow-up work.

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
