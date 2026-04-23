import { getPool } from "./db.ts";
import { callLLM, isAIEnabled } from "./ai-client.ts";
import { getTopPerformers, getContentPatterns } from "./content-memory.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ContentExperimentResult {
  id: string;
  tenantId: string;
  contentType: "headline" | "cta" | "email-subject" | "ad-copy" | "landing-page" | "lead-magnet-title";
  variantA: string;
  variantB: string;
  winnerVariant: "A" | "B" | "inconclusive";
  liftPercent: number;
  confidence: number;
  sampleSize: number;
  testedAt: string;
}

export interface ContentLearning {
  tenantId: string;
  niche: string;
  learnings: {
    winningPatterns: string[];
    losingPatterns: string[];
    bestPerformingHooks: string[];
    bestPerformingAngles: string[];
    optimalContentLength: { type: string; words: number }[];
    channelPreferences: { channel: string; performance: number }[];
  };
  updatedAt: string;
}

export interface ContentSuggestion {
  type: string;
  suggestion: string;
  basedOn: string;
  expectedLift: number;
  confidence: "high" | "medium" | "low";
}

export interface CopilotResponse {
  suggestions: ContentSuggestion[];
  insights: string[];
  aiGenerated: boolean;
  tokenUsage: { input: number; output: number };
}

// ---------------------------------------------------------------------------
// Pattern detection helpers
// ---------------------------------------------------------------------------

const WINNING_PATTERN_DETECTORS: Array<{
  name: string;
  test: (text: string) => boolean;
  description: (lift: number) => string;
}> = [
  {
    name: "question",
    test: (t) => t.includes("?"),
    description: (lift) => `Questions in headlines convert ${lift}% better`,
  },
  {
    name: "number",
    test: (t) => /\b\d+\b/.test(t),
    description: (lift) => `Headlines with numbers convert ${lift}% better`,
  },
  {
    name: "urgency",
    test: (t) => /\b(now|today|limited|urgent|fast|quick|instantly|immediately)\b/i.test(t),
    description: (lift) => `Urgency words improve conversions by ${lift}%`,
  },
  {
    name: "benefit",
    test: (t) => /\b(get|gain|save|earn|grow|boost|increase|improve|discover|unlock)\b/i.test(t),
    description: (lift) => `Benefit-led copy outperforms by ${lift}%`,
  },
  {
    name: "social-proof",
    test: (t) => /\b(proven|trusted|results|success|customers|clients|people|others)\b/i.test(t),
    description: (lift) => `Social proof language lifts conversions ${lift}%`,
  },
];

const LOSING_PATTERN_DETECTORS: Array<{
  name: string;
  test: (text: string) => boolean;
  description: (drop: number) => string;
}> = [
  {
    name: "generic-cta",
    test: (t) => /^(click here|learn more|submit|read more|find out)$/i.test(t.trim()),
    description: (drop) => `Generic CTAs underperform by ${drop}%`,
  },
  {
    name: "passive-voice",
    test: (t) => /\b(is being|was made|has been|will be processed)\b/i.test(t),
    description: (drop) => `Passive voice reduces engagement by ${drop}%`,
  },
  {
    name: "vague",
    test: (t) => /\b(things|stuff|something|various|several|some)\b/i.test(t),
    description: (drop) => `Vague language drops CTR by ${drop}%`,
  },
];

// ---------------------------------------------------------------------------
// In-memory stores
// ---------------------------------------------------------------------------

const experimentStore = new Map<string, ContentExperimentResult>();
const learningStore = new Map<string, ContentLearning>();

// ---------------------------------------------------------------------------
// ID generation
// ---------------------------------------------------------------------------

