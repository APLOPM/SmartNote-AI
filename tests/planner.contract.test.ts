import test from 'node:test';
import assert from 'node:assert/strict';

import { Planner } from '../src/llm/planner';
import { toolArgumentSchemas, type SupportedToolName } from '../src/llm/tool.registry';

test('planner generates steps that map to supported tools and satisfy schemas', async () => {
  const planner = new Planner();
  const plan = await planner.generatePlan('Create a meeting brief and export a document for the product team.');

  assert.ok(plan.steps.length >= 2, 'expected at least two planned steps');

  for (const step of plan.steps) {
    assert.ok(step.action in toolArgumentSchemas, `unsupported tool: ${step.action}`);
    const schema = toolArgumentSchemas[step.action as SupportedToolName];
    assert.doesNotThrow(() => schema.parse(step.input), `invalid payload for ${step.action}`);
  }

  const createDocumentStep = plan.steps.find((step: (typeof plan.steps)[number]) => step.action === 'create_document');
  assert.ok(createDocumentStep, 'expected create_document step');
  const payload = createDocumentStep!.input as Record<string, unknown>;
  assert.equal(typeof payload.title, 'string');
  assert.equal(typeof payload.content, 'string');
  assert.equal(payload.format, 'docx');
});
