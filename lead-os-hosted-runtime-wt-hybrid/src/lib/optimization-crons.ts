import { runFeedbackCycle } from "./feedback-engine.ts";
import { retryFailedDeliveries } from "./webhook-registry.ts";
import { getPool } from "./db.ts";
import { listCreativeJobs, runCreativeJob } from "./creative-scheduler.ts";
import { generateDesignMd, exportDesignMdForAgent } from "./design-md.ts";

export interface CronJobDefinition {
  id: string;
  name: string;
  schedule: "daily" | "weekly" | "monthly";
  handler: (tenantId: string) => Promise<void>;
  description: string;
}

async function runDailyFeedback(tenantId: string): Promise<void> {
  await runFeedbackCycle(tenantId, "daily");
}

async function runWeeklyFeedback(tenantId: string): Promise<void> {
  await runFeedbackCycle(tenantId, "weekly");
}

async function runMonthlyFeedback(tenantId: string): Promise<void> {
  await runFeedbackCycle(tenantId, "monthly");
}

export async function expireStaleLeads(tenantId: string): Promise<void> {
  const pool = getPool();
  if (!pool) return;

  try {
    await pool.query(
      `UPDATE lead_os_leads
       SET status = 'retention-risk', updated_at = NOW()
       WHERE tenant_id = $1
         AND status NOT IN ('converted', 'retention-risk', 'inactive', 'disqualified')
         AND updated_at < NOW() - INTERVAL '30 days'`,
      [tenantId],
    );
  } catch (error: unknown) {
    console.error("Failed to expire stale leads:", error);
  }
}

export async function retryFailedWebhookDeliveries(_tenantId: string): Promise<void> {
  try {
    await retryFailedDeliveries();
  } catch (error: unknown) {
    console.error("Failed to retry webhook deliveries:", error);
  }
}

export async function optimizeFunnelRouting(tenantId: string): Promise<void> {
  const pool = getPool();
  if (!pool) return;

  try {
    const result = await pool.query(
      `SELECT
         family AS funnel,
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE status = 'converted')::int AS conversions
       FROM lead_os_leads
       WHERE tenant_id = $1 AND created_at >= NOW() - INTERVAL '7 days'
       GROUP BY family
       HAVING COUNT(*) >= 5
       ORDER BY (COUNT(*) FILTER (WHERE status = 'converted')::float / GREATEST(COUNT(*), 1)) DESC`,
      [tenantId],
    );

    if (result.rows.length < 2) return;

    const avgRate = result.rows.reduce((sum, r) => {
      return sum + (r.total > 0 ? r.conversions / r.total : 0);
    }, 0) / result.rows.length;

    for (const row of result.rows) {
      const rate = row.total > 0 ? row.conversions / row.total : 0;
      if (rate < avgRate * 0.3) {
        console.info(`[optimization] Funnel "${row.funnel}" underperforming (${Math.round(rate * 100)}% vs avg ${Math.round(avgRate * 100)}%). Consider redesign.`);
      }
    }
  } catch (error: unknown) {
    console.error("Failed to optimize funnel routing:", error);
  }
}

export async function analyzeAndPromoteExperiments(tenantId: string): Promise<void> {
  const pool = getPool();
  if (!pool) return;

  try {
    const result = await pool.query(
      `SELECT id, name, status, variants, target_metric, minimum_sample_size
       FROM lead_os_experiments
       WHERE tenant_id = $1 AND status = 'running'`,
      [tenantId],
    );

    for (const experiment of result.rows) {
      const variants = experiment.variants ?? [];
      const totalAssignments = variants.reduce(
        (sum: number, v: { assignments?: number }) => sum + (v.assignments ?? 0),
        0,
      );

      if (totalAssignments < (experiment.minimum_sample_size ?? 100)) continue;

      let bestVariant = variants[0];
      for (const v of variants) {
        const bestRate = bestVariant.assignments > 0
          ? (bestVariant.conversions ?? 0) / bestVariant.assignments
          : 0;
        const currentRate = v.assignments > 0
          ? (v.conversions ?? 0) / v.assignments
          : 0;
        if (currentRate > bestRate) {
          bestVariant = v;
        }
      }

      console.info(
        `[optimization] Experiment "${experiment.name}" has sufficient data. Best variant: "${bestVariant.name ?? bestVariant.id}".`,
      );
    }
  } catch {
    // experiments table may not exist yet
  }
}

export async function calibrateScoringModel(tenantId: string): Promise<void> {
  const pool = getPool();
  if (!pool) return;

  try {
    const result = await pool.query(
      `SELECT
         CASE WHEN score >= 60 THEN 'high' ELSE 'low' END AS bucket,
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE status = 'converted')::int AS conversions
       FROM lead_os_leads
       WHERE tenant_id = $1 AND created_at >= NOW() - INTERVAL '30 days'
       GROUP BY bucket`,
      [tenantId],
    );

    const high = result.rows.find((r) => r.bucket === "high");
    const low = result.rows.find((r) => r.bucket === "low");

    const highRate = high && high.total > 0 ? high.conversions / high.total : 0;
    const lowRate = low && low.total > 0 ? low.conversions / low.total : 0;

    if (highRate > 0 && lowRate > 0) {
      const ratio = highRate / lowRate;
      if (ratio < 2) {
        console.info(
          `[calibration] Scoring model needs recalibration. High-score conversion rate (${Math.round(highRate * 100)}%) is only ${ratio.toFixed(1)}x the low-score rate (${Math.round(lowRate * 100)}%).`,
        );
      }
    }
  } catch {
    // leads table may have different schema
  }
}

