import { randomUUID } from "crypto";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FormbricksConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface Question {
  id: string;
  type: "rating" | "text" | "multiChoice" | "nps" | "consent";
  text: string;
  required: boolean;
  options?: string[];
  scoreWeight?: number;
}

export interface SurveyConfig {
  name: string;
  type: "qualification" | "nps" | "feedback" | "custom";
  questions: Question[];
  targeting?: Record<string, unknown>;
  triggerRules?: Record<string, unknown>;
}

export interface Survey {
  id: string;
  tenantId: string;
  name: string;
  type: SurveyConfig["type"];
  questions: Question[];
  status: "draft" | "active" | "paused" | "closed";
  responseCount: number;
  completionRate: number;
  createdAt: string;
}

export interface Answer {
  questionId: string;
  value: string | number | boolean;
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  respondentId: string;
  answers: Answer[];
  completedAt: string;
  metadata: Record<string, unknown>;
}

export interface ResponseAnalytics {
  totalResponses: number;
  completionRate: number;
  averageCompletionTime: number;
  questionBreakdown: { questionId: string; questionText: string; responseDistribution: Record<string, number> }[];
}

export interface QualificationScore {
  score: number;
  tier: "hot" | "warm" | "cold";
  signals: string[];
  suggestedAction: string;
}

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

const surveyStore = new Map<string, Survey>();
const responseStore = new Map<string, SurveyResponse[]>();

export function resetFormbricksStore(): void {
  surveyStore.clear();
  responseStore.clear();
}

export function _getSurveyStoreForTesting(): Map<string, Survey> {
  return surveyStore;
}

