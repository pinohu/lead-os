import { NextResponse } from "next/server";
import { z } from "zod";
import {
  classifyLeadTemperature,
  computeCompositeScore,
  computeEngagementScore,
  computeFitScore,
  computeIntentScore,
  computeUrgencyScore,
  getScoreRecommendation,
  type ScoringContext,
} from "@/lib/scoring-engine";
import { decideNextStep } from "@/lib/orchestrator";
import { persistLead } from "@/lib/intake";
import { tenantConfig } from "@/lib/tenant";

const LeadCaptureSchema = z.object({
  action: z.literal("lead-capture"),
  firstName: z.string().min(1).max(80),
  lastName: z.string().max(80).optional().default(""),
  email: z.string().email().max(254),
  phone: z.string().max(40).optional().default(""),
  service: z.string().max(120).optional().default(""),
});

const ScoreRouteSchema = z.object({
  action: z.literal("score-route"),
  source: z.string().min(1).max(80).default("assessment"),
  hasPhone: z.boolean().default(true),
  askingForQuote: z.boolean().default(true),
  wantsBooking: z.boolean().default(false),
  returning: z.boolean().default(false),
  contentEngaged: z.boolean().default(true),
  companySize: z.enum(["solo", "small", "mid-market", "enterprise"]).default("small"),
  budget: z.string().min(1).max(80).default("$5,000/month"),
});

const SupportSchema = z.object({
  action: z.literal("support-ticket"),
  email: z.string().email().max(254),
  severity: z.enum(["standard", "urgent", "launch-blocker"]).default("urgent"),
  summary: z.string().min(4).max(240),
});

const RequestSchema = z.discriminatedUnion("action", [
  LeadCaptureSchema,
  ScoreRouteSchema,
  SupportSchema,
]);

function ticketId(email: string, summary: string): string {
  const seed = `${email}:${summary}:${new Date().toISOString().slice(0, 10)}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  return `los-${Math.abs(hash).toString(16).padStart(8, "0").slice(0, 8)}`;
}

function scoreAndRoute(input: z.infer<typeof ScoreRouteSchema>) {
  const signals: ScoringContext = {
    source: input.source,
    hasPhone: input.hasPhone,
    hasEmail: true,
    hasCompany: true,
    formCompletions: input.askingForQuote || input.wantsBooking ? 1 : 0,
    returnVisits: input.returning ? 2 : 0,
    contentEngagement: input.contentEngaged ? [{ type: "pricing", count: 3 }] : [],
    urgencyIndicators: input.wantsBooking ? ["wants booking this week"] : [],
    companySize: input.companySize,
    budget: input.budget,
    timeline: input.wantsBooking ? "this-week" : "this-month",
    lastActivityAt: new Date().toISOString(),
  };

  const intent = computeIntentScore(signals);
  const fit = computeFitScore(signals);
  const engagement = computeEngagementScore(signals);
  const urgency = computeUrgencyScore(signals);
  const composite = computeCompositeScore(signals);
  const decision = decideNextStep({
    hasEmail: true,
    hasPhone: input.hasPhone,
    askingForQuote: input.askingForQuote,
    wantsBooking: input.wantsBooking,
    returning: input.returning,
    contentEngaged: input.contentEngaged,
    score: composite.score,
  });

  return {
    scores: { intent, fit, engagement, urgency, composite },
    temperature: classifyLeadTemperature(composite.score),
    recommendation: getScoreRecommendation([intent, fit, engagement, urgency, composite]),
    decision,
  };
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: { code: "VALIDATION_ERROR", message: "Invalid deliverable request", details: parsed.error.issues } },
      { status: 422 },
    );
  }

  if (parsed.data.action === "score-route") {
    return NextResponse.json({
      data: {
        action: parsed.data.action,
        ...scoreAndRoute(parsed.data),
        generatedAt: new Date().toISOString(),
      },
      error: null,
    });
  }

  if (parsed.data.action === "support-ticket") {
    const id = ticketId(parsed.data.email, parsed.data.summary);
    const responseTarget =
      parsed.data.severity === "launch-blocker" ? "4 business hours"
        : parsed.data.severity === "urgent" ? "1 business day"
          : "2 business days";

    return NextResponse.json({
      data: {
        ticketId: id,
        severity: parsed.data.severity,
        status: "created",
        responseTarget,
        nextStep: "A production support integration can forward this ticket to the configured helpdesk.",
        dryRun: true,
        createdAt: new Date().toISOString(),
      },
      error: null,
    });
  }

  const result = await persistLead(
    {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      email: parsed.data.email,
      phone: parsed.data.phone || undefined,
      service: parsed.data.service || "lead-capture",
      source: "manual",
      niche: "home-services",
      preferredFamily: "qualification",
      askingForQuote: true,
      wantsBooking: true,
      contentEngaged: true,
      dryRun: true,
      metadata: {
        liveDeliverable: "lead-capture-workspace",
      },
    },
    tenantConfig,
  );

  return NextResponse.json({
    data: {
      leadKey: result.leadKey,
      score: result.score,
      stage: result.stage,
      hot: result.hot,
      decision: result.decision,
      trace: result.trace,
      providerModes: {
        crm: result.crm.mode,
        ledger: result.logging.mode,
        workflow: result.workflow.mode,
        email: result.followup.email?.mode ?? "not_requested",
        sms: result.followup.sms?.mode ?? "not_requested",
        whatsapp: result.followup.whatsapp?.mode ?? "not_requested",
      },
      dryRun: true,
    },
    error: null,
  });
}
