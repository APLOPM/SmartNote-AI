import type { MemorySnapshot } from './types'

export class MemoryManager {
  private readonly memoryStore = new Map<string, string[]>()

  retrieve(query: string): MemorySnapshot {
    return {
      shortTerm: [`recent-query:${query.slice(0, 80)}`],
      longTerm: this.memoryStore.get('global') ?? []
    }
  }

  store(data: string): void {
    const existing = this.memoryStore.get('global') ?? []
    this.memoryStore.set('global', [...existing, data].slice(-100))
  }
}
