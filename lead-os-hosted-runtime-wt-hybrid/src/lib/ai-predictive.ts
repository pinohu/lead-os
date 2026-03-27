import { callLLM, isAIEnabled, type LLMMessage } from "./ai-client.ts";
import type { StoredLeadRecord } from "./runtime-store.ts";
import type { CanonicalEvent } from "./trace.ts";

export interface PredictionResult {
  leadKey: string;
  conversionProbability: number;
  estimatedTimeToConvert: number;
  riskOfChurn: number;
  recommendedTouchpoints: string[];
  similarConverted: number;
  confidence: number;
}

export interface AtRiskLead {
  leadKey: string;
  risk: number;
  reason: string;
}

export interface NextBestAction {
  action: string;
  channel: string;
  urgency: string;
  reasoning: string;
}

function buildRuleBasedPrediction(lead: StoredLeadRecord): PredictionResult {
  let conversionProbability = 0.2;
  let estimatedDays = 30;

  if (lead.hot) { conversionProbability += 0.3; estimatedDays -= 15; }
  if (lead.email) { conversionProbability += 0.1; estimatedDays -= 3; }
  if (lead.phone) { conversionProbability += 0.1; estimatedDays -= 3; }
  if (lead.score >= 80) { conversionProbability += 0.2; estimatedDays -= 10; }
  else if (lead.score >= 60) { conversionProbability += 0.1; estimatedDays -= 5; }

  const source = lead.source.toLowerCase();
  if (source === "referral") { conversionProbability += 0.1; estimatedDays -= 5; }

  conversionProbability = Math.max(0.05, Math.min(0.95, conversionProbability));
  estimatedDays = Math.max(1, estimatedDays);

  const touchpoints: string[] = [];
  if (lead.email) touchpoints.push("personalized email follow-up");
  if (lead.phone) touchpoints.push("phone call");
  if (lead.score >= 60) touchpoints.push("schedule demo");
  else touchpoints.push("send case study");
  touchpoints.push("nurture sequence enrollment");

  return {
    leadKey: lead.leadKey,
    conversionProbability,
    estimatedTimeToConvert: estimatedDays,
    riskOfChurn: 1 - conversionProbability,
    recommendedTouchpoints: touchpoints,
    similarConverted: Math.floor(conversionProbability * 100),
    confidence: 0.4,
  };
}

export async function predictConversion(
  leadKey: string,
  lead: StoredLeadRecord,
  historicalLeads: StoredLeadRecord[],
): Promise<PredictionResult> {
  if (!isAIEnabled()) {
    return buildRuleBasedPrediction(lead);
  }

  const leadSummary = summarizeLead(lead);
  const historicalSummary = summarizeHistoricalLeads(historicalLeads, lead);

  const messages: LLMMessage[] = [
    {
      role: "system",
      content: `You are a predictive analytics expert. Analyze this lead against historical patterns to predict conversion likelihood.

Return ONLY a JSON object:
- conversionProbability: number 0-1
- estimatedTimeToConvert: number (days)
- riskOfChurn: number 0-1
- recommendedTouchpoints: array of 3-5 specific actions
- similarConverted: estimated count of similar leads that converted
- confidence: number 0-1

Respond with ONLY the JSON object.`,
    },
    {
      role: "user",
      content: `Current Lead:\n${leadSummary}\n\nHistorical Pattern Summary:\n${historicalSummary}`,
    },
  ];

  try {
    const result = await callLLM(messages, { maxTokens: 512, temperature: 0.3 });
    if (result.model === "dry-run") return buildRuleBasedPrediction(lead);

    const parsed = JSON.parse(result.content) as Record<string, unknown>;
    return {
      leadKey,
      conversionProbability: clampNumber(parsed.conversionProbability, 0, 1),
      estimatedTimeToConvert: Math.max(1, clampNumber(parsed.estimatedTimeToConvert, 1, 365)),
      riskOfChurn: clampNumber(parsed.riskOfChurn, 0, 1),
      recommendedTouchpoints: validateStringArray(parsed.recommendedTouchpoints),
      similarConverted: Math.max(0, Math.floor(clampNumber(parsed.similarConverted, 0, 10000))),
      confidence: clampNumber(parsed.confidence, 0, 1),
    };
  } catch {
    return buildRuleBasedPrediction(lead);
  }
}

