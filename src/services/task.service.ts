import { StepStatus, TaskStatus } from '@prisma/client'
import { prisma } from '../prisma'
import { ToolService } from './tool.service'

type StepInput = {
  action: string
  input: Record<string, unknown>
}

const MAX_STEPS = 100

export class TaskService {
  private toolService = new ToolService()

  async createTask(sessionId: string, goal: string) {
    return prisma.agentTask.create({
      data: {
        sessionId,
        goal,
        status: TaskStatus.RUNNING
      }
    })
  }

  async initializeSteps(taskId: string, steps: StepInput[]) {
    if (steps.length > MAX_STEPS) {
      throw new Error(`Plan exceeds maximum allowed steps (${MAX_STEPS})`)
    }

    await prisma.taskStep.createMany({
      data: steps.map((step, index) => ({
        taskId,
        stepIndex: index,
        actionName: step.action,
        inputPayload: step.input,
        status: StepStatus.PENDING
      }))
    })
  }

  async executeTask(taskId: string) {
    const task = await prisma.agentTask.findUnique({
      where: { id: taskId },
      include: {
        steps: {
          orderBy: { stepIndex: 'asc' }
        }
      }
    })

    if (!task) {
      throw new Error('Task not found')
    }

    for (const step of task.steps) {
      if (step.status === StepStatus.SUCCESS) {
        continue
      }

      await prisma.taskStep.update({
        where: { id: step.id },
        data: {
          status: StepStatus.RUNNING,
          startedAt: new Date()
        }
      })

      try {
        const result = await this.toolService.executeTool(
          taskId,
          step.id,
          step.actionName,
          step.inputPayload as Record<string, unknown>
        )

        await prisma.taskStep.update({
          where: { id: step.id },
          data: {
            status: StepStatus.SUCCESS,
            outputPayload: result,
            finishedAt: new Date()
          }
        })
      } catch (error) {
        await prisma.taskStep.update({
          where: { id: step.id },
          data: {
            status: StepStatus.FAILED,
            finishedAt: new Date(),
            errorMessage: error instanceof Error ? error.message : 'Unknown step error'
          }
        })

        await prisma.agentTask.update({
          where: { id: taskId },
          data: { status: TaskStatus.FAILED }
        })

        throw error
      }
    }

    const cost = await prisma.toolExecution.aggregate({
      where: { taskId },
      _sum: { costUsd: true }
    })

    await prisma.agentTask.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.COMPLETED,
        completedAt: new Date(),
        totalCostUsd: cost._sum.costUsd ?? 0
      }
    })

    return { success: true }
  }
}
