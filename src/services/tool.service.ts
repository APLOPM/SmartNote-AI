import { prisma } from '../prisma'
import type {
  CreateDocumentArgs,
  SummarizeNoteArgs,
  SupportedToolName
} from '../llm/tool.registry'

type ToolParameters = SummarizeNoteArgs | CreateDocumentArgs

type TaskExecutionResult = {
  output: Record<string, unknown>
  costUsd: number
}

export class ToolService {
  private buildToolOutput(
    taskId: string,
    stepId: string,
    toolName: SupportedToolName,
    parameters: ToolParameters
  ) {
    switch (toolName) {
      case 'summarize_note': {
        const input = parameters as SummarizeNoteArgs
        const summary = input.text
          .split(/\n+/)
          .map((line) => line.trim())
          .filter(Boolean)
          .slice(0, 5)
          .map((line) => `• ${line}`)
          .join('\n')

        return {
          taskId,
          stepId,
          toolName,
          summary: summary || '• ไม่มีข้อมูลเพียงพอสำหรับการสรุป'
        }
      }

      case 'create_document': {
        const input = parameters as CreateDocumentArgs

        return {
          taskId,
          stepId,
          toolName,
          fileUrl: `https://cdn.smartnote.ai/generated/${encodeURIComponent(input.title)}.${input.format}`,
          title: input.title,
          format: input.format
        }
      }

      default:
        throw new Error(`Unknown tool: ${toolName}`)
    }
  }

  async executeTool(
    tenantId: string,
    taskId: string,
    stepId: string,
    toolName: SupportedToolName,
    parameters: ToolParameters
  ): Promise<TaskExecutionResult>
  async executeTool(
    taskId: string,
    stepId: string,
    toolName: SupportedToolName,
    parameters: ToolParameters
  ): Promise<Record<string, unknown>>
  async executeTool(...args: [string, string, string, SupportedToolName, ToolParameters] | [string, string, SupportedToolName, ToolParameters]) {
    if (args.length === 5) {
      const [tenantId, taskId, stepId, toolName, parameters] = args
      const output = this.buildToolOutput(taskId, stepId, toolName, parameters)

      await prisma.toolExecution.create({
        data: {
          tenantId,
          taskId,
          stepId,
          toolName,
          parameters,
          result: output,
          success: true,
          latencyMs: 0,
          costUsd: 0
        }
      })

      return { output, costUsd: 0 }
    }

    const [taskId, stepId, toolName, parameters] = args
    return this.buildToolOutput(taskId, stepId, toolName, parameters)
  }
}
