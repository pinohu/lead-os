export interface ScoreFactors {
  factor: string;
  weight: number;
  value: number;
  contribution: number;
}

export interface LeadScore {
  type: "intent" | "fit" | "engagement" | "urgency" | "composite";
  score: number;
  factors: ScoreFactors[];
  computedAt: string;
}

export interface ScoringContext {
  source: string;
  niche?: string;
  service?: string;
  pagesViewed?: number;
  timeOnSite?: number;
  formCompletions?: number;
  chatMessages?: number;
  emailOpens?: number;
  emailClicks?: number;
  assessmentCompleted?: boolean;
  assessmentScore?: number;
  calculatorUsed?: boolean;
  returnVisits?: number;
  hasPhone?: boolean;
  hasCompany?: boolean;
  hasEmail?: boolean;
  urgencyIndicators?: string[];
  companySize?: string;
  budget?: string;
  timeline?: string;
  referralSource?: string;
  contentEngagement?: { type: string; count: number }[];
  lastActivityAt?: string;
}

const SOURCE_WEIGHTS: Record<string, number> = {
  referral: 30,
  organic: 20,
  paid: 25,
  direct: 15,
  social: 18,
  email: 22,
};

const TIMELINE_SCORES: Record<string, number> = {
  immediate: 40,
  "this-week": 35,
  "this-month": 30,
  "this-quarter": 20,
  exploring: 10,
};

const COMPANY_SIZE_SCORES: Record<string, number> = {
  enterprise: 20,
  "mid-market": 15,
  small: 10,
  solo: 5,
};

const URGENCY_KEYWORDS = [
  "asap",
  "urgent",
  "immediately",
  "right away",
  "emergency",
  "critical",
  "deadline",
  "time-sensitive",
  "rush",
  "need now",
];

const COMPETITOR_KEYWORDS = [
  "competitor",
  "alternative",
  "comparing",
  "switching",
  "currently using",
  "looking to replace",
  "better than",
];

const PAIN_KEYWORDS = [
  "struggling",
  "frustrated",
  "problem",
  "issue",
  "challenge",
  "pain",
  "broken",
  "failing",
  "losing",
  "wasting",
];

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function buildFactor(factor: string, weight: number, value: number): ScoreFactors {
  return {
    factor,
    weight,
    value,
    contribution: weight * value,
  };
}

function computeWeightedScore(factors: ScoreFactors[]): number {
  const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
  if (totalWeight === 0) return 0;
  const rawScore = factors.reduce((sum, f) => sum + f.contribution, 0) / totalWeight;
  return clampScore(rawScore);
}

function computeRecencyMultiplier(lastActivityAt: string | undefined): number {
  if (!lastActivityAt) return 0.5;
  const daysSince = (Date.now() - new Date(lastActivityAt).getTime()) / (1000 * 60 * 60 * 24);
  const halfLife = 7;
  return Math.pow(0.5, daysSince / halfLife);
}

function countKeywordMatches(indicators: string[], keywords: string[]): number {
  let count = 0;
  const lowerIndicators = indicators.map((s) => s.toLowerCase());
  for (const keyword of keywords) {
    for (const indicator of lowerIndicators) {
      if (indicator.includes(keyword)) {
        count++;
        break;
      }
    }
  }
  return count;
}

export function computeIntentScore(ctx: ScoringContext): LeadScore {
  const factors: ScoreFactors[] = [];

  const sourceValue = SOURCE_WEIGHTS[ctx.source.toLowerCase()] ?? 10;
  factors.push(buildFactor("source_quality", 0.2, sourceValue * (100 / 30)));

  const pageDepth = Math.min(ctx.pagesViewed ?? 0, 20);
  factors.push(buildFactor("page_depth", 0.15, pageDepth * 5));

  const formValue = Math.min((ctx.formCompletions ?? 0) * 35, 100);
  factors.push(buildFactor("form_completions", 0.2, formValue));

  const chatValue = Math.min((ctx.chatMessages ?? 0) * 10, 100);
  factors.push(buildFactor("chat_engagement", 0.15, chatValue));

  const assessmentValue = ctx.assessmentCompleted ? 100 : 0;
  factors.push(buildFactor("assessment_completed", 0.15, assessmentValue));

  const calculatorValue = ctx.calculatorUsed ? 80 : 0;
  factors.push(buildFactor("calculator_used", 0.1, calculatorValue));

  const timeValue = Math.min(((ctx.timeOnSite ?? 0) / 300) * 100, 100);
  factors.push(buildFactor("time_on_site", 0.05, timeValue));

  return {
    type: "intent",
    score: computeWeightedScore(factors),
    factors,
    computedAt: new Date().toISOString(),
  };
}

