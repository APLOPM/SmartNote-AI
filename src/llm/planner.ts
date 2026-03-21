export type PlannedStep = {
  action: string
  input: Record<string, unknown>
}

export type PlanResult = {
  steps: PlannedStep[]
}

export class Planner {
  async generatePlan(goal: string): Promise<PlanResult> {
    const normalizedGoal = goal.trim()
    const summaryTitle = normalizedGoal.length > 60
      ? `${normalizedGoal.slice(0, 57).trimEnd()}...`
      : normalizedGoal

    return {
      steps: [
        {
          action: 'summarize_note',
          input: { text: normalizedGoal }
        },
        {
          action: 'create_document',
          input: {
            title: `SmartNote AI Brief: ${summaryTitle || 'Untitled Goal'}`,
            content: `Summary and action plan for: ${normalizedGoal || 'Untitled Goal'}`,
            format: 'docx'
          }
        }
      ]
    }
  }
}
