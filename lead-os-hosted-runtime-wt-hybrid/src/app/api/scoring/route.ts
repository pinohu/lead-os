import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { createRateLimiter } from "@/lib/rate-limiter";
import { z } from "zod";
import { getClientIp } from "@/lib/request-utils";

const rateLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 60 });

const ScoringContextSchema = z.object({
  leadKey: z.string().max(128).optional(),
  email: z.string().max(254).optional(),
  phone: z.string().max(20).optional(),
  source: z.string().max(200).optional(),
  niche: z.string().max(200).optional(),
  funnelFamily: z.string().max(200).optional(),
  sessionCount: z.number().min(0).max(10_000).optional(),
  totalPageViews: z.number().min(0).max(100_000).optional(),
  totalTimeOnSite: z.number().min(0).max(86_400).optional(),
  intentSignals: z.array(z.string().max(100)).max(50).optional(),
  engagementScore: z.number().min(0).max(100).optional(),
  isReturning: z.boolean().optional(),
  hasAssessment: z.boolean().optional(),
  hasCalculator: z.boolean().optional(),
  hasBookingIntent: z.boolean().optional(),
  hasPricingView: z.boolean().optional(),
  hasContactView: z.boolean().optional(),
  hasFormSubmission: z.boolean().optional(),
  hasVideoEngagement: z.boolean().optional(),
  hasChatEngagement: z.boolean().optional(),
  daysActive: z.number().min(0).max(3_650).optional(),
  leadMagnetsDownloaded: z.number().min(0).max(1_000).optional(),
  emailsOpened: z.number().min(0).max(10_000).optional(),
  emailsClicked: z.number().min(0).max(10_000).optional(),
  deviceType: z.enum(["desktop", "mobile", "tablet"]).optional(),
  companySize: z.enum(["1-10", "11-50", "51-200", "201-1000", "1000+"]).optional(),
  revenue: z.enum(["Under $100K", "$100K-$500K", "$500K-$1M", "$1M-$5M", "$5M+"]).optional(),
  role: z.string().max(200).optional(),
  metadata: z.record(z.string().max(64), z.union([z.string().max(256), z.number(), z.boolean(), z.null()])).optional(),
});

interface ScoringContext {
  leadKey?: string;
  email?: string;
  phone?: string;
  source?: string;
  niche?: string;
  funnelFamily?: string;
  sessionCount?: number;
  totalPageViews?: number;
  totalTimeOnSite?: number;
  intentSignals?: string[];
  engagementScore?: number;
  isReturning?: boolean;
  hasAssessment?: boolean;
  hasCalculator?: boolean;
  hasBookingIntent?: boolean;
  hasPricingView?: boolean;
  hasContactView?: boolean;
  hasFormSubmission?: boolean;
  hasVideoEngagement?: boolean;
  hasChatEngagement?: boolean;
  daysActive?: number;
  leadMagnetsDownloaded?: number;
  emailsOpened?: number;
  emailsClicked?: number;
  deviceType?: string;
  companySize?: string;
  revenue?: string;
  role?: string;
  metadata?: Record<string, unknown>;
}

interface ScoringResult {
  leadKey?: string;
  behavioralScore: number;
  demographicScore: number;
  intentScore: number;
  engagementScore: number;
  compositeScore: number;
  grade: "A" | "B" | "C" | "D" | "F";
  isHot: boolean;
  temperature: "cold" | "warm" | "hot" | "burning";
  recommendedAction: string;
  signals: string[];
  breakdown: {
    behavioral: Record<string, number>;
    demographic: Record<string, number>;
    intent: Record<string, number>;
    engagement: Record<string, number>;
  };
}