export async function identifyAtRiskLeads(
  leads: StoredLeadRecord[],
  events: CanonicalEvent[],
): Promise<AtRiskLead[]> {
  const now = Date.now();
  const atRisk: AtRiskLead[] = [];

  for (const lead of leads) {
    const leadEvents = events.filter((e) => e.leadKey === lead.leadKey);
    const lastActivity = getLastActivityTime(lead, leadEvents);
    const daysSinceActivity = (now - lastActivity) / (1000 * 60 * 60 * 24);

    let risk = 0;
    let reason = "";

    if (daysSinceActivity > 30) {
      risk = 0.9;
      reason = `No activity for ${Math.floor(daysSinceActivity)} days`;
    } else if (daysSinceActivity > 14) {
      risk = 0.7;
      reason = `Engagement dropped off ${Math.floor(daysSinceActivity)} days ago`;
    } else if (daysSinceActivity > 7) {
      risk = 0.5;
      reason = `No recent engagement in ${Math.floor(daysSinceActivity)} days`;
    }

    if (lead.score < 30 && lead.milestones.visitCount <= 1) {
      risk = Math.max(risk, 0.6);
      reason = reason || "Low score with minimal engagement";
    }

    const nurtureProgress = lead.sentNurtureStages.length;
    if (nurtureProgress >= 3 && lead.score < 40) {
      risk = Math.max(risk, 0.65);
      reason = reason || "Multiple nurture stages sent without score improvement";
    }

    if (risk > 0.4) {
      atRisk.push({ leadKey: lead.leadKey, risk: Math.min(risk, 1), reason });
    }
  }

  if (isAIEnabled() && atRisk.length > 0) {
    return refineAtRiskWithAI(atRisk, leads);
  }

  return atRisk.sort((a, b) => b.risk - a.risk);
}

export async function suggestNextBestAction(
  leadKey: string,
  lead: StoredLeadRecord,
  events: CanonicalEvent[],
): Promise<NextBestAction> {
  const leadEvents = events.filter((e) => e.leadKey === leadKey);
  const lastActivity = getLastActivityTime(lead, leadEvents);
  const daysSinceActivity = (Date.now() - lastActivity) / (1000 * 60 * 60 * 24);

  if (!isAIEnabled()) {
    return buildRuleBasedAction(lead, daysSinceActivity);
  }

  const leadSummary = summarizeLead(lead);
  const eventSummary = leadEvents
    .slice(-10)
    .map((e) => `${e.eventType} via ${e.channel} at ${e.timestamp}`)
    .join("\n");

  const messages: LLMMessage[] = [
    {
      role: "system",
      content: `You are a sales strategy advisor. Based on the lead profile and recent events, suggest the single best next action.

Return ONLY a JSON object:
- action: specific action to take (string)
- channel: best channel ("email" | "phone" | "sms" | "whatsapp" | "in-app")
- urgency: "low" | "medium" | "high" | "critical"
- reasoning: brief explanation (string)

Respond with ONLY the JSON object.`,
    },
    {
      role: "user",
      content: `Lead Profile:\n${leadSummary}\n\nDays since last activity: ${Math.floor(daysSinceActivity)}\n\nRecent Events:\n${eventSummary || "No recent events"}`,
    },
  ];

  try {
    const result = await callLLM(messages, { maxTokens: 256, temperature: 0.4 });
    if (result.model === "dry-run") return buildRuleBasedAction(lead, daysSinceActivity);

    const parsed = JSON.parse(result.content) as Record<string, unknown>;
    return {
      action: typeof parsed.action === "string" ? parsed.action : "Follow up with personalized content",
      channel: validateChannel(parsed.channel),
      urgency: validateUrgency(parsed.urgency),
      reasoning: typeof parsed.reasoning === "string" ? parsed.reasoning : "AI analysis completed",
    };
  } catch {
    return buildRuleBasedAction(lead, daysSinceActivity);
  }
}

function buildRuleBasedAction(lead: StoredLeadRecord, daysSinceActivity: number): NextBestAction {
  if (lead.hot || lead.score >= 80) {
    return {
      action: "Immediate personal outreach with a tailored proposal",
      channel: lead.phone ? "phone" : "email",
      urgency: "critical",
      reasoning: `Lead score is ${lead.score} and marked as ${lead.hot ? "hot" : "high-scoring"}`,
    };
  }

  if (lead.score >= 60) {
    return {
      action: "Send personalized case study and schedule follow-up call",
      channel: "email",
      urgency: "high",
      reasoning: `Strong lead score (${lead.score}) indicates active evaluation`,
    };
  }

  if (daysSinceActivity > 14) {
    return {
      action: "Send re-engagement email with new value proposition",
      channel: "email",
      urgency: "medium",
      reasoning: `Lead has been inactive for ${Math.floor(daysSinceActivity)} days`,
    };
  }

  if (lead.score >= 35) {
    return {
      action: "Continue nurture sequence with targeted content",
      channel: "email",
      urgency: "medium",
      reasoning: `Moderate engagement (score ${lead.score}) warrants continued nurturing`,
    };
  }

  return {
    action: "Add to awareness drip campaign and monitor engagement",
    channel: "email",
    urgency: "low",
    reasoning: `Low engagement (score ${lead.score}), maintain light touch`,
  };
}

