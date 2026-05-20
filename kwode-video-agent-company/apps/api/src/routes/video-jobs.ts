import { Router } from "express";
import { prisma } from "../../../../packages/schemas/src/db.js";
import {
  CreateVideoJobInput,
  AdvanceJobInput,
  QASubmissionInput,
  ApprovalInput,
  RevisionInput,
} from "../../../../packages/schemas/src/zod.js";
import { audit } from "../../../../packages/audit/src/index.js";
import { runOneAgent, advance } from "../../../../packages/workflow-engine/src/agent-chain.js";
import { getVideoType } from "../../../../packages/video-catalog/src/loader.js";
import { evaluateHardRules } from "../../../../packages/qa/src/checks.js";
import { JobStatus, canTransition } from "../../../../packages/workflow-engine/src/state-machine.js";

export const videoJobsRouter = Router();

// POST /api/video-jobs
videoJobsRouter.post("/", async (req, res, next) => {
  try {
    const body = CreateVideoJobInput.parse(req.body);
    const tenant = await prisma.tenant.findUnique({ where: { slug: body.tenantSlug } });
    if (!tenant) {
      return res.status(404).json({ error: { message: `Tenant ${body.tenantSlug} not found` } });
    }
    const videoType = getVideoType(body.videoTypeId);
    if (!videoType) {
      return res.status(400).json({ error: { message: `Unknown video_type_id ${body.videoTypeId}` } });
    }

    const job = await prisma.videoJob.create({
      data: {
        tenantId: tenant.id,
        clientId: body.clientId ?? null,
        providerId: body.providerId ?? null,
        videoTypeId: body.videoTypeId,
        title: body.title,
        priority: body.priority,
        status: "draft",
        metadata: {
          ...body.metadata,
          intake: body.intake,
          durationSec: body.intake.durationSec ?? videoType.recommended_duration,
          aspectRatio: body.intake.aspectRatio ?? videoType.recommended_aspect_ratios[0],
          audience: body.intake.audience,
          goal: body.intake.goal,
          cta: body.intake.cta,
        } as object,
      },
    });

    // Persist intake payload as a VideoInput row.
    await prisma.videoInput.create({
      data: {
        jobId: job.id,
        kind: "brief_form",
        payload: body.intake as unknown as object,
        source: "api",
      },
    });

    await audit({ actor: "system", action: "job.created", jobId: job.id, payload: { videoTypeId: job.videoTypeId } });
    res.status(201).json(job);
  } catch (err) {
    next(err);
  }
});

// GET /api/video-jobs
videoJobsRouter.get("/", async (req, res, next) => {
  try {
    const status = req.query.status as string | undefined;
    const tenantSlug = req.query.tenantSlug as string | undefined;
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (tenantSlug) {
      const t = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
      where.tenantId = t?.id ?? "__none__";
    }
    const jobs = await prisma.videoJob.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: Math.min(200, Number(req.query.limit ?? 50)),
    });
    res.json({ jobs, count: jobs.length });
  } catch (err) {
    next(err);
  }
});

// GET /api/video-jobs/:id
videoJobsRouter.get("/:id", async (req, res, next) => {
  try {
    const job = await prisma.videoJob.findUnique({
      where: { id: req.params.id },
      include: {
        client: true,
        provider: true,
        briefs: { orderBy: { version: "desc" } },
        scripts: { orderBy: { version: "desc" } },
        storyboards: { orderBy: { version: "desc" } },
        scenes: { orderBy: { order: "asc" } },
        prompts: { orderBy: { sceneOrder: "asc" } },
        assets: true,
        qaReviews: { orderBy: { version: "desc" } },
        approvals: { orderBy: { createdAt: "desc" } },
        revisions: { orderBy: { createdAt: "desc" } },
        deliverables: true,
        publishingRecords: true,
        consentRecords: true,
        agentRuns: { orderBy: { startedAt: "desc" } },
      },
    });
    if (!job) return res.status(404).json({ error: { message: "Job not found" } });
    res.json(job);
  } catch (err) {
    next(err);
  }
});

