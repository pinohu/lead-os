import { prisma } from "../../schemas/src/db.js";

export const QA_CATEGORIES = [
  "visual_quality",
  "business_accuracy",
  "brand_consistency",
  "caption_accuracy",
  "rights_and_consent",
  "claims_and_compliance",
  "platform_readiness",
  "conversion_strength",
  "client_readiness",
] as const;

export type QACategory = (typeof QA_CATEGORIES)[number];

export interface QAResult {
  passed: boolean;
  checks: Record<QACategory, { passed: boolean; notes?: string }>;
  blockingIssues: string[];
  notes?: string;
}

/**
 * Hard rules that must be evaluated against persisted state — not the
 * agent's LLM output. These cannot be overridden by an agent.
 */
export async function evaluateHardRules(jobId: string): Promise<{
  pass: boolean;
  blockingIssues: string[];
}> {
  const issues: string[] = [];
  const job = await prisma.videoJob.findUnique({
    where: { id: jobId },
    include: {
      consentRecords: true,
      assets: true,
    },
  });
  if (!job) return { pass: false, blockingIssues: ["Job not found"] };

  // Rule 1: any asset with consentStatus pending or rejected blocks the job.
  for (const a of job.assets) {
    if (a.consentStatus === "pending" || a.consentStatus === "rejected") {
      issues.push(
        `Asset ${a.id} (${a.kind}) has consentStatus=${a.consentStatus}; consent must be approved or not_required before delivery.`
      );
    }
  }

  // Rule 2: if the job has any face/voice/testimonial consent rows, all must be approved.
  const gated = job.consentRecords.filter((c) =>
    ["face", "voice", "testimonial", "logo", "likeness"].includes(c.kind)
  );
  for (const c of gated) {
    if (c.status !== "approved" && c.status !== "not_required") {
      issues.push(`ConsentRecord ${c.id} for ${c.kind} (${c.subject}) is ${c.status}.`);
    }
  }

  // Rule 3: claims_and_compliance — if metadata.medicalClaim / legalClaim / financialClaim is true,
  // human review must be recorded.
  const meta = (job.metadata ?? {}) as Record<string, unknown>;
  if (meta.medicalClaim === true || meta.legalClaim === true || meta.financialClaim === true) {
    const hasReview = await prisma.approval.findFirst({
      where: { jobId, decision: "approved", decidedBy: { startsWith: "user:" } },
    });
    if (!hasReview) {
      issues.push(
        "Job is flagged as containing medical/legal/financial claims; a human approval is required (decidedBy starting with 'user:')."
      );
    }
  }

  return { pass: issues.length === 0, blockingIssues: issues };
}

export function defaultQAChecks(): QAResult["checks"] {
  return Object.fromEntries(
    QA_CATEGORIES.map((c) => [c, { passed: false, notes: "Not evaluated" }])
  ) as QAResult["checks"];
}
