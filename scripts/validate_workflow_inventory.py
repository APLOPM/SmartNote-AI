from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
manifest = json.loads((ROOT / '.github' / 'workflow-inventory.json').read_text(encoding='utf-8'))
workflows_dir = ROOT / '.github' / 'workflows'
existing = {path.name for path in workflows_dir.glob('*.yml')} | {path.name for path in workflows_dir.glob('*.yaml')}
required = set(manifest['required_workflows'])
missing_workflows = sorted(required - existing)
if missing_workflows:
    raise SystemExit(f"Missing required workflows: {', '.join(missing_workflows)}")

missing_files = [path for path in manifest['required_repo_files'] if not (ROOT / path).exists()]
if missing_files:
    raise SystemExit(f"Missing required repository files: {', '.join(missing_files)}")

print(f"Validated {len(existing)} workflow files; required set is satisfied.")
