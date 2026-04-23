import { callLLM, isAIEnabled, type LLMMessage } from "./ai-client.ts";
import type { ChatMessage } from "./ai-chat-agent.ts";

export interface AIScoreResult {
  qualityScore: number;
  buyerPersona: string;
  purchaseReadiness: string;
  estimatedDealSize: string;
  keyInsights: string[];
  recommendedAction: string;
  confidence: number;
}

export interface IntentClassification {
  intent: string;
  confidence: number;
}

export interface ObjectionDetection {
  objections: string[];
  responses: string[];
}

const DEFAULT_SCORE_RESULT: AIScoreResult = {
  qualityScore: 50,
  buyerPersona: "unknown",
  purchaseReadiness: "exploring",
  estimatedDealSize: "medium",
  keyInsights: ["Insufficient data for AI analysis"],
  recommendedAction: "Continue nurturing with targeted content",
  confidence: 0.3,
};

function buildScoreFromRules(leadData: Record<string, unknown>): AIScoreResult {
  let score = 30;
  const insights: string[] = [];

  if (leadData.email) { score += 10; insights.push("Email captured"); }
  if (leadData.phone) { score += 10; insights.push("Phone number available"); }
  if (leadData.company) { score += 8; insights.push("Company identified"); }
  if (leadData.budget) { score += 10; insights.push("Budget discussed"); }

  const stage = String(leadData.stage ?? "").toLowerCase();
  if (stage === "hot" || leadData.hot === true) { score += 15; insights.push("Lead marked as hot"); }

  const source = String(leadData.source ?? "").toLowerCase();
  if (source === "referral") { score += 10; insights.push("Referral source - higher conversion likelihood"); }
  else if (source === "paid") { score += 5; insights.push("Paid acquisition channel"); }

  score = Math.min(score, 100);

  let readiness = "exploring";
  if (score >= 80) readiness = "ready-to-buy";
  else if (score >= 60) readiness = "evaluating";
  else if (score >= 40) readiness = "exploring";
  else readiness = "not-ready";

  let persona = "unknown";
  const metadata = leadData.metadata as Record<string, unknown> | undefined;
  const role = String(leadData.role ?? metadata?.role ?? "").toLowerCase();
  if (["owner", "ceo", "founder", "president"].includes(role)) persona = "decision-maker";
  else if (["manager", "director", "vp"].includes(role)) persona = "decision-maker";
  else if (["analyst", "researcher"].includes(role)) persona = "researcher";
  else if (["developer", "engineer", "implementer"].includes(role)) persona = "implementer";

  let dealSize = "medium";
  const companySize = String(leadData.companySize ?? "").toLowerCase();
  if (companySize === "enterprise" || companySize === "1000+") dealSize = "enterprise";
  else if (companySize === "mid-market" || companySize === "201-1000") dealSize = "large";
  else if (companySize === "solo" || companySize === "1-10") dealSize = "small";

  let action = "Continue nurturing with targeted content";
  if (score >= 80) action = "Schedule demo or strategy call immediately";
  else if (score >= 60) action = "Send case study and follow up within 24 hours";
  else if (score >= 40) action = "Enroll in nurture sequence with relevant content";

  return {
    qualityScore: score,
    buyerPersona: persona,
    purchaseReadiness: readiness,
    estimatedDealSize: dealSize,
    keyInsights: insights.length > 0 ? insights : ["Lead data collected, monitoring for engagement signals"],
    recommendedAction: action,
    confidence: 0.5,
  };
}

