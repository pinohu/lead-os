import { z } from "zod";

// ── Video job creation ──
export const CreateVideoJobInput = z.object({
  tenantSlug: z.string().min(1),
  clientId: z.string().optional(),
  providerId: z.string().optional(),
  videoTypeId: z.string().min(1),
  title: z.string().min(1).max(200),
  priority: z.enum(["low", "normal", "high", "rush"]).default("normal"),
  intake: z.object({
    businessName: z.string().optional(),
    audience: z.string().optional(),
    goal: z.string().optional(),
    cta: z.string().optional(),
    durationSec: z.number().int().positive().max(900).optional(),
    aspectRatio: z.string().optional(),
    constraints: z.array(z.string()).default([]),
    uploadedAssetUris: z.array(z.string()).default([]),
    raw: z.record(z.unknown()).default({}),
  }),
  metadata: z.record(z.unknown()).default({}),
});

export type CreateVideoJobInputT = z.infer<typeof CreateVideoJobInput>;

// ── Advance / transition ──
export const AdvanceJobInput = z.object({
  toStatus: z.string().optional(),
  actor: z.string().default("system"),
  reason: z.string().optional(),
});

// ── QA submission ──
export const QASubmissionInput = z.object({
  reviewer: z.string().default("agent:qa-reviewer"),
  passed: z.boolean(),
  checks: z.record(
    z.object({
      passed: z.boolean(),
      notes: z.string().optional(),
    })
  ),
  blockingIssues: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

// ── Approval ──
export const ApprovalInput = z.object({
  decision: z.enum(["approved", "rejected", "revision_requested"]),
  decidedBy: z.string().min(1),
  notes: z.string().optional(),
});

// ── Revision request ──
export const RevisionInput = z.object({
  requestedBy: z.string().min(1),
  reason: z.string().min(1),
  scope: z.array(z.string()).default([]),
});

// ── Agent run ──
export const RunAgentInput = z.object({
  jobId: z.string().optional(),
  payload: z.record(z.unknown()).default({}),
  runtime: z.enum(["mock", "hermes", "direct-llm"]).optional(),
});

// ── Consent ──
export const ConsentInput = z.object({
  kind: z.enum(["face", "voice", "testimonial", "logo", "trademark", "likeness", "client_asset"]),
  subject: z.string().min(1),
  status: z.enum(["pending", "approved", "rejected", "not_required"]).default("approved"),
  evidenceUri: z.string().optional(),
  notes: z.string().optional(),
});
