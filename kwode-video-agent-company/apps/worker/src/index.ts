import "dotenv/config";
import pino from "pino";
import { prisma } from "../../../packages/schemas/src/db.js";
import { runOneAgent } from "../../../packages/workflow-engine/src/agent-chain.js";
import { happyPathNext, JobStatus } from "../../../packages/workflow-engine/src/state-machine.js";

const log = pino({ level: process.env.LOG_LEVEL ?? "info" });

/**
 * Worker (MVP scope):
 *   - Polls for jobs whose status implies an agent should run next.
 *   - Runs the next agent in the chain.
 *   - Stops at qa_pending / client_review (operator-driven gates).
 *
 * Backed by polling, not Redis, in MVP. The infra-level Redis service is
 * provisioned so an upgrade to BullMQ is a code-only change.
 */

const STATUS_TO_AGENT: Partial<Record<JobStatus, string>> = {
  intake_received: "creative-brief-agent",
  brief_approved: "scriptwriter-agent",
  script_ready: "storyboard-director-agent",
  storyboard_ready: "prompt-engineer-agent",
  prompts_ready: "qa-reviewer-agent",
  // qa_passed → client_review is a manual gate; the worker stops here.
};

async function tick(): Promise<void> {
  const candidates = await prisma.videoJob.findMany({
    where: { status: { in: Object.keys(STATUS_TO_AGENT) as JobStatus[] } },
    orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    take: 5,
  });
  for (const job of candidates) {
    const agentId = STATUS_TO_AGENT[job.status as JobStatus];
    if (!agentId) continue;
    log.info({ jobId: job.id, agentId, from: job.status }, "worker: advancing job");
    try {
      await runOneAgent({ jobId: job.id, agentId, actor: "worker" });
    } catch (err) {
      log.error({ jobId: job.id, err: (err as Error).message }, "worker: agent run failed");
    }
  }
}

async function main(): Promise<void> {
  log.info("kwode worker starting (poll interval 5s)");
  // Express tick to avoid sleeping forever.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      await tick();
    } catch (err) {
      log.error({ err: (err as Error).message }, "worker tick failed");
    }
    await new Promise((r) => setTimeout(r, 5000));
  }
}

main().catch((err) => {
  log.fatal({ err }, "worker crashed");
  process.exit(1);
});

// silence unused-import lint in MVP
void happyPathNext;
