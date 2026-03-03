import type {
  CreateDocumentArgs,
  SummarizeNoteArgs,
  SupportedToolName,
} from "../llm/tool.registry";

export class ToolService {
  async executeTool(
    taskId: string,
    stepId: string,
    toolName: SupportedToolName,
    parameters: SummarizeNoteArgs | CreateDocumentArgs,
  ) {
    switch (toolName) {
      case "summarize_note": {
        const input = parameters as SummarizeNoteArgs;
        const summary = input.text
          .split(/\n+/)
          .map((line) => line.trim())
          .filter(Boolean)
          .slice(0, 5)
          .map((line) => `• ${line}`)
          .join("\n");

        return {
          taskId,
          stepId,
          toolName,
          summary: summary || "• ไม่มีข้อมูลเพียงพอสำหรับการสรุป",
        };
      }

      case "create_document": {
        const input = parameters as CreateDocumentArgs;

        return {
          taskId,
          stepId,
          toolName,
          fileUrl: `https://cdn.smartnote.ai/generated/${encodeURIComponent(input.title)}.${input.format}`,
          title: input.title,
          format: input.format,
        };
      }

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }
}
