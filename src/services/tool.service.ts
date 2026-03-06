import { prisma } from '../prisma';

// --- NEW: Retry Utility ---
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function retry<T>(
  fn: () => Promise<T>,
  options: { retries: number; delayMs: number }
): Promise<T> {
  let lastError: Error | undefined;
  for (let i = 0; i <= options.retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      if (i < options.retries) {
        console.log(`Attempt ${i + 1} failed. Retrying in ${options.delayMs * (i + 1)}ms...`);
        await delay(options.delayMs * (i + 1)); // Exponential backoff
      }
    }
  }
  throw lastError;
}

// --- End of Retry Utility ---

export class ToolService {

  // Refactored to use the retry mechanism
  async executeTool(
    taskId: string,
    stepId: string,
    toolName: string,
    parameters: any,
    maxRetries: number = 3 // Make it configurable
  ) {
    const start = Date.now();
    let result: any;
    let success = false;
    let latency = 0;
    let retryCount = 0;

    const toolExecutor = async () => {
        switch (toolName) {
            case 'summarize_note':
                return await this.summarize(parameters);
            case 'create_document':
                return await this.createDoc(parameters);
            default:
                throw new Error(`Unknown tool: ${toolName}`);
        }
    };

    try {
        result = await retry(toolExecutor, { retries: maxRetries, delayMs: 1000 });
        success = true;
    } catch (error: any) {
        result = { error: error.message };
        success = false;
        // If all retries fail, we will log it, and the TaskService will handle the FAILED state.
        console.error(`Tool ${toolName} failed after ${maxRetries} retries for step ${stepId}`);
        throw error; // Re-throw the error to be caught by TaskService
    } finally {
        latency = Date.now() - start;
        
        // Find previous executions for this step to calculate retry count
        const previousExecutions = await prisma.toolExecution.count({
            where: { stepId: stepId }
        });
        retryCount = previousExecutions;

        // Log the final outcome of the tool execution (either success or final failure)
        await prisma.toolExecution.create({
            data: {
                taskId,
                stepId,
                toolName,
                parameters,
                result,
                success,
                latencyMs: latency,
                retryCount // --- NEW: Logging retry count
            }
        });
    }

    return result;
  }

  // Mock tool implementations remain the same
  private async summarize(input: any) {
    // Simulate a potentially flaky API call
    if (Math.random() < 0.5) { // 50% chance of failure
        throw new Error("Mock API Error: Failed to summarize");
    }
    return { summary: "Summarized content..." };
  }

  private async createDoc(input: any) {
    return { fileUrl: "https://cdn.smartnote.ai/doc/123" };
  }
}
