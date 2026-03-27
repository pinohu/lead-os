import { randomUUID } from "crypto";
import { getPool } from "./db.ts";
import { tenantConfig } from "./tenant.ts";

export interface PerformanceMetrics {
  conversionRate: number;
  avgLeadScore: number;
  avgTimeToConvert: number;
  topFunnels: { funnel: string; conversions: number; rate: number }[];
  bottomFunnels: { funnel: string; conversions: number; rate: number }[];
  topSources: { source: string; leads: number; quality: number }[];
  bottomSources: { source: string; leads: number; quality: number }[];
  dropOffPoints: { step: string; dropRate: number }[];
  emailPerformance: { openRate: number; clickRate: number; bestSubject?: string };
  scoringAccuracy: number;
}

export interface Insight {
  type: "opportunity" | "problem" | "trend";
  severity: "info" | "warning" | "critical";
  message: string;
  metric: string;
  currentValue: number;
  targetValue: number;
  recommendation: string;
}

export interface Adjustment {
  type:
    | "scoring-weight"
    | "routing-rule"
    | "funnel-disable"
    | "funnel-promote"
    | "threshold-change"
    | "source-deprioritize"
    | "psychology-trigger"
    | "nurture-timing";
  target: string;
  oldValue: unknown;
  newValue: unknown;
  reason: string;
  autoApplied: boolean;
}

export interface FeedbackCycle {
  id: string;
  tenantId: string;
  type: "daily" | "weekly" | "monthly";
  period: string;
  metrics: PerformanceMetrics;
  insights: Insight[];
  adjustments: Adjustment[];
  status: "pending" | "analyzed" | "applied" | "skipped";
  createdAt: string;
  appliedAt?: string;
}

export interface KPITargets {
  conversionRate: number;
  avgLeadScore: number;
  avgTimeToConvert: number;
  emailOpenRate: number;
  emailClickRate: number;
  scoringAccuracy: number;
  maxDropOffRate: number;
  minSourceQuality: number;
}

const DEFAULT_KPI_TARGETS: KPITargets = {
  conversionRate: 5,
  avgLeadScore: 45,
  avgTimeToConvert: 14,
  emailOpenRate: 25,
  emailClickRate: 5,
  scoringAccuracy: 0.7,
  maxDropOffRate: 50,
  minSourceQuality: 30,
};

const feedbackCycleStore = new Map<string, FeedbackCycle>();

let schemaReady: Promise<void> | null = null;

