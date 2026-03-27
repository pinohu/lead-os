import { randomUUID } from "crypto";
import { getPool } from "./db.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PipelineStage {
  name: string;
  status: "completed" | "failed" | "skipped";
  durationMs: number;
  output?: Record<string, unknown>;
  error?: string;
}

export interface PipelineResult {
  id: string;
  leadKey: string;
  tenantId: string;
  niche: string;

  stages: PipelineStage[];

  route: string;
  offer: Record<string, unknown> | null;
  psychologyDirectives: Record<string, unknown> | null;
  personalizedExperience: Record<string, unknown> | null;
  trustElements: Record<string, unknown> | null;
  escalation: {
    shouldEscalate: boolean;
    type?: string;
    handoff?: Record<string, unknown>;
  } | null;
  followUpPlan: Record<string, unknown> | null;

  totalDurationMs: number;
  startedAt: string;
  completedAt: string;
}

export interface FollowUpStep {
  channel: "phone" | "email" | "sms" | "push";
  delayMinutes: number;
  subject?: string;
  template: string;
}

export interface FollowUpPlan {
  route: string;
  niche: string;
  steps: FollowUpStep[];
  generatedAt: string;
}

export interface PipelineStats {
  tenantId: string;
  period: string;
  totalRuns: number;
  avgDurationMs: number;
  stageFailureRates: Record<string, number>;
  routeDistribution: Record<string, number>;
  escalationRate: number;
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// Critical stages that abort the pipeline when they fail
// ---------------------------------------------------------------------------

const CRITICAL_STAGES = new Set(["intake", "scoring", "routing"]);

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

const pipelineHistory: PipelineResult[] = [];

let schemaReady: Promise<void> | null = null;

async function ensurePipelineSchema(): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  if (schemaReady) return schemaReady;

