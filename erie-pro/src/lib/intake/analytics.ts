// ── Intake Analytics Aggregation ─────────────────────────────────────
// Pure functions that compute analytics from raw conversation rows.
// Separated from the page component so it can be unit-tested without
// a database, and reused if we later add a JSON API endpoint.

import type { IntakeStep, IntakeMessage, IntakeOutcome } from "@/lib/intake/types";

// Minimal subset of the IntakeConversation prisma row we need.
export interface ConversationRow {
  id: string;
  currentStep: string;
  outcomeStatus: string;
  startedFromNicheSlug: string | null;
  leadId: string | null;
  messages: unknown; // raw JSON
  outcome: unknown;  // raw JSON
  createdAt: Date;
  updatedAt: Date;
}

// Funnel steps in order. "complete" is the terminal success state.
export const FUNNEL_STEPS: IntakeStep[] = [
  "problem",
  "location",
  "urgency",
  "budget",
  "contact",
  "complete",
];

export interface IntakeAnalytics {
  range: { startISO: string; endISO: string; days: number };
  totals: {
    conversations: number;
    completed: number;
    abandoned: number;
    inProgress: number;
    errored: number;
    conversionRate: number; // completed / conversations (0..1)
  };
  funnel: Array<{
    step: IntakeStep;
    reached: number;
    pctOfStart: number; // % of total conversations
    dropoffFromPrev: number; // count lost between prev step and this
    dropoffPct: number; // dropoff / prev reached (0..1)
  }>;
  topNiches: Array<{
    slug: string;
    conversations: number;
    completed: number;
    conversionRate: number;
  }>;
  dailyCounts: Array<{
    date: string; // YYYY-MM-DD
    total: number;
    completed: number;
  }>;
  routing: {
    /** Conversations where the user used the "did you mean" UI to switch */
    nicheSwitches: number;
    /** Distinct previous-niche → corrected-niche pairs, top 5 */
    topSwitchPairs: Array<{ from: string; to: string; count: number }>;
    /** % of conversations where a switch happened */
    switchRate: number;
  };
  classifierConfidence: {
    /** Average confidence across all conversations with primaryNicheConfidence set */
    avg: number;
    /** Bucketed distribution */
    buckets: Array<{ label: string; count: number }>;
  };
  /** Conversations where `outcomeStatus === "completed"` but `leadId` is null
   *  — should be 0 in normal operation. Surfaces silent failures. */
  orphanCompleted: number;
}

const STEP_ORDER: Record<string, number> = {
  problem: 0,
  location: 1,
  urgency: 2,
  budget: 3,
  contact: 4,
  complete: 5,
};

function safeOutcome(raw: unknown): Partial<IntakeOutcome> {
  return raw && typeof raw === "object" ? (raw as Partial<IntakeOutcome>) : {};
}