async function ensureSchema(): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  if (schemaReady) return schemaReady;

  schemaReady = (async () => {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS lead_os_feedback_cycles (
          id TEXT PRIMARY KEY,
          tenant_id TEXT NOT NULL,
          type TEXT NOT NULL,
          period TEXT NOT NULL,
          metrics JSONB NOT NULL DEFAULT '{}',
          insights JSONB NOT NULL DEFAULT '[]',
          adjustments JSONB NOT NULL DEFAULT '[]',
          status TEXT NOT NULL DEFAULT 'pending',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          applied_at TIMESTAMPTZ
        );
        CREATE INDEX IF NOT EXISTS idx_lead_os_feedback_cycles_tenant
          ON lead_os_feedback_cycles (tenant_id, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_lead_os_feedback_cycles_type
          ON lead_os_feedback_cycles (tenant_id, type);
      `);
    } catch (error: unknown) {
      console.error("Failed to create feedback engine schema:", error);
      schemaReady = null;
    }
  })();

  return schemaReady;
}

export async function collectPerformanceMetrics(
  tenantId: string,
  since: string,
  until: string,
): Promise<PerformanceMetrics> {
  const pool = getPool();

  const defaultMetrics: PerformanceMetrics = {
    conversionRate: 0,
    avgLeadScore: 0,
    avgTimeToConvert: 0,
    topFunnels: [],
    bottomFunnels: [],
    topSources: [],
    bottomSources: [],
    dropOffPoints: [],
    emailPerformance: { openRate: 0, clickRate: 0 },
    scoringAccuracy: 0,
  };

  if (!pool) return defaultMetrics;

  try {
    const leadsResult = await pool.query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE status = 'converted')::int AS conversions,
         COALESCE(ROUND(AVG(score)::numeric, 1), 0) AS avg_score
       FROM lead_os_leads
       WHERE tenant_id = $1 AND created_at >= $2::timestamptz AND created_at <= $3::timestamptz`,
      [tenantId, since, until],
    );

    const totalLeads = leadsResult.rows[0]?.total ?? 0;
    const totalConversions = leadsResult.rows[0]?.conversions ?? 0;
    const avgScore = Number(leadsResult.rows[0]?.avg_score ?? 0);
    const conversionRate = totalLeads > 0 ? (totalConversions / totalLeads) * 100 : 0;

    const funnelResult = await pool.query(
      `SELECT
         family AS funnel,
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE status = 'converted')::int AS conversions
       FROM lead_os_leads
       WHERE tenant_id = $1 AND created_at >= $2::timestamptz AND created_at <= $3::timestamptz
       GROUP BY family
       ORDER BY conversions DESC`,
      [tenantId, since, until],
    );

    const funnels = funnelResult.rows.map((row) => ({
      funnel: row.funnel,
      conversions: row.conversions,
      rate: row.total > 0 ? Math.round((row.conversions / row.total) * 1000) / 10 : 0,
    }));

    const avgFunnelRate = funnels.length > 0
      ? funnels.reduce((sum, f) => sum + f.rate, 0) / funnels.length
      : 0;

    const topFunnels = funnels.filter((f) => f.rate >= avgFunnelRate).slice(0, 5);
    const bottomFunnels = funnels.filter((f) => f.rate < avgFunnelRate).slice(0, 5);

    const sourceResult = await pool.query(
      `SELECT
         source,
         COUNT(*)::int AS leads,
         COALESCE(ROUND(AVG(score)::numeric, 1), 0) AS quality
       FROM lead_os_leads
       WHERE tenant_id = $1 AND created_at >= $2::timestamptz AND created_at <= $3::timestamptz
       GROUP BY source
       ORDER BY quality DESC`,
      [tenantId, since, until],
    );

    const sources = sourceResult.rows.map((row) => ({
      source: row.source,
      leads: row.leads,
      quality: Number(row.quality),
    }));

    const topSources = sources.slice(0, 5);
    const bottomSources = [...sources].reverse().slice(0, 5);

    let emailPerformance = { openRate: 0, clickRate: 0, bestSubject: undefined as string | undefined };
    try {
      const emailResult = await pool.query(
        `SELECT
           COUNT(*)::int AS sent,
           COUNT(*) FILTER (WHERE opened = true)::int AS opened,
           COUNT(*) FILTER (WHERE clicked = true)::int AS clicked
         FROM lead_os_email_tracking
         WHERE tenant_id = $1 AND sent_at >= $2::timestamptz AND sent_at <= $3::timestamptz`,
        [tenantId, since, until],
      );

      const sent = emailResult.rows[0]?.sent ?? 0;
      const opened = emailResult.rows[0]?.opened ?? 0;
      const clicked = emailResult.rows[0]?.clicked ?? 0;

      emailPerformance = {
        openRate: sent > 0 ? Math.round((opened / sent) * 1000) / 10 : 0,
        clickRate: sent > 0 ? Math.round((clicked / sent) * 1000) / 10 : 0,
        bestSubject: undefined,
      };
    } catch {
      // email tracking table may not exist yet
    }

    const scoringAccuracy = await getScoringAccuracy(tenantId);

    return {
      conversionRate: Math.round(conversionRate * 100) / 100,
      avgLeadScore: avgScore,
      avgTimeToConvert: 0,
      topFunnels,
      bottomFunnels,
      topSources,
      bottomSources,
      dropOffPoints: [],
      emailPerformance,
      scoringAccuracy,
    };
  } catch {
    return defaultMetrics;
  }
}

