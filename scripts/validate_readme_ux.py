from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
readme = (ROOT / 'README.md').read_text(encoding='utf-8')
ux_doc = (ROOT / 'docs' / 'ai-ux-design-system-th.md').read_text(encoding='utf-8')
architecture_doc = (ROOT / 'docs' / 'advanced-architecture.md').read_text(encoding='utf-8')

required_readme_markers = [
    'UX Specification Baseline (Always Included)',
    'Bilingual Conversational UX Baseline (TH/EN)',
    'Progressive Disclosure (Benefit-first)',
    'Contextual Awareness (2-3 day return)',
    'Privacy Assurance (Standard A)',
    'AI Safety UX Standard A',
    'Advanced Platform Architecture (Target State)',
    'CI/CD Recovery & Elastic Scaling Policy',
    'docs/advanced-architecture.md'
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

required_architecture_markers = [
    'SmartNote AI Platform - Advanced Architecture',
    'AI Gateway',
    'LLM Providers',
    'Prompt Router',
    'Agent Manager',
    'Vector DB',
    'Knowledge Graph',
    'Autoscaling & Recovery Controls'
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

print('README, UX baseline, and advanced architecture markers are aligned.')
