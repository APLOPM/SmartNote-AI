import { AgentRegistry } from './agent-registry'
import { ContextManager } from './context-manager'
import { ExecutionEngine } from './execution-engine'
import { MemoryManager } from './memory-manager'
import { ResultAggregator } from './result-aggregator'
import { TaskRouter } from './task-router'
import type { PlannerAgent } from './types'

export class AgentOrchestrator {
  constructor(
    private readonly registry: AgentRegistry,
    private readonly router = new TaskRouter(),
    private readonly memory = new MemoryManager(),
    private readonly contextManager = new ContextManager(),
    private readonly executor = new ExecutionEngine(),
    private readonly aggregator = new ResultAggregator(),
    private readonly planner?: PlannerAgent
  ) {}

  async handle(userInput: string): Promise<string> {
    const memorySnapshot = this.memory.retrieve(userInput)
    const draftContext = {
      userInput,
      history: memorySnapshot.shortTerm,
      knowledge: memorySnapshot.longTerm
    }

    const plan = this.planner
      ? await this.planner.createPlan(userInput, draftContext)
      : this.router.route(userInput)

    const context = this.contextManager.buildContext(userInput, memorySnapshot, plan.intent)
    const results = await this.executor.runDag(plan.tasks, (agentId) => this.registry.get(agentId), context)
    const output = this.aggregator.combine(results)

    this.memory.store(output)
    return output
  }
}
