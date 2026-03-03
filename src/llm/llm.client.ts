import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { toolDefinitions } from "./tool.registry";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class LLMClient {
  async chatWithTools(messages: ChatCompletionMessageParam[]) {
    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      messages,
      tools: toolDefinitions.map((t) => ({
        type: "function" as const,
        function: t,
      })),
      tool_choice: "auto",
      temperature: 0.2,
    });

    return {
      message: response.choices[0]?.message,
      usage: response.usage,
    };
  }
}
