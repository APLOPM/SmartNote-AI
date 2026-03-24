import type { TaskPlan } from './types'

export class TaskRouter {
  route(userInput: string): TaskPlan {
    const normalized = userInput.toLowerCase()

    if (normalized.includes('research') || normalized.includes('ค้นหา')) {
      return {
        intent: 'research',
        tasks: [
          { id: 'research-1', agentId: 'research_agent', task: 'find information' },
          {
            id: 'writing-1',
            agentId: 'writing_agent',
            task: 'summarize findings',
            dependsOn: ['research-1']
          }
        ]
      }
    }

    return {
      intent: 'general_assistance',
      tasks: [
        { id: 'planner-1', agentId: 'writing_agent', task: 'generate a structured response' }
      ]
    }
  }
}
