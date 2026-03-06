// services/task.service.ts
import { prisma } from '../prisma'
import { ToolService } from './tool.service'

export class TaskService {
  private toolService = new ToolService()

  async createTask(sessionId: string, goal: string) {
    return prisma.agentTask.create({
      data: {
        sessionId,
        goal,
        status: 'PENDING' // Start as PENDING, executor will set it to RUNNING
      }
    })
  }

  async initializeSteps(taskId: string, steps: any[]) {
    await prisma.taskStep.createMany({
      data: steps.map((step, index) => ({
        taskId,
        stepIndex: index,
        actionName: step.action,
        inputPayload: step.input,
        status: 'PENDING'
      }))
    })
  }

  async executeTask(taskId: string) {
    const task = await prisma.agentTask.findUnique({
      where: { id: taskId },
      include: { steps: { orderBy: { stepIndex: 'asc' } } }
    })

    if (!task) throw new Error('Task not found')

    // Guard clause to prevent re-running a finished task
    if (task.status === 'COMPLETED' || task.status === 'CANCELLED') {
      console.log(`Task ${taskId} is already finished. Skipping execution.`)
      return { success: true, status: task.status }
    }

    // --- BUG FIX --- 
    // Immediately update task status to RUNNING, crucial for resuming failed tasks.
    await prisma.agentTask.update({
      where: { id: taskId },
      data: { status: 'RUNNING' }
    });

    // Find the first step that is not completed
    const startingStepIndex = task.steps.findIndex(s => s.status !== 'SUCCESS');
    if (startingStepIndex === -1) { // All steps already completed
        await prisma.agentTask.update({ where: { id: taskId }, data: { status: 'COMPLETED', completedAt: new Date() } });
        return { success: true, status: 'COMPLETED' };
    }

    for (let i = startingStepIndex; i < task.steps.length; i++) {
      const step = task.steps[i];

      // Reset step status to PENDING before execution, in case it was FAILED
      await prisma.taskStep.update({
        where: { id: step.id },
        data: { status: 'PENDING', startedAt: new Date() }
      })

      try {
        const result = await this.toolService.executeTool(
          taskId,
          step.id,
          step.actionName,
          step.inputPayload
        )

        await prisma.taskStep.update({
          where: { id: step.id },
          data: {
            status: 'SUCCESS',
            outputPayload: result,
            finishedAt: new Date()
          }
        })

      } catch (err: any) {
        console.error(`Error executing step ${step.id} for task ${taskId}:`, err)

        await prisma.taskStep.update({
          where: { id: step.id },
          data: { status: 'FAILED', outputPayload: { error: err.message } }
        })

        await prisma.agentTask.update({
          where: { id: taskId },
          data: { status: 'FAILED' }
        })

        // Stop the loop and throw the error to be handled by the caller
        throw err
      }
    }

    // If the loop completes without errors, mark the task as COMPLETED
    await prisma.agentTask.update({
      where: { id: taskId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date()
      }
    })

    return { success: true, status: 'COMPLETED' }
  }
}
