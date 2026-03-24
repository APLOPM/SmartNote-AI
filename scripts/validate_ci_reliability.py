from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

readme = (ROOT / 'README.md').read_text(encoding='utf-8')
ci_workflow = (ROOT / '.github' / 'workflows' / 'ci.yml').read_text(encoding='utf-8')
deploy_workflow = (ROOT / '.github' / 'workflows' / 'deploy.yml').read_text(encoding='utf-8')
fallback_workflow = (ROOT / '.github' / 'workflows' / 'ci-fallback-replay.yml').read_text(encoding='utf-8')
dependency_workflow = (ROOT / '.github' / 'workflows' / 'dependency-review.yml').read_text(encoding='utf-8')
architecture_doc = (ROOT / 'docs' / 'advanced-architecture.md').read_text(encoding='utf-8')

required_readme_markers = [
    'Minimum UX Release Gate',
    'TH baseline: ผู้ใช้ต้องเข้าใจประโยชน์ก่อนรายละเอียดเชิงเทคนิค',
    'EN baseline: Users should understand the benefit before technical detail appears.',
    'TH gate: flow ที่เกี่ยวข้องกับข้อมูลสำคัญต้องมี Human Confirmation',
    'EN gate: Sensitive flows must include Human Confirmation',
    'Asynchronous fallback replay workflow',
]

required_ci_markers = [
    'planner-tool-contracts',
    'npm run validate:ci-reliability',
    'continue-on-error: true',
    'CI elastic fallback checks (non-blocking)',
]

required_deploy_markers = [
    'retry() {',
    'Apply autoscaling baseline',
    'Smoke test (API + DB + Kafka)',
    'kubectl logs smoke-test || true',
]

required_fallback_markers = [
    'workflow_run:',
    'workflows: ["CI", "Deploy"]',
    'Asynchronous CI fallback replay',
    'continue-on-error: true',
    'strategy:',
    'max-parallel: 3',
    'replay_target',
    'npm run validate:ci-reliability',
]

required_dependency_markers = [
    'actions/dependency-review-action@v4',
    'fail-on-severity: moderate',
    'warn-only: false',
]

required_architecture_markers = [
    'CI fallback queue policy',
    'P3',
    'asynchronous fallback or scheduled replay',
]

for marker in required_readme_markers:
    if marker not in readme:
        raise SystemExit(f'Missing README reliability marker: {marker}')

for marker in required_ci_markers:
    if marker not in ci_workflow:
        raise SystemExit(f'Missing CI workflow reliability marker: {marker}')

for marker in required_deploy_markers:
    if marker not in deploy_workflow:
        raise SystemExit(f'Missing deploy workflow reliability marker: {marker}')

for marker in required_fallback_markers:
    if marker not in fallback_workflow:
        raise SystemExit(f'Missing fallback workflow marker: {marker}')

for marker in required_dependency_markers:
    if marker not in dependency_workflow:
        raise SystemExit(f'Missing dependency review marker: {marker}')

for marker in required_architecture_markers:
    if marker not in architecture_doc:
        raise SystemExit(f'Missing architecture recovery marker: {marker}')

print('CI reliability policy, fallback replay, dependency review, and UX release gates are aligned.')
