import { MemorySourceType } from '@prisma/client'
import { prisma } from '../prisma'

export class MemoryService {
  async linkMemory(tenantId: string, taskId: string, memoryId: string) {
    return prisma.longTermMemoryLink.create({
      data: {
        tenantId,
        taskId,
        memoryId
      }
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
}