export function generateInsights(
  metrics: PerformanceMetrics,
  targets?: KPITargets,
): Insight[] {
  const kpi = targets ?? DEFAULT_KPI_TARGETS;
  const insights: Insight[] = [];

  if (metrics.conversionRate < kpi.conversionRate) {
    const severity = metrics.conversionRate < kpi.conversionRate * 0.5 ? "critical" : "warning";
    insights.push({
      type: "problem",
      severity,
      message: `Conversion rate (${metrics.conversionRate}%) is below target (${kpi.conversionRate}%)`,
      metric: "conversionRate",
      currentValue: metrics.conversionRate,
      targetValue: kpi.conversionRate,
      recommendation: "Review funnel drop-off points and consider A/B testing landing pages. Check if lead quality from top sources is declining.",
    });
  } else if (metrics.conversionRate > kpi.conversionRate * 1.2) {
    insights.push({
      type: "opportunity",
      severity: "info",
      message: `Conversion rate (${metrics.conversionRate}%) exceeds target by 20%+. Consider scaling traffic.`,
      metric: "conversionRate",
      currentValue: metrics.conversionRate,
      targetValue: kpi.conversionRate,
      recommendation: "Increase ad spend on top-performing channels. The system is converting well and can handle more volume.",
    });
  }

  if (metrics.avgLeadScore < kpi.avgLeadScore) {
    insights.push({
      type: "problem",
      severity: metrics.avgLeadScore < kpi.avgLeadScore * 0.6 ? "critical" : "warning",
      message: `Average lead score (${metrics.avgLeadScore}) is below target (${kpi.avgLeadScore})`,
      metric: "avgLeadScore",
      currentValue: metrics.avgLeadScore,
      targetValue: kpi.avgLeadScore,
      recommendation: "Review traffic sources. Low scores often indicate misaligned targeting or low-intent channels dominating the mix.",
    });
  }

  if (metrics.emailPerformance.openRate < kpi.emailOpenRate) {
    insights.push({
      type: "problem",
      severity: metrics.emailPerformance.openRate < kpi.emailOpenRate * 0.5 ? "critical" : "warning",
      message: `Email open rate (${metrics.emailPerformance.openRate}%) is below target (${kpi.emailOpenRate}%)`,
      metric: "emailOpenRate",
      currentValue: metrics.emailPerformance.openRate,
      targetValue: kpi.emailOpenRate,
      recommendation: "Test new subject lines. Segment by engagement level and send at optimal times. Consider re-engagement campaigns for cold subscribers.",
    });
  }

  if (metrics.emailPerformance.clickRate < kpi.emailClickRate) {
    insights.push({
      type: "problem",
      severity: "warning",
      message: `Email click rate (${metrics.emailPerformance.clickRate}%) is below target (${kpi.emailClickRate}%)`,
      metric: "emailClickRate",
      currentValue: metrics.emailPerformance.clickRate,
      targetValue: kpi.emailClickRate,
      recommendation: "Improve email content relevance. Use more targeted CTAs and personalize based on lead stage and interests.",
    });
  }

  if (metrics.scoringAccuracy < kpi.scoringAccuracy) {
    insights.push({
      type: "problem",
      severity: metrics.scoringAccuracy < kpi.scoringAccuracy * 0.7 ? "critical" : "warning",
      message: `Scoring accuracy (${Math.round(metrics.scoringAccuracy * 100)}%) is below target (${Math.round(kpi.scoringAccuracy * 100)}%)`,
      metric: "scoringAccuracy",
      currentValue: metrics.scoringAccuracy,
      targetValue: kpi.scoringAccuracy,
      recommendation: "Recalibrate scoring weights. High scores that do not convert indicate over-indexing on behavioral signals vs. fit signals.",
    });
  }

  for (const funnel of metrics.bottomFunnels) {
    const avgRate = metrics.topFunnels.length > 0
      ? metrics.topFunnels.reduce((sum, f) => sum + f.rate, 0) / metrics.topFunnels.length
      : 0;

    if (funnel.rate < avgRate * 0.5 && funnel.conversions >= 0) {
      insights.push({
        type: "problem",
        severity: "warning",
        message: `Funnel "${funnel.funnel}" has a conversion rate of ${funnel.rate}%, well below average (${Math.round(avgRate * 10) / 10}%)`,
        metric: "funnelConversionRate",
        currentValue: funnel.rate,
        targetValue: avgRate,
        recommendation: `Consider disabling or redesigning the "${funnel.funnel}" funnel. Redirect its traffic to higher-performing alternatives.`,
      });
    }
  }

  for (const source of metrics.bottomSources) {
    if (source.quality < kpi.minSourceQuality) {
      insights.push({
        type: "problem",
        severity: "warning",
        message: `Source "${source.source}" has low lead quality (${source.quality})`,
        metric: "sourceQuality",
        currentValue: source.quality,
        targetValue: kpi.minSourceQuality,
        recommendation: `Deprioritize "${source.source}" or refine targeting. The leads from this source consistently score below quality thresholds.`,
      });
    }
  }

  for (const drop of metrics.dropOffPoints) {
    if (drop.dropRate > kpi.maxDropOffRate) {
      insights.push({
        type: "problem",
        severity: drop.dropRate > 70 ? "critical" : "warning",
        message: `Step "${drop.step}" has a ${drop.dropRate}% drop-off rate`,
        metric: "dropOffRate",
        currentValue: drop.dropRate,
        targetValue: kpi.maxDropOffRate,
        recommendation: `Review UX at "${drop.step}". Consider simplifying the form, adding trust signals, or implementing micro-commitments before this step.`,
      });
    }
  }

  if (metrics.topFunnels.length > 0) {
    const bestFunnel = metrics.topFunnels[0];
    insights.push({
      type: "trend",
      severity: "info",
      message: `"${bestFunnel.funnel}" is the top-performing funnel with ${bestFunnel.rate}% conversion rate`,
      metric: "topFunnelRate",
      currentValue: bestFunnel.rate,
      targetValue: bestFunnel.rate,
      recommendation: `Route more traffic to "${bestFunnel.funnel}" and study what makes it effective. Consider replicating its approach in other funnels.`,
    });
  }

  return insights;
}