function computeBehavioralScore(ctx: ScoringContext): { score: number; breakdown: Record<string, number> } {
  const breakdown: Record<string, number> = {};

  const sessionPoints = Math.min(20, (ctx.sessionCount ?? 0) * 5);
  breakdown.sessions = sessionPoints;

  const pageViewPoints = Math.min(15, (ctx.totalPageViews ?? 0) * 1.5);
  breakdown.pageViews = Math.round(pageViewPoints * 100) / 100;

  const timePoints = Math.min(15, ((ctx.totalTimeOnSite ?? 0) / 60) * 3);
  breakdown.timeOnSite = Math.round(timePoints * 100) / 100;

  const returningPoints = ctx.isReturning ? 10 : 0;
  breakdown.returning = returningPoints;

  const daysPoints = Math.min(10, (ctx.daysActive ?? 0) * 2);
  breakdown.daysActive = daysPoints;

  const magnetPoints = Math.min(10, (ctx.leadMagnetsDownloaded ?? 0) * 5);
  breakdown.leadMagnets = magnetPoints;

  const emailOpenPoints = Math.min(10, (ctx.emailsOpened ?? 0) * 3);
  breakdown.emailOpens = emailOpenPoints;

  const emailClickPoints = Math.min(10, (ctx.emailsClicked ?? 0) * 5);
  breakdown.emailClicks = emailClickPoints;

  const total = Object.values(breakdown).reduce((sum, v) => sum + v, 0);
  return { score: Math.min(100, Math.round(total)), breakdown };
}

function computeDemographicScore(ctx: ScoringContext): { score: number; breakdown: Record<string, number> } {
  const breakdown: Record<string, number> = {};

  const hasEmail = ctx.email ? 20 : 0;
  breakdown.email = hasEmail;

  const hasPhone = ctx.phone ? 15 : 0;
  breakdown.phone = hasPhone;

  const companySizePoints: Record<string, number> = {
    "1-10": 5,
    "11-50": 10,
    "51-200": 15,
    "201-1000": 20,
    "1000+": 20,
  };
  const companyPoints = companySizePoints[ctx.companySize ?? ""] ?? 0;
  breakdown.companySize = companyPoints;

  const revenuePoints: Record<string, number> = {
    "Under $100K": 5,
    "$100K-$500K": 10,
    "$500K-$1M": 15,
    "$1M-$5M": 20,
    "$5M+": 25,
  };
  const revPoints = revenuePoints[ctx.revenue ?? ""] ?? 0;
  breakdown.revenue = revPoints;

  const rolePoints: Record<string, number> = {
    owner: 20,
    ceo: 20,
    founder: 20,
    director: 15,
    manager: 10,
    vp: 15,
  };
  const rPoints = rolePoints[(ctx.role ?? "").toLowerCase()] ?? 0;
  breakdown.role = rPoints;

  const total = Object.values(breakdown).reduce((sum, v) => sum + v, 0);
  return { score: Math.min(100, Math.round(total)), breakdown };
}

function computeIntentScore(ctx: ScoringContext): { score: number; breakdown: Record<string, number> } {
  const breakdown: Record<string, number> = {};

  const signals = new Set(ctx.intentSignals ?? []);

  breakdown.pricingView = (ctx.hasPricingView || signals.has("pricing_page_view")) ? 20 : 0;
  breakdown.contactView = (ctx.hasContactView || signals.has("contact_page_view")) ? 15 : 0;
  breakdown.bookingIntent = (ctx.hasBookingIntent || signals.has("booking_intent")) ? 25 : 0;
  breakdown.formSubmission = (ctx.hasFormSubmission || signals.has("form_submission")) ? 20 : 0;
  breakdown.assessment = (ctx.hasAssessment || signals.has("assessment_completion")) ? 15 : 0;
  breakdown.calculator = (ctx.hasCalculator || signals.has("calculator_usage")) ? 10 : 0;
  breakdown.videoEngagement = (ctx.hasVideoEngagement || signals.has("video_engagement")) ? 5 : 0;
  breakdown.chatEngagement = (ctx.hasChatEngagement || signals.has("chat_engagement")) ? 10 : 0;
  breakdown.caseStudy = signals.has("long_case_study_engagement") ? 10 : 0;
  breakdown.comparison = signals.has("comparison_page_view") ? 15 : 0;
  breakdown.deepScroll = signals.has("service_page_deep_scroll") ? 10 : 0;

  const total = Object.values(breakdown).reduce((sum, v) => sum + v, 0);
  return { score: Math.min(100, Math.round(total)), breakdown };
}

