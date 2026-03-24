import type { BaseAgent } from './types'

export class AgentRegistry {
  private readonly agents = new Map<string, BaseAgent>()

  register(agent: BaseAgent): void {
    this.agents.set(agent.metadata.agentId, agent)
  }

  get(agentId: string): BaseAgent {
    const agent = this.agents.get(agentId)
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`)
    }

    return agent
  }

  list(): string[] {
    return Array.from(this.agents.keys())
  }
}
