/**
 * Agent-chain orchestrator.
 *
 * Walks a list of agent_ids, invokes each via the Hermes adapter (real or
 * mock), persists the output into the right table for the corresponding
 * artifact, advances the job state machine, and writes audit logs the whole
 * way.
 *
 * The chain is intentionally simple in MVP — it runs sequentially and on the
 * same process. A future revision can move this into the worker app and
 * dispatch each step via Redis.
 */

import { prisma } from "../../schemas/src/db.js";
import { audit } from "../../audit/src/index.js";
import { invokeHermes } from "../../connectors/src/hermes/hermesAdapter.js";
import { invokeVimax } from "../../connectors/src/vimax/vimaxAdapter.js";
import { evaluateHardRules, defaultQAChecks } from "../../qa/src/checks.js";
import { canTransition, IllegalTransitionError, JobStatus } from "./state-machine.js";
import { getAgent } from "../../agents/src/loader.js";
import { getVideoType } from "../../video-catalog/src/loader.js";

export interface RunChainOptions {
  jobId: string;
  agentIds?: string[]; // default: derived from video type
  actor?: string;
  stopOnFailure?: boolean;
}

export interface RunChainResult {
  jobId: string;
  ranAgents: string[];
  finalStatus: JobStatus;
  blockedReason?: string;
  failures: Array<{ agentId: string; error: string }>;
}

const DEFAULT_CHAIN = [
  "client-intake-agent",
  "brand-profile-agent",
  "creative-brief-agent",
  "scriptwriter-agent",
  "storyboard-director-agent",
  "prompt-engineer-agent",
  "qa-reviewer-agent",
  "delivery-agent",
];

