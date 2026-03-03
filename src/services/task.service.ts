import { Prisma, StepStatus, TaskStatus } from '@prisma/client'
import { prisma } from '../prisma'
import { ToolService } from './tool.service'

type StepInput = {
  action: string
  input: Record<string, unknown>
}

type TaskSnapshot = {
  taskId: string
  tenantId: string
  lastSuccessfulStepIndex: number
  recoveredAt: string
  lastStepOutput: Record<string, unknown> | null
}

const MAX_STEPS = 100
const MAX_RETRY_ATTEMPTS = 3
const BASE_RETRY_DELAY_MS = 250

export class TaskService {
  private toolService = new ToolService()

  private async updateStepForTenant(
    tenantId: string,
    stepId: string,
    data: Parameters<typeof prisma.taskStep.updateMany>[0]['data']
  ) {
    const result = await prisma.taskStep.updateMany({
      where: { id: stepId, tenantId },
      data
    })

    if (result.count === 0) {
      throw new Error('Task step not found for tenant')
    }
  }

  private async wait(ms: number) {
    await new Promise((resolve) => setTimeout(resolve, ms))
  }

  async recoverSnapshot(tenantId: string, taskId: string): Promise<TaskSnapshot | null> {
    const snapshot = await prisma.auditLog.findFirst({
      where: {
        tenantId,
        entityType: 'TASK_SNAPSHOT',
        entityId: taskId
      },
      orderBy: { createdAt: 'desc' }
    })

    if (!snapshot) {
      return null
    }

    const metadata = snapshot.metadata as Prisma.JsonObject

    return {
      taskId,
      tenantId,
      lastSuccessfulStepIndex: Number(metadata.stepIndex ?? -1),
      recoveredAt: snapshot.createdAt.toISOString(),
      lastStepOutput: (metadata.outputPayload as Record<string, unknown>) ?? null
    }
  }

  async createTask(tenantId: string, sessionId: string, goal: string) {
    return prisma.agentTask.create({
      data: {
        tenantId,
        sessionId,
        goal,
        status: TaskStatus.RUNNING
      }
    })
  }

  async initializeSteps(tenantId: string, taskId: string, steps: StepInput[]) {
    if (steps.length > MAX_STEPS) {
      throw new Error(`Plan exceeds maximum allowed steps (${MAX_STEPS})`)
    }

    await prisma.taskStep.createMany({
      data: steps.map((step, index) => ({
        tenantId,
        taskId,
        stepIndex: index,
        actionName: step.action,
        inputPayload: step.input,
        status: StepStatus.PENDING
      }))
    })
  }

  async executeTask(tenantId: string, taskId: string, resumeKey?: string) {
    const task = await prisma.agentTask.findFirst({
      where: { id: taskId, tenantId },
      include: {
        steps: {
          orderBy: { stepIndex: 'asc' }
        }
      }
    })

    if (!task) {
      throw new Error('Task not found for tenant')
    }

    if (task.status === TaskStatus.COMPLETED) {
      return { success: true, idempotent: true }
    }

    const claimed = await prisma.agentTask.updateMany({
      where: {
        id: taskId,
        tenantId,
        status: { in: [TaskStatus.PENDING, TaskStatus.FAILED, TaskStatus.RUNNING] }
      },
      data: { status: TaskStatus.RUNNING }
    })

    if (claimed.count === 0) {
      throw new Error('Task is locked by another worker')
    }

    const snapshot = await this.recoverSnapshot(tenantId, taskId)

    for (const step of task.steps) {
      if (step.status === StepStatus.SUCCESS) {
        continue
      }

      await this.updateStepForTenant(tenantId, step.id, {
        status: StepStatus.RUNNING,
        startedAt: new Date(),
        errorMessage: null
      })

      let lastError: unknown = null

      for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt += 1) {
        try {
          const result = await this.toolService.executeTool(
            tenantId,
            taskId,
            step.id,
            step.actionName,
            {
              ...(step.inputPayload as Record<string, unknown>),
              _resume: {
                resumeKey: resumeKey ?? null,
                snapshot
              }
            }
          )

          await prisma.$transaction(async (tx) => {
            await tx.taskStep.updateMany({
              where: { id: step.id, tenantId },
              data: {
                status: StepStatus.SUCCESS,
                outputPayload: result.output,
                finishedAt: new Date()
              }
            })

            await tx.auditLog.create({
              data: {
                tenantId,
                entityType: 'TASK_SNAPSHOT',
                entityId: taskId,
                action: 'STEP_COMPLETED',
                metadata: {
                  stepIndex: step.stepIndex,
                  outputPayload: result.output,
                  snapshotAt: new Date().toISOString()
                }
              }
            })
          })

          lastError = null
          break
        } catch (error) {
          lastError = error

          if (attempt < MAX_RETRY_ATTEMPTS) {
            await this.wait(BASE_RETRY_DELAY_MS * 2 ** (attempt - 1))
          }
        }
      }

      if (lastError) {
        await this.updateStepForTenant(tenantId, step.id, {
          status: StepStatus.FAILED,
          finishedAt: new Date(),
          errorMessage: lastError instanceof Error ? lastError.message : 'Unknown step error'
        })

        await prisma.agentTask.updateMany({
          where: { id: taskId, tenantId },
          data: { status: TaskStatus.FAILED }
        })

        throw lastError
      }
    }

    const cost = await prisma.toolExecution.aggregate({
      where: { taskId, tenantId },
      _sum: { costUsd: true }
    })

    await prisma.agentTask.updateMany({
      where: { id: taskId, tenantId },
      data: {
        status: TaskStatus.COMPLETED,
        completedAt: new Date(),
        totalCostUsd: cost._sum.costUsd ?? 0
      }
    })

    return { success: true }
  }
}
