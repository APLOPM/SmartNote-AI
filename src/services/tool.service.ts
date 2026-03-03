import { prisma } from '../prisma'

export type ToolExecutionResult = {
  output: Record<string, unknown>
  costUsd: number
}

export class ToolService {
  async executeTool(
    tenantId: string,
    taskId: string,
    stepId: string,
    toolName: string,
    parameters: Record<string, unknown>
  ): Promise<ToolExecutionResult> {
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

      const costUsd = this.estimateCostUsd(toolName, parameters, result)

      await prisma.toolExecution.create({
        data: {
          tenantId,
          taskId,
          stepId,
          toolName,
          parameters,
          result,
          success: true,
          latencyMs: Date.now() - startedAt,
          costUsd
        }
      })

      return {
        output: result,
        costUsd
      }
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

  private estimateCostUsd(
    toolName: string,
    parameters: Record<string, unknown>,
    result: Record<string, unknown>
  ) {
    const payloadSize = JSON.stringify(parameters).length + JSON.stringify(result).length

    if (toolName === 'summarize_note') {
      return Number((0.0001 + payloadSize * 0.000001).toFixed(4))
    }

    if (toolName === 'create_document') {
      return Number((0.0002 + payloadSize * 0.0000005).toFixed(4))
    }

    return 0
  }
}