export async function runAgentChain(opts: RunChainOptions): Promise<RunChainResult> {
  const { jobId } = opts;
  const actor = opts.actor ?? "system";

  const job = await prisma.videoJob.findUnique({ where: { id: jobId } });
  if (!job) throw new Error(`VideoJob ${jobId} not found`);

  const videoType = getVideoType(job.videoTypeId);
  const chain =
    opts.agentIds ??
    (videoType?.agent_chain && videoType.agent_chain.length > 0
      ? videoType.agent_chain
      : DEFAULT_CHAIN);

  const result: RunChainResult = {
    jobId,
    ranAgents: [],
    finalStatus: job.status as JobStatus,
    failures: [],
  };

  for (const agentId of chain) {
    const definition = getAgent(agentId);
    if (!definition) {
      result.failures.push({ agentId, error: "Agent definition not found" });
      if (opts.stopOnFailure) break;
      continue;
    }

    try {
      const stepResult = await runOneAgent({ jobId, agentId, actor });
      result.ranAgents.push(agentId);
      if (stepResult.blockedReason) {
        result.blockedReason = stepResult.blockedReason;
        break;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.failures.push({ agentId, error: msg });
      await audit({
        actor: `agent:${agentId}`,
        action: "agent.run.failed",
        jobId,
        payload: { error: msg },
      });
      if (opts.stopOnFailure) break;
    }
  }

  const refreshed = await prisma.videoJob.findUniqueOrThrow({ where: { id: jobId } });
  result.finalStatus = refreshed.status as JobStatus;
  return result;
}

interface RunOneAgentArgs {
  jobId: string;
  agentId: string;
  actor: string;
}

interface RunOneAgentResult {
  blockedReason?: string;
}

export async function runOneAgent(args: RunOneAgentArgs): Promise<RunOneAgentResult> {
  const { jobId, agentId, actor } = args;
  const definition = getAgent(agentId);
  if (!definition) throw new Error(`Unknown agent ${agentId}`);

  const job = await prisma.videoJob.findUniqueOrThrow({
    where: { id: jobId },
    include: {
      client: { include: { brandProfile: true } },
      tenant: true,
      provider: true,
      briefs: { orderBy: { version: "desc" }, take: 1 },
      scripts: { orderBy: { version: "desc" }, take: 1 },
      storyboards: { orderBy: { version: "desc" }, take: 1 },
      inputs: true,
    },
  });

  const videoType = getVideoType(job.videoTypeId);
  const latestBrief = job.briefs[0];
  const latestScript = job.scripts[0];
  const latestStoryboard = job.storyboards[0];

  // Map agent_id → intent. For agents not covered by an intent we run a
  // generic "echo" hermes call so it shows up in the audit log.
  const intentByAgent: Record<string, string> = {
    "client-intake-agent": "normalize_intake",
    "brand-profile-agent": "build_brand_profile",
    "creative-brief-agent": "generate_brief",
    "scriptwriter-agent": "generate_script",
    "storyboard-director-agent": "generate_storyboard",
    "scene-planning-agent": "enrich_scenes",
    "prompt-engineer-agent": "generate_prompts",
    "vimax-coordinator-agent": "dispatch_vimax",
    "qa-reviewer-agent": "qa_review",
    "client-approval-agent": "package_for_approval",
    "delivery-agent": "delivery_plan",
  };
  const intent = intentByAgent[agentId] ?? "generic_task";

  // Build inputs from prior artifacts where available.
  const inputs: Record<string, unknown> = {
    intake: job.inputs.map((i) => i.payload),
    brief: latestBrief?.raw ?? null,
    script: latestScript?.body ?? null,
    storyboard: latestStoryboard?.body ?? null,
    videoType: videoType,
    metadata: job.metadata,
    durationSec: ((job.metadata ?? {}) as Record<string, unknown>).durationSec,
    aspectRatio: ((job.metadata ?? {}) as Record<string, unknown>).aspectRatio,
    audience: ((job.metadata ?? {}) as Record<string, unknown>).audience,
    cta: ((job.metadata ?? {}) as Record<string, unknown>).cta,
    goal: ((job.metadata ?? {}) as Record<string, unknown>).goal,
  };

  const run = await prisma.agentRun.create({
    data: {
      jobId,
      agentId,
      runtime: process.env.HERMES_ENABLED === "true" ? "hermes" : "mock",
      status: "running",
      input: inputs as object,
    },
  });

  await audit({
    actor: `agent:${agentId}`,
    action: "agent.run.started",
    jobId,
    payload: { intent, runtime: run.runtime, runId: run.id },
  });

  const hermesResult = await invokeHermes({
    agentId,
    agentDefinition: {
      name: definition.name,
      mission: definition.mission,
      promptTemplate: definition.prompt_template,
      toolsAllowed: definition.tools_allowed,
      toolsDisallowed: definition.tools_disallowed,
    },
    context: {
      jobId,
      tenantSlug: job.tenant.slug,
      clientName: job.client?.name,
      brandSummary: job.client?.brandProfile
        ? `${job.client.brandProfile.brandName} — voice: ${job.client.brandProfile.voiceTone ?? "neutral"}`
        : undefined,
      videoTypeId: job.videoTypeId,
      priorArtifacts: {
        brief: latestBrief?.raw,
        script: latestScript?.body,
      },
    },
    task: {
      intent,
      inputs,
    },
    guardrails: {
      forbidden: Array.isArray((job.client?.brandProfile?.forbidden ?? []))
        ? ((job.client?.brandProfile?.forbidden as unknown) as string[])
        : [],
      consentRequired: ["face", "voice", "testimonial", "logo"].some((k) =>
        ((job.metadata ?? {}) as Record<string, unknown>)[`needs_${k}`] === true
      ),
      publicPublishing: false,
    },
  });

  await prisma.agentRun.update({
    where: { id: run.id },
    data: {
      status: hermesResult.status === "completed" ? "completed" : "failed",
      output: hermesResult.output as object,
      finishedAt: new Date(),
      cost: (hermesResult.cost ?? {}) as object,
      error: hermesResult.status === "failed" ? hermesResult.notes : null,
    },
  });

  // Persist artifact based on agent intent.
  let blockedReason: string | undefined;
  switch (agentId) {
    case "client-intake-agent":
      // Move draft -> intake_received once the intake agent has run, if eligible.
      if (canTransition(job.status as JobStatus, "intake_received")) {
        await advance(jobId, "intake_received", `agent:${agentId}`);
      }
      break;

    case "brand-profile-agent": {
      // Lightweight: if no brand profile exists for the client, create a stub
      // populated from agent output.
      if (job.clientId) {
        const existing = await prisma.brandProfile.findUnique({ where: { clientId: job.clientId } });
        if (!existing) {
          await prisma.brandProfile.create({
            data: {
              tenantId: job.tenantId,
              clientId: job.clientId,
              brandName: job.client?.name ?? "Unknown",
              voiceTone: (hermesResult.output.voiceTone as string) ?? "neutral",
              taglines: (hermesResult.output.taglines as object) ?? [],
              proofPoints: (hermesResult.output.proofPoints as object) ?? [],
              forbidden: (hermesResult.output.forbidden as object) ?? [],
            },
          });
        }
      }
      break;
    }

    case "creative-brief-agent": {
      const version = ((await prisma.creativeBrief.count({ where: { jobId } })) ?? 0) + 1;
      const out = hermesResult.output as Record<string, unknown>;
      await prisma.creativeBrief.create({
        data: {
          jobId,
          version,
          objective: (out.objective as string) ?? null,
          audience: (out.audience as string) ?? null,
          hook: (out.hook as string) ?? null,
          cta: (out.cta as string) ?? null,
          toneOfVoice: (out.toneOfVoice as string) ?? null,
          trustSignals: (out.trustSignals as object) ?? [],
          constraints: (out.constraints as object) ?? {},
          raw: out as object,
          authorAgent: agentId,
        },
      });
      // brief_generating → brief_ready, then brief_ready → brief_approved (auto-approve in MVP)
      if (canTransition(job.status as JobStatus, "brief_generating")) {
        await advance(jobId, "brief_generating", `agent:${agentId}`);
      }
      await advance(jobId, "brief_ready", `agent:${agentId}`);
      await advance(jobId, "brief_approved", `agent:${agentId}`);
      break;
    }

    case "scriptwriter-agent": {
      const version = ((await prisma.script.count({ where: { jobId } })) ?? 0) + 1;
      const out = hermesResult.output as Record<string, unknown>;
      const body =
        typeof out.body === "string"
          ? out.body
          : JSON.stringify(out.body ?? out, null, 2);
      await prisma.script.create({
        data: {
          jobId,
          version,
          format: (out.format as string) ?? "shot-list",
          body,
          wordCount: (out.wordCount as number) ?? body.split(/\s+/).length,
          language: (out.language as string) ?? "en-US",
          raw: out as object,
          authorAgent: agentId,
        },
      });
      if (canTransition(job.status as JobStatus, "script_generating")) {
        await advance(jobId, "script_generating", `agent:${agentId}`);
      }
      await advance(jobId, "script_ready", `agent:${agentId}`);
      break;
    }

    case "storyboard-director-agent": {
      const version = ((await prisma.storyboard.count({ where: { jobId } })) ?? 0) + 1;
      const out = hermesResult.output as Record<string, unknown>;
      const scenes = (out.scenes as Array<{ order: number; durationSec: number; description: string }>) ?? [];
      await prisma.storyboard.create({
        data: {
          jobId,
          version,
          body: out as object,
          authorAgent: agentId,
        },
      });
      // Replace scenes (idempotent).
      await prisma.scene.deleteMany({ where: { jobId } });
      if (scenes.length > 0) {
        await prisma.scene.createMany({
          data: scenes.map((s) => ({
            jobId,
            order: s.order,
            durationSec: s.durationSec,
            description: s.description,
          })),
        });
      }
      if (canTransition(job.status as JobStatus, "storyboard_generating")) {
        await advance(jobId, "storyboard_generating", `agent:${agentId}`);
      }
      await advance(jobId, "storyboard_ready", `agent:${agentId}`);
      break;
    }

    case "prompt-engineer-agent": {
      const out = hermesResult.output as Record<string, unknown>;
      const prompts = (out.prompts as Array<{
        sceneOrder: number;
        kind: "image" | "video" | "voice" | "music" | "sfx" | "text-to-3d";
        toolHint?: string;
        body: string;
        params?: Record<string, unknown>;
      }>) ?? [];
      await prisma.prompt.deleteMany({ where: { jobId } });
      if (prompts.length > 0) {
        await prisma.prompt.createMany({
          data: prompts.map((p) => ({
            jobId,
            sceneOrder: p.sceneOrder,
            kind: p.kind,
            toolHint: p.toolHint ?? null,
            body: p.body,
            params: (p.params ?? {}) as object,
            authorAgent: agentId,
          })),
        });
      }
      if (canTransition(job.status as JobStatus, "prompts_generating")) {
        await advance(jobId, "prompts_generating", `agent:${agentId}`);
      }
      await advance(jobId, "prompts_ready", `agent:${agentId}`);

      // Also: hand off a ViMax planning packet so a real or mock asset run
      // is recorded. This makes the pipeline produce a verifiable artifact.
      const brand = job.client?.brandProfile;
      const vmRun = await invokeVimax({
        jobId,
        packet: {
          jobId,
          title: job.title,
          brand: {
            name: brand?.brandName ?? job.client?.name ?? "Unknown",
            voiceTone: brand?.voiceTone ?? undefined,
            forbidden: Array.isArray(brand?.forbidden)
              ? ((brand?.forbidden as unknown) as string[])
              : [],
          },
          brief: {
            objective: latestBrief?.objective ?? "",
            audience: latestBrief?.audience ?? "",
            hook: latestBrief?.hook ?? undefined,
            cta: latestBrief?.cta ?? undefined,
          },
          constraints: {
            durationSec: 60,
            aspectRatio: "9:16",
          },
          script: {
            format: latestScript?.format ?? "shot-list",
            language: latestScript?.language ?? "en-US",
            body: latestScript?.body ?? "",
          },
          scenes: ((await prisma.scene.findMany({
            where: { jobId },
            orderBy: { order: "asc" },
          })) as Array<{ order: number; durationSec: number | null; description: string }>).map((s) => ({
            order: s.order,
            durationSec: s.durationSec ?? 5,
            description: s.description,
          })),
          prompts: prompts.map((p) => ({
            sceneOrder: p.sceneOrder,
            kind: p.kind,
            toolHint: p.toolHint,
            body: p.body,
          })),
          consistency: {
            keyVisualEntities: [],
            lockedColors: [],
            lockedFonts: [],
            referenceAssets: [],
          },
        },
      });

      const generationRun = await prisma.generationRun.create({
        data: {
          jobId,
          toolId: "vimax",
          status:
            vmRun.result.status === "mocked"
              ? "mocked"
              : vmRun.result.status === "completed"
              ? "completed"
              : "failed",
          mode: process.env.VIMAX_ENABLED === "true" ? "api" : "mock",
          input: vmRun.packet as unknown as object,
          output: vmRun.result as unknown as object,
        },
      });

      for (const a of vmRun.result.assets) {
        await prisma.asset.create({
          data: {
            jobId,
            kind: a.kind,
            uri: a.uri,
            mimeType: a.mimeType ?? null,
            durationSec: a.durationSec ?? null,
            consentStatus: "not_required",
            producedBy: "tool:vimax",
            metadata: { generationRunId: generationRun.id, note: a.notes ?? null },
          },
        });
      }
      break;
    }

    case "qa-reviewer-agent": {
      if (canTransition(job.status as JobStatus, "qa_pending")) {
        await advance(jobId, "qa_pending", `agent:${agentId}`);
      }
      const hard = await evaluateHardRules(jobId);
      const out = hermesResult.output as Record<string, unknown>;
      const checks = (out.checks as ReturnType<typeof defaultQAChecks>) ?? defaultQAChecks();
      const blockingIssues = [
        ...((out.blockingIssues as string[]) ?? []),
        ...hard.blockingIssues,
      ];
      const passed = !!out.passed && hard.pass && blockingIssues.length === 0;
      const version = ((await prisma.qAReview.count({ where: { jobId } })) ?? 0) + 1;
      await prisma.qAReview.create({
        data: {
          jobId,
          version,
          reviewer: `agent:${agentId}`,
          passed,
          checks: checks as unknown as object,
          blockingIssues: blockingIssues as unknown as object,
          notes: typeof out.notes === "string" ? out.notes : null,
        },
      });
      await prisma.videoJob.update({
        where: { id: jobId },
        data: { qaResult: passed ? "passed" : "failed" },
      });
      await advance(jobId, passed ? "qa_passed" : "qa_failed", `agent:${agentId}`);
      if (!passed) {
        blockedReason = `QA failed: ${blockingIssues.join("; ") || "see notes"}`;
      }
      break;
    }

    case "delivery-agent": {
      // Refuse to advance if QA hasn't passed.
      const refreshed = await prisma.videoJob.findUniqueOrThrow({ where: { id: jobId } });
      if (refreshed.qaResult !== "passed") {
        blockedReason =
          "Delivery refused — QA has not passed. Run qa-reviewer-agent first and resolve any blocking issues.";
        await audit({
          actor: `agent:${agentId}`,
          action: "delivery.refused",
          jobId,
          payload: { reason: blockedReason },
        });
        break;
      }
      // Skip client_review/approval steps in the MVP auto-chain — those are
      // operator-driven via the API. The CLI runs the chain through QA only.
      break;
    }

    default:
      // Generic agents: nothing to persist beyond the AgentRun row.
      break;
  }

  await audit({
    actor: `agent:${agentId}`,
    action: "agent.run.completed",
    jobId,
    payload: { intent, runId: run.id, status: hermesResult.status },
  });

  return { blockedReason };
}

/**
 * Safely advance a job's status. Routes through the state machine for
 * validation and writes an audit log.
 */
export async function advance(jobId: string, to: JobStatus, actor: string, reason?: string): Promise<void> {
  const job = await prisma.videoJob.findUniqueOrThrow({ where: { id: jobId } });
  const from = job.status as JobStatus;
  if (from === to) return;
  if (!canTransition(from, to)) {
    throw new IllegalTransitionError(from, to);
  }
  await prisma.videoJob.update({
    where: { id: jobId },
    data: {
      status: to,
      blockedReason: to.startsWith("blocked_") ? reason ?? job.blockedReason : null,
      failureReason: to.startsWith("failed_") ? reason ?? job.failureReason : null,
      deliveredAt: to === "delivered" ? new Date() : job.deliveredAt,
      publishedAt: to === "published" ? new Date() : job.publishedAt,
      archivedAt: to === "archived" ? new Date() : job.archivedAt,
    },
  });
  await audit({
    actor,
    action: "job.status.changed",
    jobId,
    payload: { from, to, reason },
  });
}
