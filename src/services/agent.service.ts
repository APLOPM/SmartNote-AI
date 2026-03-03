import { Planner } from '../llm/planner'
import { TaskService } from './task.service'

export class AgentService {
  private taskService = new TaskService()
  private planner = new Planner()

  async runAgent(sessionId: string, goal: string) {
    const task = await this.taskService.createTask(sessionId, goal)
    const plan = await this.planner.generatePlan(goal)

    await this.taskService.initializeSteps(task.id, plan.steps)
    await this.taskService.executeTask(task.id)

    return { taskId: task.id }
  }

  async resumeTask(taskId: string) {
    return this.taskService.executeTask(taskId)
  }
}
