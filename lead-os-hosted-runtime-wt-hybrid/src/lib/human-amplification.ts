// ---------------------------------------------------------------------------
// Human Amplification Layer
// PROACTIVE human leverage — identifies where human intervention produces
// disproportionate returns and routes accordingly.
// ---------------------------------------------------------------------------

import type { LeadContext, PsychologyProfile } from "./context-engine.ts";
import { getContextsByTenant } from "./context-engine.ts";
import type { NicheDefinition } from "./catalog.ts";
import {
  generateIdentityMessage,
  generateDeepObjectionResponse,
  type PersonaType,
} from "./deep-psychology.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HighValueOpportunity {
  leadKey: string;
  tenantId: string;
  reason: string;
  category: "cooling-hot-lead" | "stalled-high-intent" | "enterprise" | "competitor-mention" | "high-interest-blocked";
  estimatedValue: number;
  urgency: number;
  probability: number;
  recommendedAction: string;
  leadSnapshot: LeadContext;
}

export interface HumanROI {
  leadKey: string;
  estimatedDealValue: number;
  closeProbability: number;
  expectedRevenue: number;
  repCostPerHour: number;
  estimatedHours: number;
  totalRepCost: number;
  roiRatio: number;
  recommendation: "worth-it" | "borderline" | "not-worth-it";
}

export interface PrioritizedQueue {
  opportunities: HighValueOpportunity[];
  totalEstimatedValue: number;
  generatedAt: string;
}

export interface CallScriptSection {
  label: string;
  content: string;
}

export interface CallScript {
  leadKey: string;
  opening: CallScriptSection;
  discovery: CallScriptSection;
  valueProposition: CallScriptSection;
  objectionHandling: CallScriptSection;
  close: CallScriptSection;
  followUp: CallScriptSection;
}

export interface RepOutcome {
  repId: string;
  leadKey: string;
  result: "won" | "lost" | "no-answer" | "follow-up";
  dealValue: number;
  responseTimeMinutes: number;
  notes: string;
  timestamp: string;
}

export interface RepPerformance {
  repId: string;
  totalInteractions: number;
  wins: number;
  losses: number;
  closeRate: number;
  avgDealSize: number;
  avgResponseTimeMinutes: number;
  closeRateByTemperature: Record<string, number>;
  winRateByNiche: Record<string, number>;
  performanceScore: number;
  coachingRecommendations: string[];
}

export interface RepProfile {
  repId: string;
  name: string;
  niches: string[];
  timezone: string;
  currentLoad: number;
  maxLoad: number;
  performanceScore: number;
}

export interface AllocationAssignment {
  repId: string;
  opportunity: HighValueOpportunity;
  matchScore: number;
  reason: string;
}

