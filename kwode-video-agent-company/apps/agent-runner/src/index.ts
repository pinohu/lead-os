import "dotenv/config";
import pino from "pino";
import { loadAgentDefinitions } from "../../../packages/agents/src/loader.js";

const log = pino({ level: process.env.LOG_LEVEL ?? "info" });

/**
 * Long-lived agent runner.
 *
 * In MVP this process simply loads the agent registry at boot to validate
 * that all 50 definitions parse correctly, then idles. Future revisions:
 *   - Subscribe to a job-step queue.
 *   - Hold a persistent Hermes worker connection.
 *   - Shard agents across multiple processes.
 */
async function main(): Promise<void> {
  const defs = loadAgentDefinitions();
  const byDept = defs.reduce<Record<string, number>>((acc, a) => {
    acc[a.department] = (acc[a.department] ?? 0) + 1;
    return acc;
  }, {});
  log.info({ count: defs.length, departments: byDept }, "agent-runner: loaded agent registry");

  // Heartbeat
  // eslint-disable-next-line no-constant-condition
  while (true) {
    await new Promise((r) => setTimeout(r, 30_000));
    log.info({ count: defs.length, ts: new Date().toISOString() }, "agent-runner heartbeat");
  }
}

main().catch((err) => {
  log.fatal({ err }, "agent-runner crashed");
  process.exit(1);
});
