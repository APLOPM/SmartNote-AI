import { AgentService } from './services/agent.service'

async function run() {
  const agent = new AgentService()

  await agent.runAgent('tenant-uuid', 'session-uuid', 'จากบันทึกนี้ สร้างรายงานและส่งเมลให้ทีม')
}

void run()
