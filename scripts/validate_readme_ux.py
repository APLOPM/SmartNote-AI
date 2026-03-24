from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
readme = (ROOT / 'README.md').read_text(encoding='utf-8')
ux_doc = (ROOT / 'docs' / 'ai-ux-design-system-th.md').read_text(encoding='utf-8')
architecture_doc = (ROOT / 'docs' / 'advanced-architecture.md').read_text(encoding='utf-8')
rag_doc = (ROOT / 'docs' / 'vector-search-rag-spec.md').read_text(encoding='utf-8')

required_readme_markers = [
    'UX Specification Baseline (Always Included)',
    'Bilingual Conversational UX Baseline (TH/EN)',
    'Progressive Disclosure (Benefit-first)',
    'Contextual Awareness (2-3 day return)',
    'Privacy Assurance (Standard A)',
    'AI Safety UX Standard A',
    'First-Use Homepage UX (TH/EN)',
    'docs/smartnote-homepage-first-use-mockup.html',
    'Advanced Platform Architecture (Target State)',
    'Vector Search / RAG Architecture Baseline',
    'Chat with your notes',
    'CI/CD Recovery & Elastic Scaling Policy',
    'docs/advanced-architecture.md',
    'docs/vector-search-rag-spec.md',
    'Database Schema Baseline (PostgreSQL + pgvector)',
    'sql/smartnote_ai_production_schema.sql',
    'CI Failure Autoscaling Response'
]

required_ux_markers = [
    'Conversational Onboarding Baseline (TH/EN)',
    'Progressive Disclosure',
    'Contextual Awareness',
    'Privacy Assurance',
    'AI Safety UX Standard A',
    'Human Confirmation',
    'Bilingual UX Copy Standard',
    'UX Security Guardrails'
]

homepage_doc = (ROOT / 'docs' / 'smartnote-homepage-first-use-mockup.html').read_text(encoding='utf-8')
required_homepage_markers = [
    'First-Use Homepage UX (TH/EN)',
    'Progressive Disclosure',
    'Contextual Awareness',
    'Bilingual UX Copy Standard',
    'Human Confirmation + UX Security Guardrails',
    'CI Failure Autoscaling Response'
]

required_architecture_markers = [
    'SmartNote AI Platform - Advanced Architecture',
    'AI Gateway',
    'LLM Providers',
    'Prompt Router',
    'Agent Manager',
    'Vector DB',
    'Knowledge Graph',
    'RAG Retrieval Contract',
    'Autoscaling & Recovery Controls'
]

required_rag_markers = [
    'Vector Search / RAG Specification',
    'Note Ingestion -> Embedding -> Vector Index -> Retrieval -> Answer',
    'Chat with your notes',
    'Knowledge retrieval',
    'Human Confirmation',
    'pgvector',
    'Qdrant'
]

for marker in required_readme_markers:
    if marker not in readme:
        raise SystemExit(f'Missing README marker: {marker}')

for marker in required_ux_markers:
    if marker not in ux_doc:
        raise SystemExit(f'Missing UX doc marker: {marker}')

for marker in required_architecture_markers:
    if marker not in architecture_doc:
        raise SystemExit(f'Missing architecture marker: {marker}')

for marker in required_rag_markers:
    if marker not in rag_doc:
        raise SystemExit(f'Missing RAG marker: {marker}')

for marker in required_homepage_markers:
    if marker not in homepage_doc:
        raise SystemExit(f'Missing homepage UX marker: {marker}')

print('README, UX baseline, architecture, and RAG markers are aligned.')