export function computeFitScore(ctx: ScoringContext): LeadScore {
  const factors: ScoreFactors[] = [];

  factors.push(buildFactor("has_company", 0.2, ctx.hasCompany ? 100 : 0));
  factors.push(buildFactor("has_phone", 0.15, ctx.hasPhone ? 100 : 0));
  factors.push(buildFactor("has_email", 0.1, ctx.hasEmail ? 100 : 0));

  const nicheMatch = ctx.niche ? 100 : 0;
  factors.push(buildFactor("niche_match", 0.2, nicheMatch));

  const serviceAlignment = ctx.service ? 100 : 0;
  factors.push(buildFactor("service_alignment", 0.15, serviceAlignment));

  const sizeScore = ctx.companySize ? (COMPANY_SIZE_SCORES[ctx.companySize.toLowerCase()] ?? 5) * 5 : 0;
  factors.push(buildFactor("company_size", 0.1, sizeScore));

  const budgetValue = ctx.budget ? 80 : 0;
  factors.push(buildFactor("budget_indicator", 0.1, budgetValue));

  return {
    type: "fit",
    score: computeWeightedScore(factors),
    factors,
    computedAt: new Date().toISOString(),
  };
}

export function computeEngagementScore(ctx: ScoringContext): LeadScore {
  const factors: ScoreFactors[] = [];
  const recency = computeRecencyMultiplier(ctx.lastActivityAt);

  const emailOpenValue = Math.min((ctx.emailOpens ?? 0) * 15, 100);
  factors.push(buildFactor("email_opens", 0.15, emailOpenValue * recency));

  const emailClickValue = Math.min((ctx.emailClicks ?? 0) * 25, 100);
  factors.push(buildFactor("email_clicks", 0.2, emailClickValue * recency));

  const returnVisitValue = Math.min((ctx.returnVisits ?? 0) * 20, 100);
  factors.push(buildFactor("return_visits", 0.2, returnVisitValue * recency));

  const contentTypes = ctx.contentEngagement ?? [];
  const breadthValue = Math.min(contentTypes.length * 20, 100);
  factors.push(buildFactor("content_breadth", 0.15, breadthValue * recency));

  const contentDepth = contentTypes.reduce((sum, c) => sum + c.count, 0);
  const depthValue = Math.min(contentDepth * 10, 100);
  factors.push(buildFactor("content_depth", 0.1, depthValue * recency));

  const chatValue = Math.min((ctx.chatMessages ?? 0) * 10, 100);
  factors.push(buildFactor("chat_messages", 0.1, chatValue * recency));

  const assessmentDepth = ctx.assessmentCompleted
    ? Math.min((ctx.assessmentScore ?? 50), 100)
    : 0;
  factors.push(buildFactor("assessment_depth", 0.1, assessmentDepth * recency));

  return {
    type: "engagement",
    score: computeWeightedScore(factors),
    factors,
    computedAt: new Date().toISOString(),
  };
}