const SAFE_ADJUSTMENT_THRESHOLD = 0.1;

export function proposeAdjustments(
  insights: Insight[],
  currentConfig: Record<string, unknown>,
): Adjustment[] {
  const adjustments: Adjustment[] = [];

  for (const insight of insights) {
    if (insight.metric === "scoringAccuracy" && insight.type === "problem") {
      const currentIntentWeight = (currentConfig.intentWeight as number) ?? 0.3;
      const currentFitWeight = (currentConfig.fitWeight as number) ?? 0.25;
      const delta = Math.min(0.05, currentIntentWeight * SAFE_ADJUSTMENT_THRESHOLD);

      adjustments.push({
        type: "scoring-weight",
        target: "intentWeight",
        oldValue: currentIntentWeight,
        newValue: Math.round((currentIntentWeight - delta) * 100) / 100,
        reason: "Scoring over-predicts conversions. Reducing intent weight to improve accuracy.",
        autoApplied: delta <= currentIntentWeight * SAFE_ADJUSTMENT_THRESHOLD,
      });

      adjustments.push({
        type: "scoring-weight",
        target: "fitWeight",
        oldValue: currentFitWeight,
        newValue: Math.round((currentFitWeight + delta) * 100) / 100,
        reason: "Increasing fit weight to better predict actual conversion likelihood.",
        autoApplied: delta <= currentFitWeight * SAFE_ADJUSTMENT_THRESHOLD,
      });
    }

    if (insight.metric === "funnelConversionRate" && insight.type === "problem") {
      const funnelName = insight.message.match(/"([^"]+)"/)?.[1] ?? "unknown";
      if (insight.currentValue < insight.targetValue * 0.3) {
        adjustments.push({
          type: "funnel-disable",
          target: funnelName,
          oldValue: "active",
          newValue: "disabled",
          reason: `Funnel "${funnelName}" conversion rate is critically low (${insight.currentValue}%). Recommending disable.`,
          autoApplied: false,
        });
      }
    }

    if (insight.metric === "sourceQuality" && insight.type === "problem") {
      const sourceName = insight.message.match(/"([^"]+)"/)?.[1] ?? "unknown";
      adjustments.push({
        type: "source-deprioritize",
        target: sourceName,
        oldValue: "normal",
        newValue: "deprioritized",
        reason: `Source "${sourceName}" lead quality (${insight.currentValue}) is below threshold (${insight.targetValue}).`,
        autoApplied: false,
      });
    }

    if (insight.metric === "emailOpenRate" && insight.type === "problem") {
      adjustments.push({
        type: "nurture-timing",
        target: "email-send-time",
        oldValue: currentConfig.emailSendHour ?? 9,
        newValue: 10,
        reason: "Low open rates suggest suboptimal send times. Adjusting to 10 AM for better engagement.",
        autoApplied: true,
      });
    }

    if (insight.metric === "topFunnelRate" && insight.type === "trend") {
      const funnelName = insight.message.match(/"([^"]+)"/)?.[1] ?? "unknown";
      adjustments.push({
        type: "funnel-promote",
        target: funnelName,
        oldValue: "normal",
        newValue: "promoted",
        reason: `"${funnelName}" is outperforming. Routing more traffic to increase overall conversion.`,
        autoApplied: true,
      });
    }

    if (insight.metric === "dropOffRate" && insight.severity === "critical") {
      adjustments.push({
        type: "psychology-trigger",
        target: insight.message.match(/"([^"]+)"/)?.[1] ?? "unknown-step",
        oldValue: "none",
        newValue: "trust-guarantee + micro-commitment",
        reason: `High drop-off at this step. Adding trust guarantees and micro-commitments to reduce abandonment.`,
        autoApplied: true,
      });
    }
  }

  return adjustments;
}

