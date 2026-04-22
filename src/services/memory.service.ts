import { SourceType } from '@prisma/client'
import { prisma } from '../prisma'

export class MemoryService {
  async linkMemory(taskId: string, memoryId: string) {
    return prisma.$transaction(async (tx) => {
      const [task, memory] = await Promise.all([
        tx.agentTask.findUnique({ where: { id: taskId }, select: { id: true } }),
        tx.longTermMemory.findUnique({ where: { id: memoryId }, select: { id: true } })
      ])

      if (!task) {
        throw new Error('Task not found')
      }

      if (!memory) {
        throw new Error('Memory not found')
      }

      return tx.longTermMemoryLink.upsert({
        where: {
          taskId_memoryId: {
            taskId,
            memoryId
          }
        },
        update: {},
        create: {
          taskId,
          memoryId
        }
      })
    })
  }

  async storeLongTermMemory(
    userId: string,
    workspaceId: string,
    sourceType: SourceType,
    sourceId: string,
    embeddingId: string,
    summary: string,
    options?: {
      projectId?: string
      chunkIndex?: number
      tokenCount?: number
      embeddingModel?: string
    }
  ) {
    return prisma.longTermMemory.create({
      data: {
        userId,
        workspaceId,
        sourceType,
        sourceId,
        embeddingId,
        summary,
        projectId: options?.projectId,
        chunkIndex: options?.chunkIndex,
        tokenCount: options?.tokenCount,
        embeddingModel: options?.embeddingModel
      }
    })
  }

  async getTaskMemories(taskId: string) {
    return prisma.longTermMemoryLink.findMany({
      where: { taskId },
      include: { memory: true },
      orderBy: { memory: { createdAt: 'desc' } }
    })
  }
}
