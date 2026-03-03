import { MemorySourceType } from '@prisma/client'
import { prisma } from '../prisma'

export class MemoryService {
  async linkMemory(tenantId: string, taskId: string, memoryId: string) {
    return prisma.$transaction(async (tx) => {
      const [task, memory] = await Promise.all([
        tx.agentTask.findFirst({ where: { id: taskId, tenantId }, select: { id: true } }),
        tx.longTermMemory.findFirst({ where: { id: memoryId, tenantId }, select: { id: true } })
      ])

      if (!task) {
        throw new Error('Task not found for tenant')
      }

      if (!memory) {
        throw new Error('Memory not found for tenant')
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
          tenantId,
          taskId,
          memoryId
        }
      })
    })
  }

  async storeLongTermMemory(
    tenantId: string,
    userId: string,
    sourceType: MemorySourceType,
    sourceId: string,
    embeddingId: string,
    summary: string
  ) {
    return prisma.longTermMemory.create({
      data: {
        tenantId,
        userId,
        sourceType,
        sourceId,
        embeddingId,
        summary
      }
    })
  }

  async getTaskMemories(tenantId: string, taskId: string) {
    return prisma.longTermMemoryLink.findMany({
      where: { tenantId, taskId },
      include: { memory: true },
      orderBy: { createdAt: 'desc' }
    })
  }
}
