import { TaskStatus } from '@prisma/client'
import { prisma } from '../prisma'
import { Planner } from '../llm/planner'
import { TaskService } from './task.service'

export class AgentService {
  private taskService = new TaskService()
  private planner = new Planner()

  async runAgent(tenantId: string, sessionId: string, goal: string) {
    const task = await this.taskService.createTask(tenantId, sessionId, goal)

    try {
      const plan = await this.planner.generatePlan(goal)

      await this.taskService.initializeSteps(tenantId, task.id, plan.steps)
      await this.taskService.executeTask(tenantId, task.id, `run:${task.id}`)

      return { taskId: task.id }
    } catch (error) {
      await prisma.agentTask.updateMany({
        where: { id: task.id, tenantId },
        data: {
          status: TaskStatus.FAILED,
          completedAt: new Date()
        }
      })

      throw error
    }
  }

  async resumeTask(tenantId: string, taskId: string, resumeKey?: string) {
    const snapshot = await this.taskService.recoverSnapshot(tenantId, taskId)
    const execution = await this.taskService.executeTask(
      tenantId,
      taskId,
      resumeKey ?? `resume:${taskId}`
    )

    return {
      ...execution,
      snapshot
    }
  }
}
