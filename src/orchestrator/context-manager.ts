import type { AgentContext, MemorySnapshot } from './types'

export class ContextManager {
  buildContext(userInput: string, memory: MemorySnapshot, intent: string): AgentContext {
    return {
      userInput,
      history: memory.shortTerm,
      knowledge: memory.longTerm,
      intent
    }
  }
}
