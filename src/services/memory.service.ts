import { MemorySourceType } from '@prisma/client'
import { prisma } from '../prisma'

export class MemoryService {
  async linkMemory(taskId: string, memoryId: string) {
    return prisma.longTermMemoryLink.create({
      data: {
        taskId,
        memoryId
      }
    })
  }

  async storeLongTermMemory(
    userId: string,
    sourceType: MemorySourceType,
    sourceId: string,
    embeddingId: string,
    summary: string
  ) {
    return prisma.longTermMemory.create({
      data: {
        userId,
        sourceType,
        sourceId,
        embeddingId,
        summary
      }
    })
  }
}
