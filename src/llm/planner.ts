export type PlannedStep = {
  action: string
  input: Record<string, unknown>
}

export type PlanResult = {
  steps: PlannedStep[]
}

export class Planner {
  async generatePlan(goal: string): Promise<PlanResult> {
    return {
      steps: [
        {
          action: 'summarize_note',
          input: { text: goal }
        },
        {
          action: 'create_document',
          input: { format: 'docx' }
        }
      ]
    }
  }
}