export function _getResponseStoreForTesting(): Map<string, SurveyResponse[]> {
  return responseStore;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

function resolveConfig(config?: FormbricksConfig): FormbricksConfig {
  return {
    apiKey: config?.apiKey ?? process.env.FORMBRICKS_API_KEY ?? "",
    baseUrl: config?.baseUrl ?? process.env.FORMBRICKS_BASE_URL ?? "https://app.formbricks.com/api/v1",
  };
}

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------

export async function healthCheck(config?: FormbricksConfig): Promise<{ ok: boolean; message: string }> {
  const cfg = resolveConfig(config);
  if (!cfg.apiKey) {
    return { ok: false, message: "Formbricks API key not configured" };
  }

  try {
    const res = await fetch(`${cfg.baseUrl}/management/me`, {
      headers: { "x-api-key": cfg.apiKey },
    });
    return res.ok
      ? { ok: true, message: "Formbricks connection verified" }
      : { ok: false, message: `Formbricks returned ${res.status}` };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Connection failed" };
  }
}

// ---------------------------------------------------------------------------
// Survey CRUD
// ---------------------------------------------------------------------------

export async function createSurvey(tenantId: string, config: SurveyConfig): Promise<Survey> {
  const survey: Survey = {
    id: `survey-${randomUUID()}`,
    tenantId,
    name: config.name,
    type: config.type,
    questions: config.questions,
    status: "active",
    responseCount: 0,
    completionRate: 0,
    createdAt: new Date().toISOString(),
  };
  surveyStore.set(survey.id, survey);
  return survey;
}

export async function getSurvey(surveyId: string): Promise<Survey> {
  const survey = surveyStore.get(surveyId);
  if (!survey) throw new Error(`Survey not found: ${surveyId}`);
  return survey;
}

export async function updateSurvey(surveyId: string, updates: Partial<SurveyConfig>): Promise<Survey> {
  const survey = surveyStore.get(surveyId);
  if (!survey) throw new Error(`Survey not found: ${surveyId}`);

  const updated: Survey = {
    ...survey,
    ...updates,
  };
  surveyStore.set(surveyId, updated);
  return updated;
}

export async function deleteSurvey(surveyId: string): Promise<void> {
  if (!surveyStore.has(surveyId)) throw new Error(`Survey not found: ${surveyId}`);
  surveyStore.delete(surveyId);
  responseStore.delete(surveyId);
}

export async function listSurveys(tenantId: string): Promise<Survey[]> {
  return [...surveyStore.values()].filter((s) => s.tenantId === tenantId);
}

// ---------------------------------------------------------------------------
// Response handling
// ---------------------------------------------------------------------------

export async function submitResponse(
  surveyId: string,
  respondentId: string,
  answers: Answer[],
  metadata?: Record<string, unknown>,
): Promise<SurveyResponse> {
  const survey = surveyStore.get(surveyId);
  if (!survey) throw new Error(`Survey not found: ${surveyId}`);

  const response: SurveyResponse = {
    id: `resp-${randomUUID()}`,
    surveyId,
    respondentId,
    answers,
    completedAt: new Date().toISOString(),
    metadata: metadata ?? {},
  };

  const existing = responseStore.get(surveyId) ?? [];
  existing.push(response);
  responseStore.set(surveyId, existing);

  survey.responseCount = existing.length;
  const answeredAll = answers.length >= survey.questions.filter((q) => q.required).length;
  const totalResponses = existing.length;
  const completedResponses = existing.filter((r) => r.answers.length >= survey.questions.filter((q) => q.required).length).length;
  survey.completionRate = totalResponses > 0 ? Math.round((completedResponses / totalResponses) * 100) : 0;

  surveyStore.set(surveyId, survey);
  return response;
}

export async function getResponses(surveyId: string): Promise<SurveyResponse[]> {
  const survey = surveyStore.get(surveyId);
  if (!survey) throw new Error(`Survey not found: ${surveyId}`);
  return responseStore.get(surveyId) ?? [];
}

export async function getResponseAnalytics(surveyId: string): Promise<ResponseAnalytics> {
  const survey = surveyStore.get(surveyId);
  if (!survey) throw new Error(`Survey not found: ${surveyId}`);

  const responses = responseStore.get(surveyId) ?? [];
  const totalResponses = responses.length;

  const requiredCount = survey.questions.filter((q) => q.required).length;
  const completedCount = responses.filter((r) => r.answers.length >= requiredCount).length;
  const completionRate = totalResponses > 0 ? Math.round((completedCount / totalResponses) * 100) : 0;

  const questionBreakdown = survey.questions.map((q) => {
    const distribution: Record<string, number> = {};
    for (const resp of responses) {
      const answer = resp.answers.find((a) => a.questionId === q.id);
      if (answer) {
        const key = String(answer.value);
        distribution[key] = (distribution[key] ?? 0) + 1;
      }
    }
    return {
      questionId: q.id,
      questionText: q.text,
      responseDistribution: distribution,
    };
  });

  return {
    totalResponses,
    completionRate,
    averageCompletionTime: totalResponses > 0 ? 45 : 0,
    questionBreakdown,
  };
}

// ---------------------------------------------------------------------------
// Lead qualification surveys (pre-built)
// ---------------------------------------------------------------------------

const NICHE_QUESTIONS: Record<string, Question[]> = {
  default: [
    { id: "q-budget", type: "multiChoice", text: "What is your monthly marketing budget?", required: true, options: ["Under $1k", "$1k-$5k", "$5k-$20k", "Over $20k"], scoreWeight: 30 },
    { id: "q-timeline", type: "multiChoice", text: "When are you looking to get started?", required: true, options: ["Immediately", "Within 30 days", "1-3 months", "Just exploring"], scoreWeight: 25 },
    { id: "q-decision", type: "multiChoice", text: "Are you the decision maker?", required: true, options: ["Yes", "Part of a team", "I need approval", "Researching for someone else"], scoreWeight: 20 },
    { id: "q-pain", type: "text", text: "What is your biggest challenge right now?", required: true, scoreWeight: 15 },
    { id: "q-size", type: "multiChoice", text: "How large is your team?", required: false, options: ["Solo", "2-10", "11-50", "50+"], scoreWeight: 10 },
  ],
};

export async function createQualificationSurvey(tenantId: string, niche: string): Promise<Survey> {
  const questions = NICHE_QUESTIONS[niche] ?? NICHE_QUESTIONS.default;

  return createSurvey(tenantId, {
    name: `Lead Qualification — ${niche}`,
    type: "qualification",
    questions: questions!,
  });
}

export async function createNPSSurvey(tenantId: string): Promise<Survey> {
  return createSurvey(tenantId, {
    name: "Net Promoter Score",
    type: "nps",
    questions: [
      { id: "q-nps", type: "nps", text: "How likely are you to recommend us to a friend or colleague?", required: true, scoreWeight: 100 },
      { id: "q-nps-reason", type: "text", text: "What is the primary reason for your score?", required: false },
    ],
  });
}

export async function createFeedbackSurvey(tenantId: string): Promise<Survey> {
  return createSurvey(tenantId, {
    name: "Customer Feedback",
    type: "feedback",
    questions: [
      { id: "q-satisfaction", type: "rating", text: "How satisfied are you with our service?", required: true, scoreWeight: 40 },
      { id: "q-improvement", type: "text", text: "What could we improve?", required: false },
      { id: "q-feature", type: "multiChoice", text: "Which feature do you value most?", required: true, options: ["Speed", "Ease of use", "Customer support", "Pricing", "Features"], scoreWeight: 30 },
      { id: "q-recommend", type: "consent", text: "Would you be willing to participate in a case study?", required: false },
    ],
  });
}

// ---------------------------------------------------------------------------
// Lead scoring
// ---------------------------------------------------------------------------

export async function scoreResponseForLeadQualification(response: SurveyResponse): Promise<QualificationScore> {
  let score = 0;
  const signals: string[] = [];

  for (const answer of response.answers) {
    const value = String(answer.value);

    if (answer.questionId === "q-budget") {
      if (value === "Over $20k") { score += 30; signals.push("High budget"); }
      else if (value === "$5k-$20k") { score += 22; signals.push("Medium-high budget"); }
      else if (value === "$1k-$5k") { score += 15; signals.push("Medium budget"); }
      else { score += 5; signals.push("Low budget"); }
    }

    if (answer.questionId === "q-timeline") {
      if (value === "Immediately") { score += 25; signals.push("Immediate need"); }
      else if (value === "Within 30 days") { score += 18; signals.push("Short-term need"); }
      else if (value === "1-3 months") { score += 10; signals.push("Medium-term need"); }
      else { score += 3; signals.push("Exploring"); }
    }

    if (answer.questionId === "q-decision") {
      if (value === "Yes") { score += 20; signals.push("Decision maker"); }
      else if (value === "Part of a team") { score += 14; signals.push("Shared decision"); }
      else if (value === "I need approval") { score += 8; signals.push("Needs approval"); }
      else { score += 2; signals.push("Researcher"); }
    }

    if (answer.questionId === "q-pain" && value.length > 20) {
      score += 15;
      signals.push("Detailed pain point");
    } else if (answer.questionId === "q-pain") {
      score += 5;
      signals.push("Brief pain point");
    }

    if (answer.questionId === "q-size") {
      if (value === "50+") { score += 10; signals.push("Large team"); }
      else if (value === "11-50") { score += 8; signals.push("Medium team"); }
      else if (value === "2-10") { score += 5; signals.push("Small team"); }
      else { score += 2; signals.push("Solo operator"); }
    }
  }

  const cappedScore = Math.min(score, 100);

  let tier: QualificationScore["tier"];
  let suggestedAction: string;

  if (cappedScore >= 70) {
    tier = "hot";
    suggestedAction = "Route to sales immediately — high intent and authority";
  } else if (cappedScore >= 40) {
    tier = "warm";
    suggestedAction = "Add to nurture sequence with personalized follow-up";
  } else {
    tier = "cold";
    suggestedAction = "Add to general newsletter and long-term nurture";
  }

  return { score: cappedScore, tier, signals, suggestedAction };
}
