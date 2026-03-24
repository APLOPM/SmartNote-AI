export type AgentRole = 'planner' | 'research' | 'writing' | 'critic' | 'tool' | string

export type AgentMetadata = {
  agentId: string
  role: AgentRole
  skills: string[]
  tools: string[]
  model: string
  temperature: number
}

export type ExecutionMode = 'sequential' | 'parallel'

export type TaskNode = {
  id: string
  agentId: string
  task: string
  dependsOn?: string[]
  executionMode?: ExecutionMode
  payload?: Record<string, unknown>
}

export type TaskPlan = {
  intent: string
  tasks: TaskNode[]
}

export type MemorySnapshot = {
  shortTerm: string[]
  longTerm: string[]
}

export type AgentContext = {
  userInput: string
  history: string[]
  knowledge: string[]
  intent: string
}

export type AgentResult = {
  taskId: string
  agentId: string
  output: string
}

export interface BaseAgent {
  readonly metadata: AgentMetadata
  execute(task: TaskNode, context: AgentContext): Promise<AgentResult>
}

export interface PlannerAgent {
  createPlan(userInput: string, context: Omit<AgentContext, 'intent'>): Promise<TaskPlan>
}