function computeEngagementScore(ctx: ScoringContext): { score: number; breakdown: Record<string, number> } {
  const breakdown: Record<string, number> = {};

  if (typeof ctx.engagementScore === "number") {
    breakdown.externalScore = ctx.engagementScore;
    return { score: Math.min(100, ctx.engagementScore), breakdown };
  }

  const sessionWeight = Math.min(25, (ctx.sessionCount ?? 0) * 8);
  breakdown.sessions = sessionWeight;

  const pageWeight = Math.min(20, (ctx.totalPageViews ?? 0) * 2);
  breakdown.pageViews = pageWeight;

  const timeWeight = Math.min(20, ((ctx.totalTimeOnSite ?? 0) / 60) * 4);
  breakdown.timeOnSite = Math.round(timeWeight * 100) / 100;

  const signalWeight = Math.min(25, (ctx.intentSignals?.length ?? 0) * 5);
  breakdown.signals = signalWeight;

  if (ctx.isReturning) breakdown.returning = 5;
  if ((ctx.daysActive ?? 0) >= 3) breakdown.activeDays = 5;

  const total = Object.values(breakdown).reduce((sum, v) => sum + v, 0);
  return { score: Math.min(100, Math.round(total)), breakdown };
}

function computeComposite(behavioral: number, demographic: number, intent: number, engagement: number): number {
  return Math.round(
    behavioral * 0.25 +
    demographic * 0.15 +
    intent * 0.35 +
    engagement * 0.25,
  );
}

function resolveGrade(composite: number): ScoringResult["grade"] {
  if (composite >= 80) return "A";
  if (composite >= 60) return "B";
  if (composite >= 40) return "C";
  if (composite >= 20) return "D";
  return "F";
}

function resolveTemperature(composite: number): ScoringResult["temperature"] {
  if (composite >= 85) return "burning";
  if (composite >= 60) return "hot";
  if (composite >= 30) return "warm";
  return "cold";
}

function resolveAction(composite: number, intent: number): string {
  if (composite >= 85 || intent >= 80) return "Immediate personal outreach. Schedule priority call.";
  if (composite >= 60 || intent >= 60) return "Book consultation. Send tailored case study.";
  if (composite >= 40) return "Enroll in nurture sequence. Recommend assessment or calculator.";
  if (composite >= 20) return "Deliver lead magnet. Add to awareness campaign.";
  return "Monitor engagement. Serve educational content.";
}

function collectSignals(ctx: ScoringContext): string[] {
  const signals: string[] = [];

  if (ctx.hasBookingIntent) signals.push("booking_intent");
  if (ctx.hasPricingView) signals.push("pricing_engagement");
  if (ctx.hasContactView) signals.push("contact_interest");
  if (ctx.hasFormSubmission) signals.push("form_completed");
  if (ctx.hasAssessment) signals.push("assessment_completed");
  if (ctx.hasCalculator) signals.push("calculator_used");
  if (ctx.isReturning) signals.push("returning_visitor");
  if ((ctx.sessionCount ?? 0) >= 3) signals.push("multiple_sessions");
  if ((ctx.emailsClicked ?? 0) > 0) signals.push("email_engaged");
  if (ctx.hasChatEngagement) signals.push("chat_engaged");

  for (const s of ctx.intentSignals ?? []) {
    if (!signals.includes(s)) signals.push(s);
  }

  return signals;
}

function scoreContext(ctx: ScoringContext): ScoringResult {
  const behavioral = computeBehavioralScore(ctx);
  const demographic = computeDemographicScore(ctx);
  const intent = computeIntentScore(ctx);
  const engagement = computeEngagementScore(ctx);

  const composite = computeComposite(
    behavioral.score,
    demographic.score,
    intent.score,
    engagement.score,
  );

  return {
    leadKey: ctx.leadKey,
    behavioralScore: behavioral.score,
    demographicScore: demographic.score,
    intentScore: intent.score,
    engagementScore: engagement.score,
    compositeScore: composite,
    grade: resolveGrade(composite),
    isHot: composite >= 70 || intent.score >= 60,
    temperature: resolveTemperature(composite),
    recommendedAction: resolveAction(composite, intent.score),
    signals: collectSignals(ctx),
    breakdown: {
      behavioral: behavioral.breakdown,
      demographic: demographic.breakdown,
      intent: intent.breakdown,
      engagement: engagement.breakdown,
    },
  };
}