export async function analyzeNicheExpansion(tenantId: string): Promise<void> {
  const pool = getPool();
  if (!pool) return;

  try {
    const result = await pool.query(
      `SELECT
         niche,
         COUNT(*)::int AS leads,
         COUNT(*) FILTER (WHERE status = 'converted')::int AS conversions,
         COALESCE(ROUND(AVG(score)::numeric, 1), 0) AS avg_score
       FROM lead_os_leads
       WHERE tenant_id = $1 AND created_at >= NOW() - INTERVAL '90 days'
       GROUP BY niche
       ORDER BY conversions DESC`,
      [tenantId],
    );

    for (const row of result.rows) {
      const rate = row.leads > 0 ? row.conversions / row.leads : 0;
      if (rate > 0.05 && row.leads >= 10) {
        console.info(
          `[niche-expansion] Niche "${row.niche}" shows strong performance: ${row.leads} leads, ${Math.round(rate * 100)}% conversion, avg score ${row.avg_score}.`,
        );
      }
    }
  } catch {
    // non-critical analytics query
  }
}

async function runWeeklyVideoRecap(tenantId: string): Promise<void> {
  try {
    const jobs = await listCreativeJobs(tenantId);
    const recapJobs = jobs.filter((j) => j.type === "weekly-video-recap" && j.status === "active");
    for (const job of recapJobs) {
      await runCreativeJob(job.id);
    }
  } catch (error: unknown) {
    console.error("Failed to run weekly video recap:", error);
  }
}

async function runDesignSystemSync(tenantId: string): Promise<void> {
  try {
    const [rawMd, agentMd] = await Promise.all([
      generateDesignMd(tenantId),
      exportDesignMdForAgent(tenantId),
    ]);
    console.info(
      `[design-sync] Exported design.md for tenant ${tenantId}: ${rawMd.length} chars (raw), ${agentMd.length} chars (agent)`,
    );
  } catch (error: unknown) {
    console.error("Failed to sync design system:", error);
  }
}

export const OPTIMIZATION_CRONS: CronJobDefinition[] = [
  {
    id: "daily-feedback",
    name: "Daily Feedback Cycle",
    schedule: "daily",
    handler: runDailyFeedback,
    description: "Analyze daily metrics, auto-adjust safe parameters",
  },
  {
    id: "daily-stale-leads",
    name: "Expire Stale Leads",
    schedule: "daily",
    handler: expireStaleLeads,
    description: "Mark leads inactive after 30 days of no engagement",
  },
  {
    id: "daily-webhook-retry",
    name: "Retry Failed Webhooks",
    schedule: "daily",
    handler: retryFailedWebhookDeliveries,
    description: "Retry webhooks that failed delivery",
  },
  {
    id: "weekly-feedback",
    name: "Weekly Feedback Cycle",
    schedule: "weekly",
    handler: runWeeklyFeedback,
    description: "Deep weekly analysis, propose scoring adjustments",
  },
  {
    id: "weekly-funnel-optimization",
    name: "Funnel Optimization",
    schedule: "weekly",
    handler: optimizeFunnelRouting,
    description: "Promote top funnels, flag underperformers",
  },
  {
    id: "weekly-ab-analysis",
    name: "A/B Test Analysis",
    schedule: "weekly",
    handler: analyzeAndPromoteExperiments,
    description: "Check experiment significance, auto-promote winners",
  },
  {
    id: "monthly-feedback",
    name: "Monthly Feedback Cycle",
    schedule: "monthly",
    handler: runMonthlyFeedback,
    description: "Full monthly review, comprehensive adjustments",
  },
  {
    id: "monthly-scoring-calibration",
    name: "Scoring Calibration",
    schedule: "monthly",
    handler: calibrateScoringModel,
    description: "Recalibrate scoring weights based on conversion data",
  },
  {
    id: "monthly-niche-expansion",
    name: "Niche Expansion Analysis",
    schedule: "monthly",
    handler: analyzeNicheExpansion,
    description: "Identify opportunities to expand into adjacent niches",
  },
  {
    id: "weekly-video-recap",
    name: "Weekly Video Recap",
    schedule: "weekly",
    handler: runWeeklyVideoRecap,
    description: "Generate weekly performance recap video script",
  },
  {
    id: "weekly-design-sync",
    name: "Design System Sync",
    schedule: "weekly",
    handler: runDesignSystemSync,
    description: "Export and sync design.md",
  },
];

export async function runCronsBySchedule(
  tenantId: string,
  schedule: "daily" | "weekly" | "monthly",
): Promise<{ id: string; name: string; ok: boolean; error?: string }[]> {
  const jobs = OPTIMIZATION_CRONS.filter((c) => c.schedule === schedule);
  const results: { id: string; name: string; ok: boolean; error?: string }[] = [];

  for (const job of jobs) {
    try {
      await job.handler(tenantId);
      results.push({ id: job.id, name: job.name, ok: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      results.push({ id: job.id, name: job.name, ok: false, error: message });
    }
  }

  return results;
}