export async function aiScoreLead(
  leadData: Record<string, unknown>,
  chatHistory?: ChatMessage[],
): Promise<AIScoreResult> {
  if (!isAIEnabled()) {
    return buildScoreFromRules(leadData);
  }

  const leadSummary = Object.entries(leadData)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
    .join("\n");

  const chatContext = chatHistory
    ? chatHistory
        .filter((m) => m.role !== "system")
        .map((m) => `${m.role}: ${m.content}`)
        .join("\n")
    : "";

  const messages: LLMMessage[] = [
    {
      role: "system",
      content: `You are a lead scoring analyst. Analyze the following lead data and conversation history to produce a quality assessment. Return ONLY a JSON object with these exact fields:
- qualityScore: number 0-100
- buyerPersona: "decision-maker" | "researcher" | "implementer" | "influencer" | "unknown"
- purchaseReadiness: "not-ready" | "exploring" | "evaluating" | "ready-to-buy"
- estimatedDealSize: "small" | "medium" | "large" | "enterprise"
- keyInsights: array of 2-5 short insight strings
- recommendedAction: one specific actionable recommendation
- confidence: number 0-1

Respond with ONLY the JSON object.`,
    },
    {
      role: "user",
      content: `Lead Data:\n${leadSummary}${chatContext ? `\n\nChat History:\n${chatContext}` : ""}`,
    },
  ];

  try {
    const result = await callLLM(messages, { maxTokens: 512, temperature: 0.3 });
    if (result.model === "dry-run") return buildScoreFromRules(leadData);

    const parsed = JSON.parse(result.content) as Record<string, unknown>;
    return {
      qualityScore: clampNumber(parsed.qualityScore, 0, 100),
      buyerPersona: validateString(parsed.buyerPersona, "unknown"),
      purchaseReadiness: validateString(parsed.purchaseReadiness, "exploring"),
      estimatedDealSize: validateString(parsed.estimatedDealSize, "medium"),
      keyInsights: validateStringArray(parsed.keyInsights, ["AI analysis completed"]),
      recommendedAction: validateString(parsed.recommendedAction, "Follow up with personalized content"),
      confidence: clampNumber(parsed.confidence, 0, 1),
    };
  } catch {
    return buildScoreFromRules(leadData);
  }
}

export async function aiClassifyIntent(
  messagesToClassify: string[],
): Promise<IntentClassification> {
  if (!isAIEnabled() || messagesToClassify.length === 0) {
    return { intent: "browsing", confidence: 0.3 };
  }

  const messages: LLMMessage[] = [
    {
      role: "system",
      content: `Classify the user's intent from their messages. Return ONLY a JSON object:
- intent: one of "browsing", "researching", "comparing", "evaluating", "ready-to-buy", "support", "complaint"
- confidence: number 0-1

Respond with ONLY the JSON object.`,
    },
    {
      role: "user",
      content: messagesToClassify.join("\n"),
    },
  ];

  try {
    const result = await callLLM(messages, { maxTokens: 128, temperature: 0.2 });
    if (result.model === "dry-run") return { intent: "browsing", confidence: 0.3 };

    const parsed = JSON.parse(result.content) as Record<string, unknown>;
    return {
      intent: validateString(parsed.intent, "browsing"),
      confidence: clampNumber(parsed.confidence, 0, 1),
    };
  } catch {
    return { intent: "browsing", confidence: 0.3 };
  }
}

export async function aiDetectObjections(
  messagesToAnalyze: string[],
): Promise<ObjectionDetection> {
  if (!isAIEnabled() || messagesToAnalyze.length === 0) {
    return { objections: [], responses: [] };
  }

  const messages: LLMMessage[] = [
    {
      role: "system",
      content: `Detect sales objections in the user's messages and suggest empathetic responses. Return ONLY a JSON object:
- objections: array of objection strings (max 5)
- responses: array of suggested response strings (one per objection)

Respond with ONLY the JSON object.`,
    },
    {
      role: "user",
      content: messagesToAnalyze.join("\n"),
    },
  ];

  try {
    const result = await callLLM(messages, { maxTokens: 512, temperature: 0.4 });
    if (result.model === "dry-run") return { objections: [], responses: [] };

    const parsed = JSON.parse(result.content) as Record<string, unknown>;
    return {
      objections: validateStringArray(parsed.objections, []),
      responses: validateStringArray(parsed.responses, []),
    };
  } catch {
    return { objections: [], responses: [] };
  }
}

function clampNumber(value: unknown, min: number, max: number): number {
  if (typeof value !== "number" || !isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function validateString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function validateStringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  return value.filter((item): item is string => typeof item === "string");
}