export async function applyAdjustment(
  tenantId: string,
  adjustment: Adjustment,
): Promise<void> {
  const pool = getPool();
  if (!pool) return;

  try {
    await pool.query(
      `INSERT INTO lead_os_feedback_cycles (id, tenant_id, type, period, metrics, insights, adjustments, status, applied_at)
       VALUES ($1, $2, 'adjustment', $3, '{}'::jsonb, '[]'::jsonb, $4::jsonb, 'applied', NOW())
       ON CONFLICT DO NOTHING`,
      [
        randomUUID(),
        tenantId,
        new Date().toISOString().slice(0, 10),
        JSON.stringify([adjustment]),
      ],
    );
  } catch (error: unknown) {
    console.error("Failed to record adjustment application:", error);
  }
}

export async function getScoringAccuracy(tenantId: string): Promise<number> {
  const pool = getPool();
  if (!pool) return 0;

  try {
    const result = await pool.query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE (score >= 60 AND status = 'converted') OR (score < 60 AND status != 'converted'))::int AS correct
       FROM lead_os_leads
       WHERE tenant_id = $1 AND created_at >= NOW() - INTERVAL '90 days'`,
      [tenantId],
    );

    const total = result.rows[0]?.total ?? 0;
    const correct = result.rows[0]?.correct ?? 0;

    if (total === 0) return 0;
    return Math.round((correct / total) * 100) / 100;
  } catch {
    return 0;
  }
}

export async function runFeedbackCycle(
  tenantId: string,
  type: "daily" | "weekly" | "monthly",
): Promise<FeedbackCycle> {
  await ensureSchema();

  const now = new Date();
  const periodDays = type === "daily" ? 1 : type === "weekly" ? 7 : 30;
  const since = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000).toISOString();
  const until = now.toISOString();
  const period = `${since.slice(0, 10)}/${until.slice(0, 10)}`;

  const metrics = await collectPerformanceMetrics(tenantId, since, until);
  const insights = generateInsights(metrics);
  const adjustments = proposeAdjustments(insights, {});

  const safeAdjustments = adjustments.filter((a) => a.autoApplied);
  for (const adj of safeAdjustments) {
    await applyAdjustment(tenantId, adj);
  }

  const cycle: FeedbackCycle = {
    id: randomUUID(),
    tenantId,
    type,
    period,
    metrics,
    insights,
    adjustments,
    status: safeAdjustments.length > 0 ? "applied" : "analyzed",
    createdAt: now.toISOString(),
    appliedAt: safeAdjustments.length > 0 ? now.toISOString() : undefined,
  };

  feedbackCycleStore.set(cycle.id, cycle);

  const pool = getPool();
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO lead_os_feedback_cycles
          (id, tenant_id, type, period, metrics, insights, adjustments, status, created_at, applied_at)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7::jsonb, $8, $9::timestamptz, $10::timestamptz)`,
        [
          cycle.id,
          cycle.tenantId,
          cycle.type,
          cycle.period,
          JSON.stringify(cycle.metrics),
          JSON.stringify(cycle.insights),
          JSON.stringify(cycle.adjustments),
          cycle.status,
          cycle.createdAt,
          cycle.appliedAt ?? null,
        ],
      );
    } catch (error: unknown) {
      console.error("Failed to persist feedback cycle:", error);
    }
  }

  return cycle;
}