// Field length and range constants for scoring context validation.
const MAX_LEAD_KEY_LENGTH = 128;
const MAX_EMAIL_LENGTH = 254; // RFC 5321 maximum
const MAX_PHONE_LENGTH = 20;
const MAX_STRING_FIELD_LENGTH = 200;
const MAX_INTENT_SIGNALS = 50;
const MAX_INTENT_SIGNAL_LENGTH = 100;
// Numeric context fields: cap at a reasonable ceiling to prevent inflated scores
// from attacker-supplied values and guard against Infinity/NaN.
const MAX_SESSION_COUNT = 10_000;
const MAX_PAGE_VIEWS = 100_000;
const MAX_TIME_ON_SITE_SECONDS = 86_400; // 24 hours
const MAX_DAYS_ACTIVE = 3_650; // 10 years
const MAX_LEAD_MAGNETS = 1_000;
const MAX_EMAILS_OPENED = 10_000;
const MAX_EMAILS_CLICKED = 10_000;
const MAX_ENGAGEMENT_SCORE = 100;
const MAX_METADATA_KEYS = 20;
const MAX_METADATA_KEY_LENGTH = 64;
const MAX_METADATA_VALUE_LENGTH = 256;

const ALLOWED_COMPANY_SIZES = new Set(["1-10", "11-50", "51-200", "201-1000", "1000+"]);
const ALLOWED_REVENUES = new Set(["Under $100K", "$100K-$500K", "$500K-$1M", "$1M-$5M", "$5M+"]);
const ALLOWED_DEVICE_TYPES = new Set(["desktop", "mobile", "tablet"]);

function safeFiniteNumber(value: unknown, max: number): number | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "number" || !isFinite(value) || isNaN(value)) return undefined;
  return Math.max(0, Math.min(max, value));
}

function isValidScoringMetadata(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value !== "object" || Array.isArray(value)) return false;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj);
  if (keys.length > MAX_METADATA_KEYS) return false;
  return keys.every(
    (k) =>
      k.length <= MAX_METADATA_KEY_LENGTH &&
      (typeof obj[k] === "string"
        ? (obj[k] as string).length <= MAX_METADATA_VALUE_LENGTH
        : typeof obj[k] === "number" || typeof obj[k] === "boolean" || obj[k] === null),
  );
}