  schemaReady = (async () => {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS lead_os_pipeline_runs (
          id TEXT PRIMARY KEY,
          lead_key TEXT NOT NULL,
          tenant_id TEXT NOT NULL,
          niche TEXT NOT NULL,
          route TEXT NOT NULL DEFAULT '',
          stages JSONB NOT NULL DEFAULT '[]',
          result JSONB NOT NULL DEFAULT '{}',
          total_duration_ms INT NOT NULL DEFAULT 0,
          started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `);
      await pool.query(
        `CREATE INDEX IF NOT EXISTS idx_pipeline_runs_tenant ON lead_os_pipeline_runs(tenant_id)`,
      );
    } catch {
      schemaReady = null;
    }
  })();

  return schemaReady;
}

// ---------------------------------------------------------------------------
// Stage runner
// ---------------------------------------------------------------------------

async function runPipelineStage(
  name: string,
  fn: () => Promise<Record<string, unknown>>,
): Promise<PipelineStage> {
  const start = Date.now();
  try {
    const output = await fn();
    return {
      name,
      status: "completed",
      durationMs: Date.now() - start,
      output,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      name,
      status: "failed",
      durationMs: Date.now() - start,
      error: message,
    };
  }
}

// ---------------------------------------------------------------------------
// Follow-up plan generation
// ---------------------------------------------------------------------------

export function generateFollowUpPlan(
  route: string,
  niche: string,
  _lead: Record<string, unknown>,
): FollowUpPlan {
  const steps: FollowUpStep[] = [];

  switch (route) {
    case "fast-track":
      steps.push(
        { channel: "phone", delayMinutes: 0, template: `immediate-call-${niche}` },
        { channel: "email", delayMinutes: 5, subject: "Confirming your consultation", template: `fast-track-confirm-${niche}` },
        { channel: "sms", delayMinutes: 10, template: `fast-track-sms-${niche}` },
      );
      break;
    case "conversion":
      steps.push(
        { channel: "email", delayMinutes: 0, subject: "Your personalized recommendation", template: `conversion-email-1-${niche}` },
        { channel: "sms", delayMinutes: 30, template: `conversion-sms-1-${niche}` },
        { channel: "email", delayMinutes: 1440, subject: "Follow-up on your inquiry", template: `conversion-email-2-${niche}` },
        { channel: "email", delayMinutes: 4320, subject: "Special offer inside", template: `conversion-email-3-${niche}` },
      );
      break;
    case "nurture":
      steps.push(
        { channel: "email", delayMinutes: 0, subject: "Welcome — here is a resource for you", template: `nurture-welcome-${niche}` },
        { channel: "email", delayMinutes: 4320, subject: "How others in your industry solved this", template: `nurture-case-study-${niche}` },
        { channel: "email", delayMinutes: 10080, subject: "Quick tips for your business", template: `nurture-tips-${niche}` },
        { channel: "email", delayMinutes: 20160, subject: "Ready when you are", template: `nurture-reactivation-${niche}` },
      );
      break;
    default:
      steps.push(
        { channel: "email", delayMinutes: 0, subject: "Thanks for visiting", template: `drip-welcome-${niche}` },
        { channel: "email", delayMinutes: 10080, subject: "Thought you might find this useful", template: `drip-value-${niche}` },
      );
      break;
  }

  return {
    route,
    niche,
    steps,
    generatedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Route determination
// ---------------------------------------------------------------------------

function determineRoute(compositeScore: number): string {
  if (compositeScore >= 80) return "fast-track";
  if (compositeScore >= 60) return "conversion";
  if (compositeScore >= 40) return "nurture";
  return "drip";
}

// ---------------------------------------------------------------------------
// Main pipeline
// ---------------------------------------------------------------------------

export async function runRevenuePipeline(
  leadData: Record<string, unknown>,
  tenantId: string,
  nicheSlug: string,
): Promise<PipelineResult> {
  const pipelineId = randomUUID();
  const startedAt = new Date().toISOString();
  const pipelineStart = Date.now();

  const stages: PipelineStage[] = [];
  let route = "drip";
  let compositeScore = 0;
  let offer: Record<string, unknown> | null = null;
  let psychologyDirectives: Record<string, unknown> | null = null;
  let personalizedExperience: Record<string, unknown> | null = null;
  let trustElements: Record<string, unknown> | null = null;
  let escalation: PipelineResult["escalation"] = null;
  let followUpPlan: Record<string, unknown> | null = null;
  let aborted = false;

  const leadKey = (leadData.leadKey as string) ?? (leadData.email as string) ?? randomUUID();

  // 1. INTAKE
  const intakeStage = await runPipelineStage("intake", async () => {
    const { LeadSchema } = await import("./canonical-schema.ts");
    const now = new Date().toISOString();
    const partialLead = {
      id: leadKey,
      source: (leadData.source as string) ?? "manual",
      lifecycleStage: "captured" as const,
      intentScore: 0,
      trustScore: 0,
      urgencyScore: 0,
      engagementScore: 0,
      compositeScore: 0,
      temperature: "cold" as const,
      niche: nicheSlug,
      tenantId,
      createdAt: now,
      updatedAt: now,
    };
    const parsed = LeadSchema.safeParse(partialLead);
    if (!parsed.success) {
      throw new Error(`Validation failed: ${parsed.error.issues.map((i) => i.message).join(", ")}`);
    }
    return { leadKey, validated: true, lead: parsed.data } as unknown as Record<string, unknown>;
  });
  stages.push(intakeStage);
  if (intakeStage.status === "failed" && CRITICAL_STAGES.has("intake")) {
    aborted = true;
  }

  // 1.5. INGRESS — detect channel and apply initial scoring boost
  if (!aborted) {
    const ingressStage = await runPipelineStage("ingress", async () => {
      const ingress = await import("./ingress-engine.ts");
      const channel = ingress.detectIngressChannel(
        (leadData.source as string) ?? "direct",
        leadData.referrer as string | undefined,
        leadData.utm_source as string | undefined,
        leadData.utm_medium as string | undefined,
      );
      const decision = ingress.resolveIngressDecision(channel, tenantId);

      // Record the ingress event
      await ingress.recordIngressEvent(tenantId, decision.channel, leadKey, decision.scoreBoost);

      return decision as unknown as Record<string, unknown>;
    });
    stages.push(ingressStage);
  }

  // 2. CONTEXT
  if (!aborted) {
    const contextStage = await runPipelineStage("context", async () => {
      return {
        leadKey,
        tenantId,
        niche: nicheSlug,
        source: (leadData.source as string) ?? "manual",
        updatedAt: new Date().toISOString(),
      };
    });
    stages.push(contextStage);
  }

  // 3. SCORING
  if (!aborted) {
    const scoringStage = await runPipelineStage("scoring", async () => {
      const {
        computeIntentScore,
        computeFitScore,
        computeEngagementScore,
        computeUrgencyScore,
        computeCompositeScore,
      } = await import("./scoring-engine.ts");

      const ctx = {
        source: (leadData.source as string) ?? "manual",
        niche: nicheSlug,
        service: leadData.service as string | undefined,
        pagesViewed: (leadData.pagesViewed as number) ?? 0,
        timeOnSite: (leadData.timeOnSite as number) ?? 0,
        formCompletions: (leadData.formCompletions as number) ?? 0,
        chatMessages: (leadData.chatMessages as number) ?? 0,
        emailOpens: (leadData.emailOpens as number) ?? 0,
        emailClicks: (leadData.emailClicks as number) ?? 0,
        assessmentCompleted: (leadData.assessmentCompleted as boolean) ?? false,
        assessmentScore: leadData.assessmentScore as number | undefined,
        calculatorUsed: (leadData.calculatorUsed as boolean) ?? false,
        returnVisits: (leadData.returnVisits as number) ?? 0,
        hasPhone: Boolean(leadData.phone),
        hasCompany: Boolean(leadData.company),
        hasEmail: Boolean(leadData.email),
        urgencyIndicators: (leadData.urgencyIndicators as string[]) ?? [],
        companySize: leadData.companySize as string | undefined,
        budget: leadData.budget as string | undefined,
        timeline: leadData.timeline as string | undefined,
        lastActivityAt: leadData.lastActivityAt as string | undefined,
      };

      const intent = computeIntentScore(ctx);
      const fit = computeFitScore(ctx);
      const engagement = computeEngagementScore(ctx);
      const urgency = computeUrgencyScore(ctx);
      const scoringConfig = await import("./scoring-config.ts").then((m) => m.getScoringConfig(tenantId)).catch(() => undefined);
      const composite = computeCompositeScore(ctx, scoringConfig);

      compositeScore = composite.score;

      return {
        intentScore: intent.score,
        fitScore: fit.score,
        engagementScore: engagement.score,
        urgencyScore: urgency.score,
        compositeScore: composite.score,
      };
    });
    stages.push(scoringStage);
    if (scoringStage.status === "failed" && CRITICAL_STAGES.has("scoring")) {
      aborted = true;
    }
  }

  // 4. ROUTING
  if (!aborted) {
    const routingStage = await runPipelineStage("routing", async () => {
      route = determineRoute(compositeScore);
      return { route, compositeScore };
    });
    stages.push(routingStage);
    if (routingStage.status === "failed" && CRITICAL_STAGES.has("routing")) {
      aborted = true;
    }
  }

  // 5. NICHE
  if (!aborted) {
    const nicheStage = await runPipelineStage("niche", async () => {
      const { nicheStore } = await import("./niche-store.ts");
      const config = nicheStore.get(nicheSlug);
      if (config) {
        return {
          loaded: true,
          slug: config.slug,
          painPoints: config.painPoints,
          scoringWeights: config.scoringWeights,
        };
      }
      return { loaded: false, slug: nicheSlug };
    });
    stages.push(nicheStage);
  }

  // 6. OFFER
  if (!aborted) {
    const offerStage = await runPipelineStage("offer", async () => {
      const { generateOffer } = await import("./offer-engine.ts");
      const nicheMapping: Record<string, string> = {
        "pest-control": "home-services",
        "immigration-law": "legal",
        "roofing": "home-services",
        "real-estate-syndication": "real-estate",
        "staffing-agency": "staffing",
      };
      const mappedNiche = nicheMapping[nicheSlug] ?? "professional-services";
      const result = generateOffer(
        mappedNiche as Parameters<typeof generateOffer>[0],
        (leadData.service as string) ?? "General Services",
      );
      offer = result as unknown as Record<string, unknown>;
      return result as unknown as Record<string, unknown>;
    });
    stages.push(offerStage);
  }

  // 7. PSYCHOLOGY
  if (!aborted) {
    const psychStage = await runPipelineStage("psychology", async () => {
      const { evaluatePsychology } = await import("./psychology-engine.ts");
      const { getContext, updateContext } = await import("./context-engine.ts");

      // Get real scores from context (set in stage 3)
      const ctx = await getContext(leadKey).catch(() => null);
      const trustScore = ctx?.scores?.composite ? Math.min(ctx.scores.composite * 0.8, 100) : 50;
      const urgencyScore = ctx?.scores?.urgency ?? 50;

      // Surface psychology
      const surfacePsych = evaluatePsychology({
        leadScore: ctx?.scores?.composite ?? compositeScore,
        trustScore,
        urgencyScore,
        stage: ctx?.funnelStage ?? (route === "fast-track" ? "bottom" : route === "conversion" ? "middle" : "top"),
        returning: (ctx?.interactions?.length ?? 0) > 1 || Boolean(leadData.returning ?? (leadData.returnVisits as number ?? 0) > 0),
        device: (leadData.device as string) ?? "desktop",
        objections: (leadData.objections as string[]) ?? [],
        timeOnSite: (leadData.timeOnSite as number) ?? 0,
        pagesViewed: (leadData.pagesViewed as number) ?? 0,
      });
      psychologyDirectives = surfacePsych as unknown as Record<string, unknown>;

      // Deep psychology (niche-specific)
      let deepPsych: Record<string, unknown> | null = null;
      try {
        const dp = await import("./deep-psychology.ts");
        const { nicheStore } = await import("./niche-store.ts");
        const nicheConfig = nicheStore.get(nicheSlug);
        const niche = nicheSlug || "general";
        const fears = dp.generateFearTrigger(niche, nicheConfig?.painPoints?.[0] ?? "problem");
        const desires = dp.generateDesireTrigger(niche, ["growth", "security"]);
        const identity = dp.generateIdentityMessage(niche, "decision-maker");
        const sequence = dp.generateEmotionalSequence(niche, ctx?.funnelStage === "new" ? "top" : ctx?.funnelStage === "nurture" ? "middle" : "bottom");
        deepPsych = { fears, desires, identity, sequence } as Record<string, unknown>;
      } catch {
        // Deep psychology module not available — surface psychology is sufficient
      }

      // Update context with psychology profile
      if (ctx) {
        const fearHeadline = (deepPsych?.fears as Record<string, unknown> | undefined)?.headline as string | undefined;
        const desireHeadline = ((deepPsych?.desires as Array<Record<string, unknown>> | undefined)?.[0])?.headline as string | undefined;
        const sequenceStages = (deepPsych?.sequence as Record<string, unknown> | undefined)?.stages as Array<Record<string, unknown>> | undefined;
        updateContext(leadKey, {
          psychologyProfile: {
            trustLevel: trustScore,
            fearTriggers: fearHeadline ? [fearHeadline] : [],
            desireTriggers: desireHeadline ? [desireHeadline] : [],
            objections: [],
            identityType: "decision-maker",
            emotionalStage: (sequenceStages?.[0]?.emotion as string) ?? "curiosity",
          },
        });
      }

      return { surface: surfacePsych, deep: deepPsych } as unknown as Record<string, unknown>;
    });
    stages.push(psychStage);
  }

  // 8. TRUST
  if (!aborted) {
    const trustStage = await runPipelineStage("trust", async () => {
      const { calculateTrustScore, generateTrustBadges, getGuaranteeTemplates } = await import("./trust-engine.ts");
      const trustScore = calculateTrustScore(tenantId);
      const badges = generateTrustBadges(tenantId);
      const guarantees = getGuaranteeTemplates(nicheSlug);
      trustElements = { trustScore, badges, guarantees } as unknown as Record<string, unknown>;
      return trustElements;
    });
    stages.push(trustStage);
  }

  // 9. PERSONALIZATION
  if (!aborted) {
    const personalizationStage = await runPipelineStage("personalization", async () => {
      const { personalize } = await import("./personalization-engine.ts");
      const ctx = {
        visitorId: leadKey,
        niche: nicheSlug,
        source: (leadData.source as string) ?? "manual",
        device: (leadData.device as string) ?? "desktop",
        isReturning: Boolean(leadData.returning ?? (leadData.returnVisits as number ?? 0) > 0),
        score: compositeScore,
        engagementLevel: (compositeScore >= 60 ? "high" : compositeScore >= 30 ? "medium" : "low") as "low" | "medium" | "high",
      };
      const experience = personalize(ctx);
      personalizedExperience = experience as unknown as Record<string, unknown>;
      return personalizedExperience;
    });
    stages.push(personalizationStage);
  }

  // 10. ESCALATION
  if (!aborted) {
    const escalationStage = await runPipelineStage("escalation", async () => {
      const { evaluateEscalation } = await import("./escalation-engine.ts");
      const signals: Record<string, unknown> = {
        estimatedDealValue: leadData.estimatedDealValue,
        hasPhoneRequest: Boolean(leadData.wantsBooking ?? leadData.askingForQuote),
        competitorMentioned: Boolean(leadData.competitorMentioned),
        urgencyLevel: compositeScore >= 80 ? "critical" : compositeScore >= 60 ? "high" : "medium",
        companySize: leadData.companySize,
        phone: leadData.phone,
      };
      const result = await evaluateEscalation(leadKey, compositeScore, signals);
      escalation = {
        shouldEscalate: result.shouldEscalate,
        type: result.escalationType ?? undefined,
      };
      if (result.shouldEscalate) {
        const { createHandoff } = await import("./escalation-engine.ts");
        const handoff = await createHandoff(leadKey, "auto-assigned", `Pipeline escalation: ${result.reasons.join(", ")}`);
        escalation.handoff = handoff as unknown as Record<string, unknown>;
      }
      return { ...result, escalation } as unknown as Record<string, unknown>;
    });
    stages.push(escalationStage);
  }

  // 11. ATTRIBUTION
  if (!aborted) {
    const attributionStage = await runPipelineStage("attribution", async () => {
      const { recordTouch } = await import("./attribution.ts");
      const touch = await recordTouch({
        leadKey,
        channel: (leadData.source as string) ?? "direct",
        source: (leadData.source as string) ?? "direct",
        medium: (leadData.medium as string) ?? "none",
        campaign: (leadData.campaign as string) ?? "",
        content: "",
        referrer: (leadData.referrer as string) ?? "",
        landingPage: (leadData.page as string) ?? "/",
      });
      return { touchId: touch.id, channel: touch.channel } as Record<string, unknown>;
    });
    stages.push(attributionStage);
  }

  // 12. DATA MOAT
  if (!aborted) {
    const dataMoatStage = await runPipelineStage("data-moat", async () => {
      const { recordBehaviorPattern, recordConversionPath } = await import("./data-moat.ts");
      await recordBehaviorPattern(tenantId, nicheSlug, {
        behaviorType: "pipeline-processed",
        funnelStage: route,
        pattern: `route:${route}:score:${compositeScore}`,
        sampleSize: 1,
        confidence: 0.8,
        liftMultiplier: 1.0,
      });
      await recordConversionPath(tenantId, nicheSlug, leadKey, [
        {
          channel: (leadData.source as string) ?? "direct",
          action: "pipeline-intake",
          funnelStage: "captured",
          timestampIso: new Date().toISOString(),
        },
      ]);
      return { recorded: true };
    });
    stages.push(dataMoatStage);
  }

  // 13. DISTRIBUTION
  if (!aborted) {
    const distributionStage = await runPipelineStage("distribution", async () => {
      const { trackDistributionMetric } = await import("./distribution-engine.ts");
      await trackDistributionMetric(tenantId, (leadData.source as string) ?? "direct", "pipeline-lead", 1);
      return { tracked: true, channel: (leadData.source as string) ?? "direct" };
    });
    stages.push(distributionStage);
  }

  // 14. FOLLOW-UP
  if (!aborted) {
    const followUpStage = await runPipelineStage("follow-up", async () => {
      const plan = generateFollowUpPlan(route, nicheSlug, leadData);
      followUpPlan = plan as unknown as Record<string, unknown>;
      return followUpPlan;
    });
    stages.push(followUpStage);
  }

  // 15. MONETIZATION
  if (!aborted) {
    const monetizationStage = await runPipelineStage("monetization", async () => {
      const { calculateLeadValue } = await import("./monetization-engine.ts");
      const valuation = calculateLeadValue({ id: leadKey }, nicheSlug, compositeScore);
      return valuation as unknown as Record<string, unknown>;
    });
    stages.push(monetizationStage);
  }

  const completedAt = new Date().toISOString();
  const totalDurationMs = Date.now() - pipelineStart;

  const result: PipelineResult = {
    id: pipelineId,
    leadKey,
    tenantId,
    niche: nicheSlug,
    stages,
    route,
    offer,
    psychologyDirectives,
    personalizedExperience,
    trustElements,
    escalation,
    followUpPlan,
    totalDurationMs,
    startedAt,
    completedAt,
  };

  pipelineHistory.push(result);

  await persistPipelineRun(result);

  return result;
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

async function persistPipelineRun(result: PipelineResult): Promise<void> {
  await ensurePipelineSchema();
  const pool = getPool();
  if (!pool) return;

  try {
    await pool.query(
      `INSERT INTO lead_os_pipeline_runs
        (id, lead_key, tenant_id, niche, route, stages, result, total_duration_ms, started_at, completed_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (id) DO NOTHING`,
      [
        result.id,
        result.leadKey,
        result.tenantId,
        result.niche,
        result.route,
        JSON.stringify(result.stages),
        JSON.stringify(result),
        result.totalDurationMs,
        result.startedAt,
        result.completedAt,
      ],
    );
  } catch {
    // Best effort — in-memory store has the data
  }
}

// ---------------------------------------------------------------------------
// History & stats
// ---------------------------------------------------------------------------

export function getPipelineHistory(tenantId: string, limit: number = 50): PipelineResult[] {
  return pipelineHistory
    .filter((r) => r.tenantId === tenantId)
    .slice(-limit)
    .reverse();
}

export function getPipelineStats(tenantId: string, period: string = "all"): PipelineStats {
  const runs = pipelineHistory.filter((r) => r.tenantId === tenantId);

  if (runs.length === 0) {
    return {
      tenantId,
      period,
      totalRuns: 0,
      avgDurationMs: 0,
      stageFailureRates: {},
      routeDistribution: {},
      escalationRate: 0,
      generatedAt: new Date().toISOString(),
    };
  }

  const avgDurationMs = Math.round(
    runs.reduce((sum, r) => sum + r.totalDurationMs, 0) / runs.length,
  );

  const stageCounts: Record<string, { total: number; failed: number }> = {};
  for (const run of runs) {
    for (const stage of run.stages) {
      if (!stageCounts[stage.name]) {
        stageCounts[stage.name] = { total: 0, failed: 0 };
      }
      stageCounts[stage.name].total += 1;
      if (stage.status === "failed") {
        stageCounts[stage.name].failed += 1;
      }
    }
  }

  const stageFailureRates: Record<string, number> = {};
  for (const [name, counts] of Object.entries(stageCounts)) {
    stageFailureRates[name] = counts.total > 0
      ? Math.round((counts.failed / counts.total) * 100) / 100
      : 0;
  }

  const routeDistribution: Record<string, number> = {};
  for (const run of runs) {
    routeDistribution[run.route] = (routeDistribution[run.route] ?? 0) + 1;
  }

  const escalations = runs.filter((r) => r.escalation?.shouldEscalate).length;
  const escalationRate = Math.round((escalations / runs.length) * 100) / 100;

  return {
    tenantId,
    period,
    totalRuns: runs.length,
    avgDurationMs,
    stageFailureRates,
    routeDistribution,
    escalationRate,
    generatedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

export function _resetPipelineStore(): void {
  pipelineHistory.length = 0;
}