function generateId(): string {
  return `exp-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// ---------------------------------------------------------------------------
// Persistence helpers
// ---------------------------------------------------------------------------

async function persistExperiment(result: ContentExperimentResult): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  try {
    await pool.query(
      `INSERT INTO lead_os_content_experiments (id, tenant_id, payload, created_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload`,
      [result.id, result.tenantId, JSON.stringify(result), result.testedAt],
    );
  } catch {
    // silent — memory-only fallback
  }
}

async function persistLearning(learning: ContentLearning): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  try {
    await pool.query(
      `INSERT INTO lead_os_content_learnings (tenant_id, payload, updated_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (tenant_id) DO UPDATE SET payload = EXCLUDED.payload, updated_at = EXCLUDED.updated_at`,
      [learning.tenantId, JSON.stringify(learning), learning.updatedAt],
    );
  } catch {
    // silent — memory-only fallback
  }
}

// ---------------------------------------------------------------------------
// recordExperimentResult
// ---------------------------------------------------------------------------

export async function recordExperimentResult(
  result: Omit<ContentExperimentResult, "id">,
): Promise<ContentExperimentResult> {
  const record: ContentExperimentResult = {
    ...result,
    id: generateId(),
  };
  experimentStore.set(record.id, record);
  await persistExperiment(record);
  return record;
}

// ---------------------------------------------------------------------------
// getExperimentHistory
// ---------------------------------------------------------------------------

export async function getExperimentHistory(
  tenantId: string,
  contentType?: string,
): Promise<ContentExperimentResult[]> {
  const all = [...experimentStore.values()].filter((e) => e.tenantId === tenantId);
  if (!contentType) return all;
  return all.filter((e) => e.contentType === contentType);
}

// ---------------------------------------------------------------------------
// synthesizeLearnings
// ---------------------------------------------------------------------------

export async function synthesizeLearnings(
  tenantId: string,
  niche: string,
): Promise<ContentLearning> {
  const experiments = await getExperimentHistory(tenantId);

  // Tally pattern wins and losses across experiments
  const patternWins = new Map<string, { count: number; totalLift: number }>();
  const patternLosses = new Map<string, { count: number; totalDrop: number }>();

  for (const exp of experiments) {
    if (exp.winnerVariant === "inconclusive") continue;

    const winnerText = exp.winnerVariant === "A" ? exp.variantA : exp.variantB;
    const loserText = exp.winnerVariant === "A" ? exp.variantB : exp.variantA;

    for (const detector of WINNING_PATTERN_DETECTORS) {
      if (detector.test(winnerText)) {
        const existing = patternWins.get(detector.name) ?? { count: 0, totalLift: 0 };
        patternWins.set(detector.name, {
          count: existing.count + 1,
          totalLift: existing.totalLift + exp.liftPercent,
        });
      }
    }

    for (const detector of LOSING_PATTERN_DETECTORS) {
      if (detector.test(loserText)) {
        const existing = patternLosses.get(detector.name) ?? { count: 0, totalDrop: 0 };
        patternLosses.set(detector.name, {
          count: existing.count + 1,
          totalDrop: existing.totalDrop + exp.liftPercent,
        });
      }
    }
  }

  // Build winning pattern strings
  const winningPatterns: string[] = [];
  for (const detector of WINNING_PATTERN_DETECTORS) {
    const stats = patternWins.get(detector.name);
    if (stats && stats.count > 0) {
      const avgLift = Math.round(stats.totalLift / stats.count);
      winningPatterns.push(detector.description(avgLift));
    }
  }

  // Build losing pattern strings
  const losingPatterns: string[] = [];
  for (const detector of LOSING_PATTERN_DETECTORS) {
    const stats = patternLosses.get(detector.name);
    if (stats && stats.count > 0) {
      const avgDrop = Math.round(stats.totalDrop / stats.count);
      losingPatterns.push(detector.description(avgDrop));
    }
  }

  // Pull top hooks and angles from content-memory
  const topPerformers = getTopPerformers(tenantId, 10);
  const patterns = getContentPatterns(tenantId);

  const bestPerformingHooks = patterns.topHooks.length > 0
    ? patterns.topHooks
    : topPerformers.slice(0, 5).map((r) => r.hook).filter(Boolean);

  const bestPerformingAngles = patterns.topAngles.length > 0
    ? patterns.topAngles
    : topPerformers.slice(0, 5).map((r) => r.angle).filter(Boolean);

  // Determine channel preferences from experiment data + content-memory
  const channelScores = new Map<string, number>();
  for (const performer of topPerformers) {
    const score = performer.metrics.engagementRate + performer.metrics.ctr + performer.metrics.revenuePerView;
    channelScores.set(performer.platform, (channelScores.get(performer.platform) ?? 0) + score);
  }

  const channelPreferences = [...channelScores.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([channel, performance]) => ({
      channel,
      performance: Math.round(performance * 100) / 100,
    }));

  // Infer optimal content lengths from winning experiments by type
  const lengthByType = new Map<string, number[]>();
  for (const exp of experiments) {
    if (exp.winnerVariant === "inconclusive") continue;
    const winnerText = exp.winnerVariant === "A" ? exp.variantA : exp.variantB;
    const wordCount = winnerText.trim().split(/\s+/).length;
    const existing = lengthByType.get(exp.contentType) ?? [];
    lengthByType.set(exp.contentType, [...existing, wordCount]);
  }

  const optimalContentLength = [...lengthByType.entries()].map(([type, counts]) => ({
    type,
    words: Math.round(counts.reduce((a, b) => a + b, 0) / counts.length),
  }));

  const learning: ContentLearning = {
    tenantId,
    niche,
    learnings: {
      winningPatterns,
      losingPatterns,
      bestPerformingHooks,
      bestPerformingAngles,
      optimalContentLength,
      channelPreferences,
    },
    updatedAt: new Date().toISOString(),
  };

  learningStore.set(tenantId, learning);
  await persistLearning(learning);
  return learning;
}

// ---------------------------------------------------------------------------
// getContentSuggestions
// ---------------------------------------------------------------------------

export async function getContentSuggestions(
  tenantId: string,
  contentType: string,
  context?: string,
): Promise<CopilotResponse> {
  const learning = learningStore.get(tenantId);

  if (isAIEnabled() && learning) {
    return getAISuggestions(tenantId, contentType, context, learning);
  }

  return getRuleBasedSuggestions(tenantId, contentType, learning);
}

async function getAISuggestions(
  tenantId: string,
  contentType: string,
  context: string | undefined,
  learning: ContentLearning,
): Promise<CopilotResponse> {
  const learningsSummary = buildLearningsSummary(learning);

  const systemPrompt = `You are a content strategy copilot. You have access to performance data showing what content strategies work for this tenant.

Based on their learnings, provide specific, actionable content suggestions.

Return your response as a JSON object with this structure:
{
  "suggestions": [
    {
      "type": "${contentType}",
      "suggestion": "specific actionable suggestion",
      "basedOn": "which learning this comes from",
      "expectedLift": 15,
      "confidence": "high"
    }
  ],
  "insights": ["high-level insight 1", "high-level insight 2"]
}

Confidence levels: "high" (3+ experiments confirm), "medium" (1-2 experiments), "low" (inferred from patterns).`;

  const userMessage = `Tenant: ${tenantId}
Niche: ${learning.niche}
Content type needed: ${contentType}
${context ? `Additional context: ${context}` : ""}

Learnings from their data:
${learningsSummary}

Provide 3-5 specific suggestions for creating high-converting ${contentType} content.`;

  const response = await callLLM([
    { role: "system", content: systemPrompt },
    { role: "user", content: userMessage },
  ]);

  if (response.model === "dry-run") {
    return getRuleBasedSuggestions(tenantId, contentType, learning);
  }

  try {
    const parsed = JSON.parse(response.content) as {
      suggestions: ContentSuggestion[];
      insights: string[];
    };
    return {
      suggestions: parsed.suggestions ?? [],
      insights: parsed.insights ?? [],
      aiGenerated: true,
      tokenUsage: {
        input: response.usage.inputTokens,
        output: response.usage.outputTokens,
      },
    };
  } catch {
    // LLM returned non-JSON — fall back to rule-based
    return getRuleBasedSuggestions(tenantId, contentType, learning);
  }
}

function getRuleBasedSuggestions(
  tenantId: string,
  contentType: string,
  learning: ContentLearning | undefined,
): CopilotResponse {
  const suggestions: ContentSuggestion[] = [];
  const insights: string[] = [];

  if (!learning) {
    suggestions.push({
      type: contentType,
      suggestion: "Record experiment results to unlock personalized suggestions.",
      basedOn: "No data yet",
      expectedLift: 0,
      confidence: "low",
    });
    return { suggestions, insights, aiGenerated: false, tokenUsage: { input: 0, output: 0 } };
  }

  const { winningPatterns, losingPatterns, bestPerformingHooks, bestPerformingAngles, channelPreferences } =
    learning.learnings;

  for (const pattern of winningPatterns) {
    const liftMatch = pattern.match(/(\d+)%/);
    const lift = liftMatch ? parseInt(liftMatch[1], 10) : 10;
    const confidence: "high" | "medium" | "low" = lift >= 20 ? "high" : lift >= 10 ? "medium" : "low";

    suggestions.push({
      type: contentType,
      suggestion: buildSuggestionFromPattern(pattern, contentType),
      basedOn: pattern,
      expectedLift: lift,
      confidence,
    });
  }

  if (bestPerformingHooks.length > 0) {
    suggestions.push({
      type: contentType,
      suggestion: `Open with a hook similar to: "${bestPerformingHooks[0]}"`,
      basedOn: "Top-performing hook from content history",
      expectedLift: 12,
      confidence: "medium",
    });
  }

  if (bestPerformingAngles.length > 0) {
    suggestions.push({
      type: contentType,
      suggestion: `Use the "${bestPerformingAngles[0]}" angle — it consistently outperforms others for this audience`,
      basedOn: "Best-performing angle from content history",
      expectedLift: 15,
      confidence: "medium",
    });
  }

  if (channelPreferences.length > 0) {
    insights.push(`Prioritize ${channelPreferences[0].channel} — highest performance score (${channelPreferences[0].performance})`);
  }

  for (const pattern of losingPatterns) {
    insights.push(`Avoid: ${pattern}`);
  }

  if (winningPatterns.length > 0) {
    insights.push(`Winning formula for your audience: ${winningPatterns.slice(0, 2).join("; ")}`);
  }

  return { suggestions, insights, aiGenerated: false, tokenUsage: { input: 0, output: 0 } };
}

function buildSuggestionFromPattern(pattern: string, contentType: string): string {
  if (pattern.includes("Questions")) {
    return `Frame your ${contentType} as a question to engage the reader directly`;
  }
  if (pattern.includes("numbers")) {
    return `Include a specific number in your ${contentType} (e.g., "3 ways to..." or "47% of...")`;
  }
  if (pattern.includes("Urgency")) {
    return `Add urgency language to your ${contentType} (e.g., "today", "now", "limited")`;
  }
  if (pattern.includes("Benefit-led")) {
    return `Lead with a clear benefit in your ${contentType} using action verbs like "get", "save", or "unlock"`;
  }
  if (pattern.includes("Social proof")) {
    return `Include social proof signals in your ${contentType} to build trust`;
  }
  return `Apply this pattern to your ${contentType}: ${pattern}`;
}

function buildLearningsSummary(learning: ContentLearning): string {
  const { winningPatterns, losingPatterns, bestPerformingHooks, bestPerformingAngles, channelPreferences } =
    learning.learnings;

  const lines: string[] = [];

  if (winningPatterns.length > 0) {
    lines.push(`WINNING PATTERNS:\n${winningPatterns.map((p) => `- ${p}`).join("\n")}`);
  }
  if (losingPatterns.length > 0) {
    lines.push(`LOSING PATTERNS:\n${losingPatterns.map((p) => `- ${p}`).join("\n")}`);
  }
  if (bestPerformingHooks.length > 0) {
    lines.push(`TOP HOOKS:\n${bestPerformingHooks.slice(0, 3).map((h) => `- ${h}`).join("\n")}`);
  }
  if (bestPerformingAngles.length > 0) {
    lines.push(`TOP ANGLES:\n${bestPerformingAngles.slice(0, 3).map((a) => `- ${a}`).join("\n")}`);
  }
  if (channelPreferences.length > 0) {
    lines.push(
      `CHANNEL PERFORMANCE:\n${channelPreferences.slice(0, 3).map((c) => `- ${c.channel}: ${c.performance}`).join("\n")}`,
    );
  }

  return lines.join("\n\n");
}

// ---------------------------------------------------------------------------
// getCopilotInsights
// ---------------------------------------------------------------------------

export async function getCopilotInsights(tenantId: string): Promise<{
  tenantId: string;
  hasLearnings: boolean;
  experimentCount: number;
  winRate: number;
  topContentType: string | null;
  summary: string[];
}> {
  const experiments = await getExperimentHistory(tenantId);
  const learning = learningStore.get(tenantId);

  const concluded = experiments.filter((e) => e.winnerVariant !== "inconclusive");
  const winRate = experiments.length > 0 ? Math.round((concluded.length / experiments.length) * 100) : 0;

  // Determine most-tested content type
  const typeCounts = new Map<string, number>();
  for (const exp of experiments) {
    typeCounts.set(exp.contentType, (typeCounts.get(exp.contentType) ?? 0) + 1);
  }
  const topContentType = typeCounts.size > 0
    ? [...typeCounts.entries()].sort((a, b) => b[1] - a[1])[0][0]
    : null;

  const summary: string[] = [];

  if (experiments.length === 0) {
    summary.push("No experiments recorded yet. Start A/B testing to unlock copilot intelligence.");
  } else {
    summary.push(`${experiments.length} experiment${experiments.length === 1 ? "" : "s"} recorded across all content types.`);
    summary.push(`${concluded.length} concluded with a clear winner (${winRate}% decisive rate).`);
  }

  if (learning) {
    const { winningPatterns, bestPerformingHooks } = learning.learnings;
    if (winningPatterns.length > 0) {
      summary.push(`Top winning pattern: ${winningPatterns[0]}`);
    }
    if (bestPerformingHooks.length > 0) {
      summary.push(`Best hook style: "${bestPerformingHooks[0]}"`);
    }
  }

  return {
    tenantId,
    hasLearnings: !!learning,
    experimentCount: experiments.length,
    winRate,
    topContentType,
    summary,
  };
}

// ---------------------------------------------------------------------------
// resetCopilotStore
// ---------------------------------------------------------------------------

export function resetCopilotStore(): void {
  experimentStore.clear();
  learningStore.clear();
}
