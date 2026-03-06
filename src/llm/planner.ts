// llm/planner.ts
export class Planner {

  async generatePlan(goal: string) {
    // Replace with real LLM call
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
