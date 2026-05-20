#!/usr/bin/env node
import "dotenv/config";
import { prisma } from "../../../packages/schemas/src/db.js";
import { loadAgentDefinitions, getAgent } from "../../../packages/agents/src/loader.js";
import { getToolRegistry } from "../../../packages/tool-registry/src/loader.js";
import { runOneAgent, runAgentChain } from "../../../packages/workflow-engine/src/agent-chain.js";
import { getVideoType } from "../../../packages/video-catalog/src/loader.js";
import { flags } from "../../../packages/config/src/flags.js";

interface ParsedArgs {
  cmd: string;
  flags: Record<string, string>;
}

function parseArgs(argv: string[]): ParsedArgs {
  const [, , cmd = "help", ...rest] = argv;
  const flags: Record<string, string> = {};
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = rest[i + 1];
      if (next && !next.startsWith("--")) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = "true";
      }
    }
  }
  return { cmd, flags };
}

async function main(): Promise<void> {
  const { cmd, flags: a } = parseArgs(process.argv);
  switch (cmd) {
    case "agents:list": {
      const defs = loadAgentDefinitions();
      for (const d of defs) {
        console.log(`${d.agent_id.padEnd(38)}  ${d.department.padEnd(40)}  ${d.name}`);
      }
      console.log(`\n${defs.length} agents`);
      return;
    }
    case "tools:list": {
      const tools = getToolRegistry();
      for (const t of tools) {
        console.log(
          `${t.tool_id.padEnd(26)}  ${(t.category ?? "").padEnd(20)}  ${(t.connector_status ?? "").padEnd(8)}  ${t.name}`
        );
      }
      console.log(`\n${tools.length} tools`);
      return;
    }
    case "health": {
      let dbOk = false;
      try {
        await prisma.$queryRaw`SELECT 1`;
        dbOk = true;
      } catch (err) {
        console.error("DB check failed:", err instanceof Error ? err.message : err);
      }
      console.log(JSON.stringify({
        dbOk,
        flags,
      }, null, 2));
      return;
    }
    case "video:create-demo": {
      const tenantSlug = a.tenant ?? "kwode-video-factory";
      const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
      if (!tenant) throw new Error(`Tenant ${tenantSlug} not found. Run npm run db:seed first.`);
      const videoTypeId = a["video-type"] ?? "service-explainer";
      const videoType = getVideoType(videoTypeId);
      if (!videoType) throw new Error(`Unknown video type ${videoTypeId}`);
      const job = await prisma.videoJob.create({
        data: {
          tenantId: tenant.id,
          videoTypeId,
          title: a.title ?? `Demo ${videoType.title}`,
          status: "draft",
          metadata: {
            intake: {
              audience: "Erie homeowners",
              goal: "Drive emergency service calls",
              cta: "Call (814) 200-0328",
              durationSec: 45,
              aspectRatio: "9:16",
            },
          } as object,
        },
      });
      console.log(`Created demo job ${job.id}`);
      return;
    }
    case "video:generate-brief":
    case "video:generate-script":
    case "video:generate-storyboard":
    case "video:generate-prompts":
    case "video:qa": {
      const jobId = a.job;
      if (!jobId) throw new Error("--job <id> required");
      const map: Record<string, string> = {
        "video:generate-brief": "creative-brief-agent",
        "video:generate-script": "scriptwriter-agent",
        "video:generate-storyboard": "storyboard-director-agent",
        "video:generate-prompts": "prompt-engineer-agent",
        "video:qa": "qa-reviewer-agent",
      };
      const result = await runOneAgent({ jobId, agentId: map[cmd], actor: "cli" });
      console.log(JSON.stringify(result, null, 2));
      return;
    }
    case "video:run-chain": {
      const jobId = a.job;
      if (!jobId) throw new Error("--job <id> required");
      const result = await runAgentChain({ jobId, actor: "cli" });
      console.log(JSON.stringify(result, null, 2));
      return;
    }
    case "agents:run": {
      const agentId = a.agent;
      const jobId = a.job;
      if (!agentId || !jobId) throw new Error("--agent <id> --job <id> required");
      if (!getAgent(agentId)) throw new Error(`Unknown agent ${agentId}`);
      const result = await runOneAgent({ jobId, agentId, actor: "cli" });
      console.log(JSON.stringify(result, null, 2));
      return;
    }
    case "help":
    default:
      console.log(`kwode-video-factory CLI

Usage:
  npm run agents:list
  npm run tools:list
  npm run health
  npm run video:create-demo -- [--tenant <slug>] [--video-type <id>] [--title <title>]
  npm run video:generate-brief -- --job <id>
  npm run video:generate-script -- --job <id>
  npm run video:generate-storyboard -- --job <id>
  npm run video:generate-prompts -- --job <id>
  npm run video:qa -- --job <id>
  npm run agents:run -- --agent <id> --job <id>
  npx tsx apps/cli/src/index.ts video:run-chain --job <id>
`);
      return;
  }
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.stack ?? err.message : err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