export async function getFeedbackHistory(
  tenantId: string,
  limit?: number,
): Promise<FeedbackCycle[]> {
  await ensureSchema();

  const pool = getPool();
  const maxResults = Math.min(limit ?? 50, 100);

  if (pool) {
    try {
      const result = await pool.query(
        `SELECT id, tenant_id, type, period, metrics, insights, adjustments, status, created_at, applied_at
         FROM lead_os_feedback_cycles
         WHERE tenant_id = $1
         ORDER BY created_at DESC
         LIMIT $2`,
        [tenantId, maxResults],
      );

      return result.rows.map((row) => ({
        id: row.id,
        tenantId: row.tenant_id,
        type: row.type,
        period: row.period,
        metrics: row.metrics,
        insights: row.insights,
        adjustments: row.adjustments,
        status: row.status,
        createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
        appliedAt: row.applied_at
          ? row.applied_at instanceof Date
            ? row.applied_at.toISOString()
            : row.applied_at
          : undefined,
      }));
    } catch {
      // fall through to in-memory
    }
  }

  return [...feedbackCycleStore.values()]
    .filter((c) => c.tenantId === tenantId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, maxResults);
}

export async function getFeedbackCycle(id: string): Promise<FeedbackCycle | null> {
  const cached = feedbackCycleStore.get(id);
  if (cached) return cached;

  const pool = getPool();
  if (!pool) return null;

  try {
    await ensureSchema();
    const result = await pool.query(
      `SELECT id, tenant_id, type, period, metrics, insights, adjustments, status, created_at, applied_at
       FROM lead_os_feedback_cycles WHERE id = $1`,
      [id],
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      id: row.id,
      tenantId: row.tenant_id,
      type: row.type,
      period: row.period,
      metrics: row.metrics,
      insights: row.insights,
      adjustments: row.adjustments,
      status: row.status,
      createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
      appliedAt: row.applied_at
        ? row.applied_at instanceof Date
          ? row.applied_at.toISOString()
          : row.applied_at
        : undefined,
    };
  } catch {
    return null;
  }
}

export async function applyPendingAdjustments(
  tenantId: string,
  cycleId: string,
): Promise<FeedbackCycle | null> {
  const cycle = feedbackCycleStore.get(cycleId) ?? (await getFeedbackCycle(cycleId));
  if (!cycle || cycle.tenantId !== tenantId) return null;

  const pending = cycle.adjustments.filter((a) => !a.autoApplied);
  for (const adj of pending) {
    await applyAdjustment(tenantId, adj);
  }

  cycle.status = "applied";
  cycle.appliedAt = new Date().toISOString();
  feedbackCycleStore.set(cycleId, cycle);

  const pool = getPool();
  if (pool) {
    try {
      await pool.query(
        `UPDATE lead_os_feedback_cycles SET status = 'applied', applied_at = NOW() WHERE id = $1`,
        [cycleId],
      );
    } catch {
      // non-critical persistence failure
    }
  }

  return cycle;
}

export function getDefaultKPITargets(): KPITargets {
  return { ...DEFAULT_KPI_TARGETS };
}

export function resetFeedbackStore(): void {
  feedbackCycleStore.clear();
  schemaReady = null;
}