export interface AllocationPlan {
  assignments: AllocationAssignment[];
  unassigned: HighValueOpportunity[];
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// In-memory outcome store (production would use Postgres)
// ---------------------------------------------------------------------------

const outcomeStore = new Map<string, RepOutcome[]>();

export function resetOutcomeStore(): void {
  outcomeStore.clear();
}

// ---------------------------------------------------------------------------
// Opportunity identification
// ---------------------------------------------------------------------------

const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

function hoursSinceLastSeen(lead: LeadContext): number {
  const lastSeen = new Date(lead.lastSeen).getTime();
  const now = Date.now();
  return (now - lastSeen) / (1000 * 60 * 60);
}

function estimateValueFromLead(lead: LeadContext): number {
  const baseValue = 5000;
  let multiplier = 1;

  if (lead.company) multiplier += 0.5;
  if (lead.scores.composite > 75) multiplier += 1;
  if (lead.scores.fit > 70) multiplier += 0.5;
  if (lead.psychologyProfile.identityType === "decision-maker") multiplier += 0.5;
  if (lead.psychologyProfile.identityType === "budget-holder") multiplier += 0.5;

  return Math.round(baseValue * multiplier);
}

export async function identifyHighValueOpportunities(
  tenantId: string,
): Promise<HighValueOpportunity[]> {
  const leads = await getContextsByTenant(tenantId, { limit: 100 });
  const opportunities: HighValueOpportunity[] = [];

  for (const lead of leads) {
    const opp = evaluateLead(lead);
    if (opp) opportunities.push(opp);
  }

  opportunities.sort((a, b) => {
    const scoreA = a.estimatedValue * a.urgency * a.probability;
    const scoreB = b.estimatedValue * b.urgency * b.probability;
    return scoreB - scoreA;
  });

  return opportunities;
}

function evaluateLead(lead: LeadContext): HighValueOpportunity | null {
  const estimatedValue = estimateValueFromLead(lead);
  const hoursSince = hoursSinceLastSeen(lead);

  if (lead.scores.composite > 75 && hoursSince > 48) {
    return {
      leadKey: lead.leadKey,
      tenantId: lead.tenantId,
      reason: `Hot lead (composite ${lead.scores.composite}) not contacted in ${Math.round(hoursSince)} hours — cooling rapidly`,
      category: "cooling-hot-lead",
      estimatedValue,
      urgency: 95,
      probability: 0.6,
      recommendedAction: "Immediate personal outreach — call within 1 hour",
      leadSnapshot: lead,
    };
  }

  if (
    lead.funnelStage === "qualified" &&
    lead.scores.intent > 60 &&
    !lead.offersAccepted.some((o) => o.includes("call") || o.includes("book"))
  ) {
    return {
      leadKey: lead.leadKey,
      tenantId: lead.tenantId,
      reason: `High-intent lead (intent ${lead.scores.intent}) completed qualification but did not book`,
      category: "stalled-high-intent",
      estimatedValue,
      urgency: 70,
      probability: 0.5,
      recommendedAction: "Send personalized follow-up addressing specific objections",
      leadSnapshot: lead,
    };
  }

  if (lead.company && lead.scores.fit > 70) {
    return {
      leadKey: lead.leadKey,
      tenantId: lead.tenantId,
      reason: `Enterprise company (${lead.company}) with high fit score (${lead.scores.fit})`,
      category: "enterprise",
      estimatedValue: estimatedValue * 3,
      urgency: 50,
      probability: 0.4,
      recommendedAction: "Assign senior rep for white-glove outreach",
      leadSnapshot: lead,
    };
  }

  const mentionsCompetitor = lead.interactions.some(
    (i) => i.type === "chat" && i.metadata?.mentionsCompetitor === true,
  );
  if (mentionsCompetitor) {
    return {
      leadKey: lead.leadKey,
      tenantId: lead.tenantId,
      reason: "Lead mentioned competitors — at risk of choosing alternative",
      category: "competitor-mention",
      estimatedValue,
      urgency: 80,
      probability: 0.35,
      recommendedAction: "Competitive differentiation call — highlight unique value props",
      leadSnapshot: lead,
    };
  }

  const returnVisits = lead.touchpoints.filter((t) => t.source === "return-visit").length;
  if (returnVisits >= 3 && lead.scores.composite < 50) {
    return {
      leadKey: lead.leadKey,
      tenantId: lead.tenantId,
      reason: `${returnVisits} return visits but no conversion — high interest, likely blocked`,
      category: "high-interest-blocked",
      estimatedValue,
      urgency: 60,
      probability: 0.45,
      recommendedAction: "Discovery call to identify and remove blockers",
      leadSnapshot: lead,
    };
  }

  return null;
}

// ---------------------------------------------------------------------------
// ROI calculation
// ---------------------------------------------------------------------------

export function calculateHumanROI(
  lead: LeadContext,
  estimatedDealValue: number,
  repCostPerHour: number,
): HumanROI {
  const temp = lead.scores.temperature;
  const probabilityMap: Record<string, number> = {
    burning: 0.7,
    hot: 0.5,
    warm: 0.3,
    cold: 0.1,
  };
  const closeProbability = probabilityMap[temp] ?? 0.1;

  const hoursMap: Record<string, number> = {
    burning: 0.5,
    hot: 1,
    warm: 2,
    cold: 4,
  };
  const estimatedHours = hoursMap[temp] ?? 2;

  const expectedRevenue = estimatedDealValue * closeProbability;
  const totalRepCost = repCostPerHour * estimatedHours;
  const roiRatio = totalRepCost > 0 ? expectedRevenue / totalRepCost : 0;

  let recommendation: HumanROI["recommendation"];
  if (roiRatio >= 3) {
    recommendation = "worth-it";
  } else if (roiRatio >= 1) {
    recommendation = "borderline";
  } else {
    recommendation = "not-worth-it";
  }

  return {
    leadKey: lead.leadKey,
    estimatedDealValue,
    closeProbability,
    expectedRevenue,
    repCostPerHour,
    estimatedHours,
    totalRepCost,
    roiRatio,
    recommendation,
  };
}

// ---------------------------------------------------------------------------
// Queue prioritization
// ---------------------------------------------------------------------------

export function prioritizeQueue(opportunities: HighValueOpportunity[]): PrioritizedQueue {
  const sorted = [...opportunities].sort((a, b) => {
    const scoreA = a.estimatedValue * (a.urgency / 100) * a.probability;
    const scoreB = b.estimatedValue * (b.urgency / 100) * b.probability;
    return scoreB - scoreA;
  });

  const totalEstimatedValue = sorted.reduce((sum, o) => sum + o.estimatedValue, 0);

  return {
    opportunities: sorted,
    totalEstimatedValue,
    generatedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Call script generation
// ---------------------------------------------------------------------------

export function generateCallScript(
  lead: LeadContext,
  nicheConfig: NicheDefinition,
): CallScript {
  const psychology = lead.psychologyProfile;
  const persona = psychology.identityType as PersonaType;

  const opening = buildOpening(lead, psychology, nicheConfig);
  const discovery = buildDiscovery(nicheConfig);
  const valueProposition = buildValueProp(psychology, nicheConfig);
  const objectionHandling = buildObjectionSection(psychology, nicheConfig);
  const close = buildClose(lead, nicheConfig);
  const followUp = buildFollowUp(lead);

  return {
    leadKey: lead.leadKey,
    opening,
    discovery,
    valueProposition,
    objectionHandling,
    close,
    followUp,
  };
}

function buildOpening(
  lead: LeadContext,
  psychology: PsychologyProfile,
  nicheConfig: NicheDefinition,
): CallScriptSection {
  const name = lead.name ?? "there";
  let content: string;

  if (psychology.identityType === "decision-maker") {
    content = `Hi ${name}, I appreciate you taking the time. I know you're busy running the show, so I'll be brief and data-driven. I noticed you've been exploring ${nicheConfig.label.toLowerCase()} growth solutions — I'd love to share some numbers that might be relevant to your situation.`;
  } else if (psychology.identityType === "researcher") {
    content = `Hi ${name}, thanks for connecting. I can see you've done some thorough research already. Rather than repeat what you've read, I'd like to fill in any gaps and share some details that aren't on our public pages.`;
  } else if (psychology.identityType === "budget-holder") {
    content = `Hi ${name}, thanks for your time. I want to respect your focus on ROI, so let me start with the financial impact our ${nicheConfig.label.toLowerCase()} clients typically see.`;
  } else {
    content = `Hi ${name}, thanks for connecting. I'm reaching out because I noticed your interest in our ${nicheConfig.label.toLowerCase()} solutions and wanted to see how we might be able to help.`;
  }

  return { label: "Opening", content };
}

function buildDiscovery(nicheConfig: NicheDefinition): CallScriptSection {
  const questions = [
    `What's your biggest challenge in your ${nicheConfig.label.toLowerCase()} operations right now?`,
    "How are you currently handling lead generation and follow-up?",
    "What would success look like for you in the next 90 days?",
    "Have you tried any other solutions? What worked and what didn't?",
    "Who else is involved in making this decision?",
  ];

  return {
    label: "Discovery Questions",
    content: questions.map((q, i) => `${i + 1}. ${q}`).join("\n"),
  };
}

function buildValueProp(
  psychology: PsychologyProfile,
  nicheConfig: NicheDefinition,
): CallScriptSection {
  const parts: string[] = [];

  if (psychology.desireTriggers.length > 0) {
    parts.push(`Based on what you've shared, it sounds like ${psychology.desireTriggers[0]} is a top priority for you.`);
    parts.push(`Our ${nicheConfig.label.toLowerCase()} solution is specifically designed to help you achieve that.`);
  } else {
    parts.push(`Our ${nicheConfig.label.toLowerCase()} solution helps businesses like yours streamline operations and grow faster.`);
  }

  parts.push(`On average, our ${nicheConfig.label.toLowerCase()} clients see a 3.2x ROI in the first 90 days.`);

  return { label: "Value Proposition", content: parts.join(" ") };
}

function buildObjectionSection(
  psychology: PsychologyProfile,
  nicheConfig: NicheDefinition,
): CallScriptSection {
  const handlers: string[] = [];

  for (const objection of psychology.objections.slice(0, 4)) {
    const response = generateDeepObjectionResponse(objection, nicheConfig.slug);
    handlers.push(`If they say: "${response.objection}"\nRespond: "${response.deepResponse}"\nReframe: "${response.reframe}"`);
  }

  if (handlers.length === 0) {
    handlers.push(
      'If they say: "I need to think about it"\nRespond: "Completely understand. What specific aspect would you like to think through? I may be able to provide clarity right now."',
      'If they say: "It\'s too expensive"\nRespond: "Let me show you what our clients save in the first 90 days — the ROI typically pays for itself 3x over."',
    );
  }

  return { label: "Objection Handling", content: handlers.join("\n\n") };
}

function buildClose(lead: LeadContext, nicheConfig: NicheDefinition): CallScriptSection {
  const temp = lead.scores.temperature;
  let content: string;

  if (temp === "burning" || temp === "hot") {
    content = `Based on everything we've discussed, I think we're a great fit. I have a few onboarding slots available this week — would [day] or [day] work better for you to get started?`;
  } else if (temp === "warm") {
    content = `I'd love to put together a custom proposal for your ${nicheConfig.label.toLowerCase()} business. Can I schedule a follow-up call to walk you through it?`;
  } else {
    content = `It sounds like you're still in the research phase, and that's completely fine. Can I send you our detailed ${nicheConfig.assessmentTitle} results along with some case studies that are relevant to your situation?`;
  }

  return { label: "Close", content };
}

function buildFollowUp(lead: LeadContext): CallScriptSection {
  const actions: string[] = [
    "Send personalized follow-up email within 1 hour",
    "Add notes to CRM with key objections and interests discussed",
  ];

  if (lead.scores.temperature === "hot" || lead.scores.temperature === "burning") {
    actions.push("Schedule follow-up call within 24 hours if no commitment");
    actions.push("Send calendar invite for onboarding session");
  } else {
    actions.push("Schedule nurture check-in in 3 business days");
    actions.push("Add to relevant drip sequence based on objections identified");
  }

  return {
    label: "Follow-up Actions",
    content: actions.map((a, i) => `${i + 1}. ${a}`).join("\n"),
  };
}

// ---------------------------------------------------------------------------
// Rep performance tracking
// ---------------------------------------------------------------------------

export function trackHumanPerformance(
  repId: string,
  outcomes: RepOutcome[],
): RepPerformance {
  const existing = outcomeStore.get(repId) ?? [];
  const all = [...existing, ...outcomes];
  outcomeStore.set(repId, all);

  const totalInteractions = all.length;
  const wins = all.filter((o) => o.result === "won").length;
  const losses = all.filter((o) => o.result === "lost").length;
  const closeRate = totalInteractions > 0 ? wins / totalInteractions : 0;

  const wonOutcomes = all.filter((o) => o.result === "won");
  const avgDealSize =
    wonOutcomes.length > 0
      ? wonOutcomes.reduce((sum, o) => sum + o.dealValue, 0) / wonOutcomes.length
      : 0;

  const avgResponseTimeMinutes =
    totalInteractions > 0
      ? all.reduce((sum, o) => sum + o.responseTimeMinutes, 0) / totalInteractions
      : 0;

  const closeRateByTemperature: Record<string, number> = {};
  const winRateByNiche: Record<string, number> = {};

  const performanceScore = calculatePerformanceScore(closeRate, avgDealSize, avgResponseTimeMinutes);
  const coachingRecommendations = generateCoachingRecs(closeRate, avgResponseTimeMinutes, avgDealSize);

  return {
    repId,
    totalInteractions,
    wins,
    losses,
    closeRate,
    avgDealSize,
    avgResponseTimeMinutes,
    closeRateByTemperature,
    winRateByNiche,
    performanceScore,
    coachingRecommendations,
  };
}

function calculatePerformanceScore(
  closeRate: number,
  avgDealSize: number,
  avgResponseTime: number,
): number {
  let score = 0;

  score += Math.min(closeRate * 100, 40);

  const dealSizeNormalized = Math.min(avgDealSize / 10000, 1);
  score += dealSizeNormalized * 30;

  const responseScore = avgResponseTime <= 5 ? 30 : avgResponseTime <= 15 ? 20 : avgResponseTime <= 60 ? 10 : 0;
  score += responseScore;

  return Math.round(score);
}

function generateCoachingRecs(
  closeRate: number,
  avgResponseTime: number,
  avgDealSize: number,
): string[] {
  const recs: string[] = [];

  if (closeRate < 0.2) {
    recs.push("Close rate below 20% — review call recordings for missed closing opportunities");
  }
  if (avgResponseTime > 30) {
    recs.push("Average response time exceeds 30 minutes — prioritize speed-to-lead for hot opportunities");
  }
  if (avgDealSize < 3000) {
    recs.push("Average deal size is low — focus on enterprise leads and upsell opportunities");
  }
  if (recs.length === 0) {
    recs.push("Strong performance — consider mentoring junior reps");
  }

  return recs;
}

// ---------------------------------------------------------------------------
// Allocation optimization
// ---------------------------------------------------------------------------

export function optimizeHumanAllocation(
  reps: RepProfile[],
  opportunities: HighValueOpportunity[],
): AllocationPlan {
  const assignments: AllocationAssignment[] = [];
  const unassigned: HighValueOpportunity[] = [];
  const repLoadTracker = new Map<string, number>();

  for (const rep of reps) {
    repLoadTracker.set(rep.repId, rep.currentLoad);
  }

  const sortedOpps = [...opportunities].sort((a, b) => {
    const scoreA = a.estimatedValue * (a.urgency / 100) * a.probability;
    const scoreB = b.estimatedValue * (b.urgency / 100) * b.probability;
    return scoreB - scoreA;
  });

  for (const opp of sortedOpps) {
    const bestRep = findBestRep(reps, opp, repLoadTracker);
    if (bestRep) {
      const matchScore = calculateMatchScore(bestRep, opp);
      assignments.push({
        repId: bestRep.repId,
        opportunity: opp,
        matchScore,
        reason: buildMatchReason(bestRep, opp),
      });
      repLoadTracker.set(bestRep.repId, (repLoadTracker.get(bestRep.repId) ?? 0) + 1);
    } else {
      unassigned.push(opp);
    }
  }

  return {
    assignments,
    unassigned,
    generatedAt: new Date().toISOString(),
  };
}

function findBestRep(
  reps: RepProfile[],
  opportunity: HighValueOpportunity,
  loadTracker: Map<string, number>,
): RepProfile | null {
  let bestRep: RepProfile | null = null;
  let bestScore = -1;

  for (const rep of reps) {
    const currentLoad = loadTracker.get(rep.repId) ?? rep.currentLoad;
    if (currentLoad >= rep.maxLoad) continue;

    const score = calculateMatchScore(rep, opportunity);
    if (score > bestScore) {
      bestScore = score;
      bestRep = rep;
    }
  }

  return bestRep;
}

function calculateMatchScore(rep: RepProfile, opportunity: HighValueOpportunity): number {
  let score = 0;

  const leadNiche = opportunity.leadSnapshot.niche;
  if (rep.niches.includes(leadNiche)) {
    score += 40;
  }

  score += rep.performanceScore * 0.4;

  const currentLoad = rep.currentLoad;
  const loadRatio = currentLoad / rep.maxLoad;
  score += (1 - loadRatio) * 20;

  return Math.round(score);
}

function buildMatchReason(rep: RepProfile, opportunity: HighValueOpportunity): string {
  const reasons: string[] = [];
  const leadNiche = opportunity.leadSnapshot.niche;

  if (rep.niches.includes(leadNiche)) {
    reasons.push(`expertise in ${leadNiche}`);
  }
  if (rep.performanceScore > 70) {
    reasons.push("top performer");
  }
  if (rep.currentLoad < rep.maxLoad * 0.5) {
    reasons.push("has capacity");
  }

  return reasons.length > 0 ? `Matched because: ${reasons.join(", ")}` : "Best available rep";
}
