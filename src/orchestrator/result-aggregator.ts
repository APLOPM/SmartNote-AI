import type { AgentResult } from './types'

export class ResultAggregator {
  combine(results: AgentResult[]): string {
    return results.map((result) => `[${result.agentId}] ${result.output}`).join('\n')
  }
}