// POST /api/video-jobs/:id/advance
videoJobsRouter.post("/:id/advance", async (req, res, next) => {
  try {
    const body = AdvanceJobInput.parse(req.body ?? {});
    const job = await prisma.videoJob.findUnique({ where: { id: req.params.id } });
    if (!job) return res.status(404).json({ error: { message: "Job not found" } });
    if (!body.toStatus) {
      return res.status(400).json({ error: { message: "toStatus required" } });
    }
    const next = body.toStatus as JobStatus;
    if (!canTransition(job.status as JobStatus, next)) {
      return res.status(409).json({
        error: { message: `Illegal transition ${job.status} -> ${next}` },
      });
    }
    await advance(req.params.id, next, body.actor, body.reason);
    const updated = await prisma.videoJob.findUnique({ where: { id: req.params.id } });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

function makeAgentRunner(agentId: string) {
  return async (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => {
    try {
      const result = await runOneAgent({
        jobId: req.params.id,
        agentId,
        actor: (req.body?.actor as string) ?? "system",
      });
      res.json({ ok: true, agentId, ...result });
    } catch (err) {
      next(err);
    }
  };
}

videoJobsRouter.post("/:id/generate-brief", makeAgentRunner("creative-brief-agent"));
videoJobsRouter.post("/:id/generate-script", makeAgentRunner("scriptwriter-agent"));
videoJobsRouter.post("/:id/generate-storyboard", makeAgentRunner("storyboard-director-agent"));
videoJobsRouter.post("/:id/generate-prompts", makeAgentRunner("prompt-engineer-agent"));
videoJobsRouter.post("/:id/qa", makeAgentRunner("qa-reviewer-agent"));

// POST /api/video-jobs/:id/approve
videoJobsRouter.post("/:id/approve", async (req, res, next) => {
  try {
    const body = ApprovalInput.parse(req.body);
    const job = await prisma.videoJob.findUnique({ where: { id: req.params.id } });
    if (!job) return res.status(404).json({ error: { message: "Job not found" } });

    // Hard rule: cannot move to approved unless QA has passed.
    if (body.decision === "approved") {
      const hard = await evaluateHardRules(req.params.id);
      if (!hard.pass || job.qaResult !== "passed") {
        return res.status(409).json({
          error: {
            message: "Cannot approve — QA has not passed or hard rules blocked the job.",
            details: hard.blockingIssues,
          },
        });
      }
    }

    await prisma.approval.create({
      data: {
        jobId: req.params.id,
        decision: body.decision,
        decidedBy: body.decidedBy,
        notes: body.notes ?? null,
      },
    });
    await prisma.videoJob.update({
      where: { id: req.params.id },
      data: { approvalResult: body.decision },
    });

    if (body.decision === "approved") {
      if (canTransition(job.status as JobStatus, "client_review")) {
        await advance(req.params.id, "client_review", `user:${body.decidedBy}`);
      }
      if (canTransition((job.status as JobStatus), "approved")) {
        await advance(req.params.id, "approved", `user:${body.decidedBy}`);
      } else {
        // ensure we land in approved if currently in client_review
        const refreshed = await prisma.videoJob.findUnique({ where: { id: req.params.id } });
        if (refreshed && canTransition(refreshed.status as JobStatus, "approved")) {
          await advance(req.params.id, "approved", `user:${body.decidedBy}`);
        }
      }
    } else if (body.decision === "revision_requested") {
      if (canTransition(job.status as JobStatus, "revision_requested")) {
        await advance(req.params.id, "revision_requested", `user:${body.decidedBy}`);
      }
    }
    await audit({ actor: `user:${body.decidedBy}`, action: `job.${body.decision}`, jobId: req.params.id, payload: { notes: body.notes } });
    const updated = await prisma.videoJob.findUnique({ where: { id: req.params.id } });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// POST /api/video-jobs/:id/request-revision
videoJobsRouter.post("/:id/request-revision", async (req, res, next) => {
  try {
    const body = RevisionInput.parse(req.body);
    const job = await prisma.videoJob.findUnique({ where: { id: req.params.id } });
    if (!job) return res.status(404).json({ error: { message: "Job not found" } });
    await prisma.revision.create({
      data: {
        jobId: req.params.id,
        requestedBy: body.requestedBy,
        reason: body.reason,
        scope: body.scope as unknown as object,
      },
    });
    if (canTransition(job.status as JobStatus, "revision_requested")) {
      await advance(req.params.id, "revision_requested", `user:${body.requestedBy}`, body.reason);
    }
    await audit({ actor: `user:${body.requestedBy}`, action: "job.revision_requested", jobId: req.params.id, payload: body });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// POST /api/video-jobs/:id/deliver
videoJobsRouter.post("/:id/deliver", async (req, res, next) => {
  try {
    const job = await prisma.videoJob.findUnique({ where: { id: req.params.id } });
    if (!job) return res.status(404).json({ error: { message: "Job not found" } });

    // Hard-stop: refuse delivery without approved + qa passed.
    const hard = await evaluateHardRules(req.params.id);
    if (!hard.pass) {
      return res
        .status(409)
        .json({ error: { message: "Hard rules blocking delivery", details: hard.blockingIssues } });
    }
    if (job.approvalResult !== "approved" || job.qaResult !== "passed") {
      return res.status(409).json({
        error: {
          message: "Cannot deliver — job must have approvalResult=approved AND qaResult=passed.",
          state: { approvalResult: job.approvalResult, qaResult: job.qaResult, status: job.status },
        },
      });
    }
    await prisma.deliverable.create({
      data: {
        jobId: req.params.id,
        channel: (req.body?.channel as string) ?? "client_portal",
        uri: (req.body?.uri as string) ?? null,
        status: "delivered",
        deliveredAt: new Date(),
      },
    });
    if (canTransition(job.status as JobStatus, "delivered")) {
      await advance(req.params.id, "delivered", "system");
    }
    await audit({ actor: "system", action: "job.delivered", jobId: req.params.id });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// POST /api/video-jobs/:id/generate-brief is wired above via makeAgentRunner.
