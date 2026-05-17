// ── Analytics alert thresholds ───────────────────────────────────────
// Pure functions that evaluate analytics snapshots against configured
// thresholds. Returns alerts that should be posted to Slack/email.
// Side-effect-free; the dispatcher in slack.ts does the actual posting.

import type { IntakeAnalytics } from "@/lib/intake/analytics";
import type { SlaAnalytics } from "@/lib/leads/sla-analytics";
import type { ExperimentAnalytics } from "@/lib/experiments/analytics";

export type AlertSeverity = "info" | "warning" | "critical";

export interface Alert {
  /** Stable key for deduplication — same key in 24hr = don't re-post */
  key: string;
  severity: AlertSeverity;
  title: string;
  body: string;
  /** Free-form metadata for downstream formatting */
  context: Record<string, string | number | boolean>;
}

export interface Thresholds {
  /** Minimum intake completion rate before warning fires */
  intakeMinConversionRate: number;
  /** Number of orphan-completed conversations that triggers a warning */
  intakeOrphanCompletedMax: number;
  /** Number of SLA-expired leads in the period that triggers a warning */
  slaExpiredMax: number;
  /** Number of exhausted leads (no taker after failover) that triggers critical */
  slaExhaustedMax: number;
  /** Minimum exposures before a significant experiment winner alert is posted */
  experimentMinExposures: number;
}

export const DEFAULT_THRESHOLDS: Thresholds = {
  intakeMinConversionRate: 0.20, // 20%; alert if drops below
  intakeOrphanCompletedMax: 0,   // ANY orphan-completed is suspicious
  slaExpiredMax: 5,
  slaExhaustedMax: 1,
  experimentMinExposures: 200,   // need real signal before alerting on winners
};

// ── Evaluators ───────────────────────────────────────────────────────

export function evaluateIntakeAlerts(
  intake: IntakeAnalytics,
  thresholds: Thresholds = DEFAULT_THRESHOLDS
): Alert[] {
  const alerts: Alert[] = [];

  // Conversion rate dropped below threshold (only meaningful with a real sample)
  if (
    intake.totals.conversations >= 30 &&
    intake.totals.completed / Math.max(1, intake.totals.conversations) < thresholds.intakeMinConversionRate
  ) {
    const rate = intake.totals.completed / Math.max(1, intake.totals.conversations);
    alerts.push({
      key: `intake_low_conversion_${intake.range.days}d`,
      severity: "warning",
      title: `Intake conversion rate dropped to ${(rate * 100).toFixed(1)}%`,
      body:
        `Over the last ${intake.range.days} days, ${intake.totals.completed} of ` +
        `${intake.totals.conversations} conversations completed (${(rate * 100).toFixed(1)}%). ` +
        `Threshold is ${(thresholds.intakeMinConversionRate * 100).toFixed(0)}%. ` +
        `Check the funnel at /admin/intake-analytics — the biggest drop-off step is probably the issue.`,
      context: {
        conversionRate: rate,
        threshold: thresholds.intakeMinConversionRate,
        days: intake.range.days,
        completed: intake.totals.completed,
        total: intake.totals.conversations,
      },
    });
  }

  // Orphan-completed: completed conversations without a leadId. Always
  // worth investigating because it means lead-creation silently failed.
  if (intake.orphanCompleted > thresholds.intakeOrphanCompletedMax) {
    alerts.push({
      key: `intake_orphan_completed_${intake.range.days}d`,
      severity: "critical",
      title: `${intake.orphanCompleted} orphan-completed conversation${intake.orphanCompleted === 1 ? "" : "s"}`,
      body:
        `${intake.orphanCompleted} intake conversation${intake.orphanCompleted === 1 ? " was" : "s were"} marked completed ` +
        `but no Lead row was created. This is a silent failure of the lead-creation pipeline. ` +
        `Check server logs for the affected timestamps.`,
      context: {
        orphanCompleted: intake.orphanCompleted,
        days: intake.range.days,
      },
    });
  }

  return alerts;
}

