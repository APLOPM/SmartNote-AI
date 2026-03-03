import { AgentExecutor } from "../llm/agent.executor";

async function main() {
  const executor = new AgentExecutor();

  const result = await executor.run(
    "จากบันทึกนี้ สร้างรายงาน 500 คำ แล้วจัดรูปแบบเป็น docx",
    {
      taskId: "demo-task-001",
      maxSteps: 10,
    },
  );

  console.log("Final Output:", result.output);
  console.log("Token Usage:", result.tokenUsage);
  console.log("Steps:", result.steps);
}

main().catch((error) => {
  console.error("Agent execution failed:", error);
  process.exit(1);
});
