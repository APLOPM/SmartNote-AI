// services/agent.service.ts
import { prisma } from '../prisma'
import { TaskService } from './task.service'
import { Planner } from '../llm/planner'

export class AgentService {
  private taskService = new TaskService()
  private planner = new Planner()

  async runAgent(sessionId: string, goal: string) {
    // 1. Create task
    const task = await this.taskService.createTask(sessionId, goal)

    // 2. Generate plan from LLM
    const plan = await this.planner.generatePlan(goal)

    await this.taskService.initializeSteps(task.id, plan.steps)

    // 3. Execute loop
    await this.taskService.executeTask(task.id)

    return { taskId: task.id }
  }

  async resumeTask(taskId: string) {
    return this.taskService.executeTask(taskId)
  }
}
