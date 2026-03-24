import type { AgentContext, PlannerAgent, TaskPlan } from './types'

export class RuleBasedPlannerAgent implements PlannerAgent {
  async createPlan(userInput: string, context: Omit<AgentContext, 'intent'>): Promise<TaskPlan> {
    const hasResearchIntent = /research|analyze|ค้นหา|วิเคราะห์/i.test(userInput)

    if (hasResearchIntent) {
      return {
        intent: 'research',
        tasks: [
          {
            id: 'planner-research',
            agentId: 'research_agent',
            task: `Research request: ${context.userInput}`
          },
          {
            id: 'planner-critic',
            agentId: 'critic_agent',
            task: 'Critique factual quality and risk',
            dependsOn: ['planner-research']
          },
          {
            id: 'planner-writing',
            agentId: 'writing_agent',
            task: 'Compose bilingual Thai/English summary with UX-safe wording',
            dependsOn: ['planner-critic']
          }
        ]
      }
    }

    return {
      intent: 'assist',
      tasks: [
        {
          id: 'planner-writing',
          agentId: 'writing_agent',
          task: `Respond in Thai and English: ${context.userInput}`
        }
      ]
    }
  }
}
