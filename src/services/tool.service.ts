import { prisma } from '../prisma'

export class ToolService {
  async executeTool(
    tenantId: string,
    taskId: string,
    stepId: string,
    toolName: string,
    parameters: Record<string, unknown>
  ) {
    const startedAt = Date.now()

    try {
      let result: Record<string, unknown>

      switch (toolName) {
        case 'summarize_note':
          result = await this.summarize(parameters)
          break
        case 'create_document':
          result = await this.createDoc(parameters)
          break
        default:
          throw new Error(`Unknown tool: ${toolName}`)
      }

      await prisma.toolExecution.create({
        data: {
          tenantId,
          taskId,
          stepId,
          toolName,
          parameters,
          result,
          success: true,
          latencyMs: Date.now() - startedAt
        }
      })

      return result
    } catch (error) {
      await prisma.toolExecution.create({
        data: {
          tenantId,
          taskId,
          stepId,
          toolName,
          parameters,
          result: {},
          success: false,
          errorMessage: error instanceof Error ? error.message : 'Unknown tool error',
          latencyMs: Date.now() - startedAt
        }
      })

      throw error
    }
  }

  private async summarize(_input: Record<string, unknown>) {
    return { summary: 'Summarized content...' }
  }

  private async createDoc(_input: Record<string, unknown>) {
    return { fileUrl: 'https://cdn.smartnote.ai/doc/123' }
  }
}