function safeMessages(raw: unknown): IntakeMessage[] {
  return Array.isArray(raw) ? (raw as IntakeMessage[]) : [];
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Determine the furthest step a conversation has reached. For completed
 * conversations this is "complete"; for in-progress ones it's currentStep.
 * For abandoned/errored, it's currentStep at time of abandonment.
 */
function furthestStepReached(row: ConversationRow): IntakeStep {
  if (row.outcomeStatus === "completed") return "complete";
  // currentStep is the next step to act on; everything BEFORE it has been reached
  const step = row.currentStep as IntakeStep;
  if (STEP_ORDER[step] === undefined) return "problem";
  return step;
}

/**
 * A conversation "reached" a given step if its furthest step ≥ that step.
 */
function reachedStep(row: ConversationRow, step: IntakeStep): boolean {
  const furthest = furthestStepReached(row);
  return STEP_ORDER[furthest] >= STEP_ORDER[step];
}

export function computeIntakeAnalytics(
  rows: ConversationRow[],
  rangeStart: Date,
  rangeEnd: Date
): IntakeAnalytics {
  const dayMs = 86400000;
  const days = Math.max(
    1,
    Math.round((rangeEnd.getTime() - rangeStart.getTime()) / dayMs)
  );

  // Totals
  const totals = {
    conversations: rows.length,
    completed: 0,
    abandoned: 0,
    inProgress: 0,
    errored: 0,
    conversionRate: 0,
  };
  for (const r of rows) {
    if (r.outcomeStatus === "completed") totals.completed++;
    else if (r.outcomeStatus === "abandoned") totals.abandoned++;
    else if (r.outcomeStatus === "in_progress") totals.inProgress++;
    else if (r.outcomeStatus === "error") totals.errored++;
  }
  totals.conversionRate =
    totals.conversations > 0 ? totals.completed / totals.conversations : 0;

  // Funnel
  const funnel = FUNNEL_STEPS.map((step) => ({
    step,
    reached: rows.filter((r) => reachedStep(r, step)).length,
    pctOfStart: 0,
    dropoffFromPrev: 0,
    dropoffPct: 0,
  }));
  const start = funnel[0].reached || 1;
  for (let i = 0; i < funnel.length; i++) {
    funnel[i].pctOfStart = funnel[i].reached / start;
    if (i > 0) {
      const prev = funnel[i - 1].reached;
      funnel[i].dropoffFromPrev = Math.max(0, prev - funnel[i].reached);
      funnel[i].dropoffPct = prev > 0 ? funnel[i].dropoffFromPrev / prev : 0;
    }
  }

  // Top niches (by total conversations, then by completions)
  const nicheMap = new Map<string, { total: number; completed: number }>();
  for (const r of rows) {
    const outcome = safeOutcome(r.outcome);
    // Prefer the FINAL primaryNiche (post-switch); fall back to page hint
    const niche =
      outcome.primaryNiche || r.startedFromNicheSlug || "(unrouted)";
    const entry = nicheMap.get(niche) ?? { total: 0, completed: 0 };
    entry.total++;
    if (r.outcomeStatus === "completed") entry.completed++;
    nicheMap.set(niche, entry);
  }
  const topNiches = Array.from(nicheMap.entries())
    .map(([slug, { total, completed }]) => ({
      slug,
      conversations: total,
      completed,
      conversionRate: total > 0 ? completed / total : 0,
    }))
    .sort((a, b) => b.conversations - a.conversations)
    .slice(0, 10);

  // Daily counts (build a continuous date axis even for empty days)
  const dailyMap = new Map<string, { total: number; completed: number }>();
  for (let d = 0; d < days; d++) {
    const date = new Date(rangeStart.getTime() + d * dayMs);
    dailyMap.set(ymd(date), { total: 0, completed: 0 });
  }
  for (const r of rows) {
    const k = ymd(r.createdAt);
    const entry = dailyMap.get(k);
    if (entry) {
      entry.total++;
      if (r.outcomeStatus === "completed") entry.completed++;
    }
  }
  const dailyCounts = Array.from(dailyMap.entries())
    .map(([date, { total, completed }]) => ({ date, total, completed }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Routing — detect did-you-mean switches by scanning messages for
  // meta.classifierSource === "user-correction"
  let nicheSwitches = 0;
  const switchPairCounts = new Map<string, number>();
  for (const r of rows) {
    const msgs = safeMessages(r.messages);
    for (const m of msgs) {
      const meta = (m.meta ?? {}) as { classifierSource?: string; previousNiche?: string; matchedNiche?: string };
      if (meta.classifierSource === "user-correction") {
        nicheSwitches++;
        if (meta.previousNiche && meta.matchedNiche) {
          const key = `${meta.previousNiche}\u2192${meta.matchedNiche}`;
          switchPairCounts.set(key, (switchPairCounts.get(key) ?? 0) + 1);
        }
        break; // count one switch per conversation max for the headline
      }
    }
  }
  const topSwitchPairs = Array.from(switchPairCounts.entries())
    .map(([key, count]) => {
      const [from, to] = key.split("\u2192");
      return { from, to, count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Classifier confidence — bucket primaryNicheConfidence into ranges
  const confidences: number[] = [];
  for (const r of rows) {
    const outcome = safeOutcome(r.outcome);
    if (typeof outcome.primaryNicheConfidence === "number") {
      confidences.push(outcome.primaryNicheConfidence);
    }
  }
  const buckets = [
    { label: "0.00–0.25", count: 0 },
    { label: "0.25–0.50", count: 0 },
    { label: "0.50–0.75", count: 0 },
    { label: "0.75–1.00", count: 0 },
    { label: "1.00 (user-confirmed)", count: 0 },
  ];
  for (const c of confidences) {
    if (c >= 1.0) buckets[4].count++;
    else if (c >= 0.75) buckets[3].count++;
    else if (c >= 0.5) buckets[2].count++;
    else if (c >= 0.25) buckets[1].count++;
    else buckets[0].count++;
  }
  const avgConfidence =
    confidences.length > 0
      ? confidences.reduce((a, b) => a + b, 0) / confidences.length
      : 0;

  // Orphan-completed: outcomeStatus="completed" but no leadId
  const orphanCompleted = rows.filter(
    (r) => r.outcomeStatus === "completed" && !r.leadId
  ).length;

  return {
    range: {
      startISO: rangeStart.toISOString(),
      endISO: rangeEnd.toISOString(),
      days,
    },
    totals,
    funnel,
    topNiches,
    dailyCounts,
    routing: {
      nicheSwitches,
      topSwitchPairs,
      switchRate:
        totals.conversations > 0 ? nicheSwitches / totals.conversations : 0,
    },
    classifierConfidence: {
      avg: avgConfidence,
      buckets,
    },
    orphanCompleted,
  };
}