function getLastActivityTime(lead: StoredLeadRecord, events: CanonicalEvent[]): number {
  const updatedAt = new Date(lead.updatedAt).getTime();
  const lastEventTime = events.length > 0
    ? Math.max(...events.map((e) => new Date(e.timestamp).getTime()))
    : 0;
  return Math.max(updatedAt, lastEventTime);
}

function summarizeLead(lead: StoredLeadRecord): string {
  const parts: string[] = [
    `Key: ${lead.leadKey}`,
    `Score: ${lead.score}`,
    `Stage: ${lead.stage}`,
    `Source: ${lead.source}`,
    `Niche: ${lead.niche}`,
    `Hot: ${lead.hot}`,
    `Family: ${lead.family}`,
  ];

  if (lead.email) parts.push(`Email: [captured]`);
  if (lead.phone) parts.push(`Phone: [captured]`);
  if (lead.company) parts.push(`Company: ${lead.company}`);
  parts.push(`Milestones: visit=${lead.milestones.visitCount}, lead=${lead.milestones.leadMilestones.length}, customer=${lead.milestones.customerMilestones.length}`);
  parts.push(`Nurture stages sent: ${lead.sentNurtureStages.length}`);
  parts.push(`Created: ${lead.createdAt}`);
  parts.push(`Updated: ${lead.updatedAt}`);

  return parts.join("\n");
}

function summarizeHistoricalLeads(leads: StoredLeadRecord[], currentLead: StoredLeadRecord): string {
  const similarLeads = leads.filter((l) =>
    l.leadKey !== currentLead.leadKey &&
    (l.niche === currentLead.niche || l.source === currentLead.source),
  );

  if (similarLeads.length === 0) {
    return "No similar historical leads found.";
  }

  const converted = similarLeads.filter((l) => l.stage === "converted" || l.milestones.customerMilestones.length > 0);
  const avgScore = similarLeads.reduce((sum, l) => sum + l.score, 0) / similarLeads.length;
  const hotCount = similarLeads.filter((l) => l.hot).length;

  return [
    `Similar leads: ${similarLeads.length}`,
    `Converted: ${converted.length} (${Math.round((converted.length / similarLeads.length) * 100)}%)`,
    `Average score: ${Math.round(avgScore)}`,
    `Hot leads: ${hotCount}`,
  ].join("\n");
}

async function refineAtRiskWithAI(
  atRisk: AtRiskLead[],
  leads: StoredLeadRecord[],
): Promise<AtRiskLead[]> {
  const summaries = atRisk.slice(0, 10).map((ar) => {
    const lead = leads.find((l) => l.leadKey === ar.leadKey);
    return `${ar.leadKey}: risk=${ar.risk}, reason="${ar.reason}", score=${lead?.score ?? 0}, hot=${lead?.hot ?? false}`;
  });

  const messages: LLMMessage[] = [
    {
      role: "system",
      content: `Review these at-risk leads and refine the risk assessment. Return ONLY a JSON array of objects with leadKey, risk (0-1), and reason (string). Keep the same leads, just refine the scores and reasons.`,
    },
    {
      role: "user",
      content: summaries.join("\n"),
    },
  ];

  try {
    const result = await callLLM(messages, { maxTokens: 512, temperature: 0.3 });
    if (result.model === "dry-run") return atRisk.sort((a, b) => b.risk - a.risk);

    const parsed = JSON.parse(result.content) as unknown[];
    if (!Array.isArray(parsed)) return atRisk.sort((a, b) => b.risk - a.risk);

    return parsed
      .map((item) => {
        const r = item as Record<string, unknown>;
        return {
          leadKey: typeof r.leadKey === "string" ? r.leadKey : "",
          risk: clampNumber(r.risk, 0, 1),
          reason: typeof r.reason === "string" ? r.reason : "AI-refined risk assessment",
        };
      })
      .filter((r) => r.leadKey.length > 0)
      .sort((a, b) => b.risk - a.risk);
  } catch {
    return atRisk.sort((a, b) => b.risk - a.risk);
  }
}

function clampNumber(value: unknown, min: number, max: number): number {
  if (typeof value !== "number" || !isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function validateStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return ["Follow up with personalized content"];
  const filtered = value.filter((item): item is string => typeof item === "string");
  return filtered.length > 0 ? filtered : ["Follow up with personalized content"];
}

function validateChannel(value: unknown): string {
  const allowed = ["email", "phone", "sms", "whatsapp", "in-app"];
  return typeof value === "string" && allowed.includes(value) ? value : "email";
}

function validateUrgency(value: unknown): string {
  const allowed = ["low", "medium", "high", "critical"];
  return typeof value === "string" && allowed.includes(value) ? value : "medium";
}
