import assert from 'node:assert/strict'
import test from 'node:test'

import { AgentOrchestrator } from '../src/orchestrator/agent-orchestrator'
import { AgentRegistry } from '../src/orchestrator/agent-registry'
import { RuleBasedPlannerAgent } from '../src/orchestrator/planner-agent'
import type { AgentContext, AgentResult, BaseAgent, TaskNode } from '../src/orchestrator/types'

class StubAgent implements BaseAgent {
  constructor(
    readonly metadata: BaseAgent['metadata'],
    private readonly responder: (task: TaskNode, context: AgentContext) => string
  ) {}

  async execute(task: TaskNode, context: AgentContext): Promise<AgentResult> {
    return {
      taskId: task.id,
      agentId: this.metadata.agentId,
      output: this.responder(task, context)
    }
  }
}

function createRegistry() {
  const registry = new AgentRegistry()

  registry.register(
    new StubAgent(
      {
        agentId: 'research_agent',
        role: 'research',
        skills: ['search'],
        tools: ['web_search'],
        model: 'gpt-5',
        temperature: 0.3
      },
      (task) => `Research complete: ${task.task}`
    )
  )

  registry.register(
    new StubAgent(
      {
        agentId: 'critic_agent',
        role: 'critic',
        skills: ['qa'],
        tools: ['risk_review'],
        model: 'gpt-5',
        temperature: 0.2
      },
      (_, context) => `Critic reviewed intent=${context.intent}`
    )
  )

  registry.register(
    new StubAgent(
      {
        agentId: 'writing_agent',
        role: 'writing',
        skills: ['summarize'],
        tools: ['editor'],
        model: 'gpt-5',
        temperature: 0.4
      },
      (task, context) => `Final: ${task.task} | history=${context.history.length}`
    )
  )

  return registry
}

test('orchestrator executes planner DAG and aggregates outputs', async () => {
  const orchestrator = new AgentOrchestrator(createRegistry(), undefined, undefined, undefined, undefined, undefined, new RuleBasedPlannerAgent())

  const output = await orchestrator.handle('ช่วย research ระบบ multi-agent สำหรับ SmartNote')

  assert.match(output, /\[research_agent\]/)
  assert.match(output, /\[critic_agent\]/)
  assert.match(output, /\[writing_agent\]/)
})

test('orchestrator can fallback to router when planner is not provided', async () => {
  const orchestrator = new AgentOrchestrator(createRegistry())
  const output = await orchestrator.handle('research Thai and English UX baseline')

  assert.match(output, /Research complete/)
  assert.match(output, /Final:/)
})
