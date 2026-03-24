import type { AgentContext, AgentResult, BaseAgent, TaskNode } from './types'

export class ExecutionEngine {
  async runTask(agent: BaseAgent, task: TaskNode, context: AgentContext): Promise<AgentResult> {
    return agent.execute(task, context)
  }

  async runParallel(jobs: Array<Promise<AgentResult>>): Promise<AgentResult[]> {
    return Promise.all(jobs)
  }

  async runDag(
    tasks: TaskNode[],
    getAgent: (agentId: string) => BaseAgent,
    context: AgentContext
  ): Promise<AgentResult[]> {
    const taskMap = new Map(tasks.map((task) => [task.id, task]))
    const completed = new Set<string>()
    const results: AgentResult[] = []

    while (completed.size < tasks.length) {
      const ready = tasks.filter((task) => {
        if (completed.has(task.id)) {
          return false
        }

        return (task.dependsOn ?? []).every((dependency) => completed.has(dependency))
      })

      if (ready.length === 0) {
        throw new Error('DAG contains circular dependency or unresolved task reference')
      }

      const batch = await this.runParallel(
        ready.map(async (task) => {
          const agent = getAgent(task.agentId)
          return this.runTask(agent, task, context)
        })
      )

      for (const result of batch) {
        if (!taskMap.has(result.taskId)) {
          throw new Error(`Agent returned unknown task id: ${result.taskId}`)
        }

        completed.add(result.taskId)
        results.push(result)
      }
    }

    return results
  }
}