export function evaluateSlaAlerts(
  sla: SlaAnalytics,
  thresholds: Thresholds = DEFAULT_THRESHOLDS
): Alert[] {
  const alerts: Alert[] = [];

  if (sla.totals.expired > thresholds.slaExpiredMax) {
    alerts.push({
      key: `sla_expired_${sla.range.days}d`,
      severity: "warning",
      title: `${sla.totals.expired} leads expired without a provider response`,
      body:
        `Over the last ${sla.range.days} days, ${sla.totals.expired} leads passed their SLA ` +
        `without any provider responding. Threshold is ${thresholds.slaExpiredMax}. ` +
        `Check /admin/lead-sla for which providers are missing SLAs.`,
      context: {
        expired: sla.totals.expired,
        threshold: thresholds.slaExpiredMax,
        days: sla.range.days,
      },
    });
  }

  if (sla.totals.exhausted >= thresholds.slaExhaustedMax) {
    alerts.push({
      key: `sla_exhausted_${sla.range.days}d`,
      severity: "critical",
      title: `${sla.totals.exhausted} lead${sla.totals.exhausted === 1 ? "" : "s"} exhausted failover (no taker)`,
      body:
        `${sla.totals.exhausted} lead${sla.totals.exhausted === 1 ? " has" : "s have"} cycled through all ` +
        `failover attempts without a provider accepting. These need manual concierge follow-up.`,
      context: {
        exhausted: sla.totals.exhausted,
        days: sla.range.days,
      },
    });
  }

  return alerts;
}

export function evaluateExperimentAlerts(
  experiments: readonly ExperimentAnalytics[],
  thresholds: Thresholds = DEFAULT_THRESHOLDS
): Alert[] {
  const alerts: Alert[] = [];
  for (const exp of experiments) {
    // Only alert on experiments with meaningful sample size
    if (exp.totalExposures < thresholds.experimentMinExposures) continue;
    if (!exp.hasSignificantWinner || !exp.significantWinnerVariantKey) continue;

    const winner = exp.variants.find((v) => v.variantKey === exp.significantWinnerVariantKey);
    if (!winner || winner.liftVsControl == null) continue;

    const lift = winner.liftVsControl;
    const liftPct = (lift * 100).toFixed(1);
    alerts.push({
      key: `experiment_winner_${exp.experimentKey}_${exp.significantWinnerVariantKey}`,
      severity: "info",
      title: `Experiment "${exp.experimentKey}" has a significant winner`,
      body:
        `Variant "${exp.significantWinnerVariantKey}" is winning vs. control with ` +
        `${liftPct.startsWith("-") ? "" : "+"}${liftPct}% lift (p=${winner.pValueVsControl?.toFixed(3) ?? "—"}). ` +
        `${exp.totalExposures.toLocaleString()} total exposures. Consider rolling out.`,
      context: {
        experimentKey: exp.experimentKey,
        winnerVariant: exp.significantWinnerVariantKey,
        lift,
        pValue: winner.pValueVsControl ?? 0,
        totalExposures: exp.totalExposures,
      },
    });
  }
  return alerts;
}

/** Convenience: evaluate all sources, return combined sorted list. */
export function evaluateAllAlerts(
  intake: IntakeAnalytics | null,
  sla: SlaAnalytics | null,
  experiments: readonly ExperimentAnalytics[] | null,
  thresholds: Thresholds = DEFAULT_THRESHOLDS
): Alert[] {
  const alerts: Alert[] = [];
  if (intake) alerts.push(...evaluateIntakeAlerts(intake, thresholds));
  if (sla) alerts.push(...evaluateSlaAlerts(sla, thresholds));
  if (experiments) alerts.push(...evaluateExperimentAlerts(experiments, thresholds));

  // Sort: critical → warning → info
  const order: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 };
  return alerts.sort((a, b) => order[a.severity] - order[b.severity]);
}