function sanitizeScoringContext(raw: Record<string, unknown>): ScoringContext {
  const intentSignals = Array.isArray(raw.intentSignals)
    ? raw.intentSignals
        .filter((s): s is string => typeof s === "string" && s.length <= MAX_INTENT_SIGNAL_LENGTH)
        .slice(0, MAX_INTENT_SIGNALS)
    : undefined;

  return {
    leadKey:
      typeof raw.leadKey === "string" && raw.leadKey.length <= MAX_LEAD_KEY_LENGTH
        ? raw.leadKey
        : undefined,
    email:
      typeof raw.email === "string" && raw.email.length <= MAX_EMAIL_LENGTH
        ? raw.email
        : undefined,
    phone:
      typeof raw.phone === "string" && raw.phone.length <= MAX_PHONE_LENGTH
        ? raw.phone
        : undefined,
    source:
      typeof raw.source === "string" && raw.source.length <= MAX_STRING_FIELD_LENGTH
        ? raw.source
        : undefined,
    niche:
      typeof raw.niche === "string" && raw.niche.length <= MAX_STRING_FIELD_LENGTH
        ? raw.niche
        : undefined,
    funnelFamily:
      typeof raw.funnelFamily === "string" && raw.funnelFamily.length <= MAX_STRING_FIELD_LENGTH
        ? raw.funnelFamily
        : undefined,
    deviceType:
      typeof raw.deviceType === "string" && ALLOWED_DEVICE_TYPES.has(raw.deviceType)
        ? raw.deviceType
        : undefined,
    companySize:
      typeof raw.companySize === "string" && ALLOWED_COMPANY_SIZES.has(raw.companySize)
        ? raw.companySize
        : undefined,
    revenue:
      typeof raw.revenue === "string" && ALLOWED_REVENUES.has(raw.revenue)
        ? raw.revenue
        : undefined,
    role:
      typeof raw.role === "string" && raw.role.length <= MAX_STRING_FIELD_LENGTH
        ? raw.role
        : undefined,
    sessionCount: safeFiniteNumber(raw.sessionCount, MAX_SESSION_COUNT),
    totalPageViews: safeFiniteNumber(raw.totalPageViews, MAX_PAGE_VIEWS),
    totalTimeOnSite: safeFiniteNumber(raw.totalTimeOnSite, MAX_TIME_ON_SITE_SECONDS),
    engagementScore: safeFiniteNumber(raw.engagementScore, MAX_ENGAGEMENT_SCORE),
    daysActive: safeFiniteNumber(raw.daysActive, MAX_DAYS_ACTIVE),
    leadMagnetsDownloaded: safeFiniteNumber(raw.leadMagnetsDownloaded, MAX_LEAD_MAGNETS),
    emailsOpened: safeFiniteNumber(raw.emailsOpened, MAX_EMAILS_OPENED),
    emailsClicked: safeFiniteNumber(raw.emailsClicked, MAX_EMAILS_CLICKED),
    intentSignals,
    isReturning: typeof raw.isReturning === "boolean" ? raw.isReturning : undefined,
    hasAssessment: typeof raw.hasAssessment === "boolean" ? raw.hasAssessment : undefined,
    hasCalculator: typeof raw.hasCalculator === "boolean" ? raw.hasCalculator : undefined,
    hasBookingIntent: typeof raw.hasBookingIntent === "boolean" ? raw.hasBookingIntent : undefined,
    hasPricingView: typeof raw.hasPricingView === "boolean" ? raw.hasPricingView : undefined,
    hasContactView: typeof raw.hasContactView === "boolean" ? raw.hasContactView : undefined,
    hasFormSubmission: typeof raw.hasFormSubmission === "boolean" ? raw.hasFormSubmission : undefined,
    hasVideoEngagement: typeof raw.hasVideoEngagement === "boolean" ? raw.hasVideoEngagement : undefined,
    hasChatEngagement: typeof raw.hasChatEngagement === "boolean" ? raw.hasChatEngagement : undefined,
    metadata: isValidScoringMetadata(raw.metadata)
      ? (raw.metadata as Record<string, unknown>)
      : undefined,
  };
}

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const ip = getClientIp(request);
  const rateResult = rateLimiter.check(`scoring:${ip}`);
  if (!rateResult.allowed) {
    return NextResponse.json(
      { data: null, error: { code: "RATE_LIMITED", message: "Too many requests. Please try again later." }, meta: null },
      {
        status: 429,
        headers: {
          ...headers,
          "Retry-After": String(Math.ceil((rateResult.resetAt - Date.now()) / 1000)),
          "X-RateLimit-Limit": "60",
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(rateResult.resetAt),
        },
      },
    );
  }

  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Content-Type must be application/json" }, meta: null },
        { status: 415, headers },
      );
    }

    const raw = await request.json();

    const validation = ScoringContextSchema.safeParse(raw);
    if (!validation.success) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: validation.error.issues }, meta: {} },
        { status: 422, headers },
      );
    }

    // Sanitize all numeric and string fields before scoring to prevent
    // inflated scores from Infinity/NaN/oversized inputs.
    const ctx = sanitizeScoringContext(validation.data as Record<string, unknown>);
    const result = scoreContext(ctx);

    return NextResponse.json(
      { data: result, error: null, meta: { scoredAt: new Date().toISOString() } },
      { headers },
    );
  } catch (err) {
    logger.error("scoring failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      {
        data: null,
        error: { code: "SCORING_FAILED", message: "Failed to compute scores" },
        meta: null,
      },
      { status: 400, headers },
    );
  }
}