export function computeUrgencyScore(ctx: ScoringContext): LeadScore {
  const factors: ScoreFactors[] = [];
  const indicators = ctx.urgencyIndicators ?? [];

  const urgencyMatches = countKeywordMatches(indicators, URGENCY_KEYWORDS);
  const urgencyValue = Math.min(urgencyMatches * 30, 100);
  factors.push(buildFactor("urgency_language", 0.3, urgencyValue));

  const timelineKey = (ctx.timeline ?? "exploring").toLowerCase();
  const timelineValue = (TIMELINE_SCORES[timelineKey] ?? 10) * (100 / 40);
  factors.push(buildFactor("timeline", 0.25, timelineValue));

  const budgetValue = ctx.budget ? 80 : 0;
  factors.push(buildFactor("budget_mentioned", 0.15, budgetValue));

  const competitorMatches = countKeywordMatches(indicators, COMPETITOR_KEYWORDS);
  const competitorValue = Math.min(competitorMatches * 40, 100);
  factors.push(buildFactor("competitor_mentioned", 0.15, competitorValue));

  const painMatches = countKeywordMatches(indicators, PAIN_KEYWORDS);
  const painValue = Math.min(painMatches * 25, 100);
  factors.push(buildFactor("pain_density", 0.15, painValue));

  return {
    type: "urgency",
    score: computeWeightedScore(factors),
    factors,
    computedAt: new Date().toISOString(),
  };
}

export interface ScoringWeightOverrides {
  intentWeight: number;
  fitWeight: number;
  engagementWeight: number;
  urgencyWeight: number;
}

export function computeCompositeScore(ctx: ScoringContext, overrides?: ScoringWeightOverrides): LeadScore {
  const intent = computeIntentScore(ctx);
  const fit = computeFitScore(ctx);
  const engagement = computeEngagementScore(ctx);
  const urgency = computeUrgencyScore(ctx);

  const iw = overrides?.intentWeight ?? 0.3;
  const fw = overrides?.fitWeight ?? 0.25;
  const ew = overrides?.engagementWeight ?? 0.25;
  const uw = overrides?.urgencyWeight ?? 0.2;

  const factors: ScoreFactors[] = [
    buildFactor("intent", iw, intent.score),
    buildFactor("fit", fw, fit.score),
    buildFactor("engagement", ew, engagement.score),
    buildFactor("urgency", uw, urgency.score),
  ];

  return {
    type: "composite",
    score: computeWeightedScore(factors),
    factors,
    computedAt: new Date().toISOString(),
  };
}

export function classifyLeadTemperature(composite: number): "cold" | "warm" | "hot" | "burning" {
  if (composite >= 80) return "burning";
  if (composite >= 60) return "hot";
  if (composite >= 35) return "warm";
  return "cold";
}

export function getScoreRecommendation(
  scores: LeadScore[],
): { action: string; priority: "low" | "medium" | "high" | "critical"; channel: string; reason: string } {
  const compositeScore = scores.find((s) => s.type === "composite");
  const intentScore = scores.find((s) => s.type === "intent");
  const urgencyScore = scores.find((s) => s.type === "urgency");
  const fitScore = scores.find((s) => s.type === "fit");
  const engagementScore = scores.find((s) => s.type === "engagement");

  const composite = compositeScore?.score ?? 0;
  const intent = intentScore?.score ?? 0;
  const urgency = urgencyScore?.score ?? 0;
  const fit = fitScore?.score ?? 0;
  const engagement = engagementScore?.score ?? 0;

  if (composite >= 80 || urgency >= 75) {
    return {
      action: "Immediate outreach: call or book a meeting within the hour",
      priority: "critical",
      channel: "phone",
      reason: `Composite score ${composite} with urgency ${urgency} signals a ready buyer`,
    };
  }

  if (composite >= 60 || (intent >= 70 && fit >= 50)) {
    return {
      action: "Send personalized follow-up and attempt to schedule a call",
      priority: "high",
      channel: "email",
      reason: `Strong intent (${intent}) combined with good fit (${fit}) warrants direct outreach`,
    };
  }

  if (composite >= 35 || engagement >= 50) {
    return {
      action: "Enroll in nurture sequence with targeted content",
      priority: "medium",
      channel: "email",
      reason: `Moderate engagement (${engagement}) suggests interest that needs nurturing`,
    };
  }

  return {
    action: "Add to awareness drip campaign and monitor for re-engagement",
    priority: "low",
    channel: "email",
    reason: `Low composite score (${composite}) indicates early-stage interest`,
  };
}
