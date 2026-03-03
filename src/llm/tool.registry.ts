import { z } from "zod";

export type ToolDefinition = {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, unknown>;
    required: string[];
    additionalProperties?: boolean;
  };
};

export const toolDefinitions: ToolDefinition[] = [
  {
    name: "summarize_note",
    description: "Summarize a note into concise bullet points",
    parameters: {
      type: "object",
      properties: {
        text: { type: "string", minLength: 1 },
      },
      required: ["text"],
      additionalProperties: false,
    },
  },
  {
    name: "create_document",
    description: "Create a formatted document",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", minLength: 1 },
        content: { type: "string", minLength: 1 },
        format: { type: "string", enum: ["docx", "pdf"] },
      },
      required: ["title", "content", "format"],
      additionalProperties: false,
    },
  },
];

const summarizeNoteArgsSchema = z.object({
  text: z.string().min(1),
});

const createDocumentArgsSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  format: z.enum(["docx", "pdf"]),
});

export const toolArgumentSchemas = {
  summarize_note: summarizeNoteArgsSchema,
  create_document: createDocumentArgsSchema,
} as const;

export type SummarizeNoteArgs = z.infer<typeof summarizeNoteArgsSchema>;
export type CreateDocumentArgs = z.infer<typeof createDocumentArgsSchema>;

export type SupportedToolName = keyof typeof toolArgumentSchemas;
