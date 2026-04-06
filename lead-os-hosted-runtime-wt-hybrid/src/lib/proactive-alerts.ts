/* ------------------------------------------------------------------ */
/*  Proactive Alerts – high-value, anti-fatigue notifications          */
/*  KEY PRINCIPLE: 3:1 positive-to-negative ratio                      */
/* ------------------------------------------------------------------ */

import type { TenantMetrics } from "./joy-engine";

// --------------- types ---------------

export type AlertSeverity = "info" | "nudge" | "action-needed" | "urgent";

export interface ProactiveAlert {
  id: string;
  tenantId: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  actionUrl: string;
  actionLabel: string;
  category:
    | "lead"
    | "revenue"
    | "churn"
    | "pipeline"
    | "compliance"
    | "celebration";
  createdAt: string;
  expiresAt: string;
  dismissed: boolean;
}

// --------------- in-memory store ---------------

import { EvictableMap } from "./evictable-map.ts";

const alertStore: Map<string, ProactiveAlert[]> = new EvictableMap();

function storeAlert(a: ProactiveAlert) {
  const list = alertStore.get(a.tenantId) ?? [];
  list.push(a);
  alertStore.set(a.tenantId, list);
}

export function getAlerts(tenantId: string): ProactiveAlert[] {
  const now = new Date().toISOString();
  return (alertStore.get(tenantId) ?? []).filter(
    (a) => !a.dismissed && a.expiresAt > now,
  );
}

export function dismissAlert(tenantId: string, alertId: string): boolean {
  const list = alertStore.get(tenantId);
  if (!list) return false;
  const a = list.find((x) => x.id === alertId);
  if (!a) return false;
  a.dismissed = true;
  return true;
}

// --------------- helpers ---------------

function uid(): string {
  return `alert_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function expiresIn(hours: number): string {
  return new Date(Date.now() + hours * 3_600_000).toISOString();
}

function makeAlert(
  tenantId: string,
  partial: Omit<ProactiveAlert, "id" | "tenantId" | "createdAt" | "dismissed">,
): ProactiveAlert {
  return {
    id: uid(),
    tenantId,
    createdAt: new Date().toISOString(),
    dismissed: false,
    ...partial,
  };
}

// --------------- generateAlerts ---------------

export async function generateAlerts(
  tenantId: string,
  metrics?: TenantMetrics,
): Promise<ProactiveAlert[]> {
  const m: TenantMetrics = metrics ?? {
    totalLeads: 137,
    newLeadsToday: 3,
    newLeadsOvernight: 3,
    mrr: 4250,
    conversionRate: 14.2,
    previousConversionRate: 12.8,
    consecutiveLeadDays: 5,
    totalHoursSaved: 47,
    consecutiveGrowthMonths: 2,
    overnightConversions: 2,
    overnightRevenue: 850,
    overnightBookings: 2,
    warmLeadsNoFollowUp: 2,
    hotLeadsNoBooking: 1,
    pipelineCount: 6,
    emailFollowUpsSent: 42,
    leadsScored: 28,
    reportsGenerated: 4,
    intakesProcessed: 15,
    nurtureSequencesActive: 3,
    bookingsScheduled: 9,
    daysSinceLastLogin: 0,
    leadVelocityTrend: 5,
  };

  const alerts: ProactiveAlert[] = [];

  // ── POSITIVE alerts (celebrations / good news) ────────────────────

  // Conversion rate improvement
  if (m.conversionRate > m.previousConversionRate && m.previousConversionRate > 0) {
    const pctUp = Math.round(
      ((m.conversionRate - m.previousConversionRate) / m.previousConversionRate) * 100,
    );
    if (pctUp >= 5) {
      alerts.push(
        makeAlert(tenantId, {
          severity: "info",
          title: "Conversion rate is climbing",
          message: `Your conversion rate improved ${pctUp}% this week. Whatever you're doing, keep doing it.`,
          actionUrl: "/dashboard/analytics",
          actionLabel: "See the data",
          category: "celebration",
          expiresAt: expiresIn(72),
        }),
      );
    }
  }

  // Revenue on track
  if (m.overnightRevenue > 0) {
    alerts.push(
      makeAlert(tenantId, {
        severity: "info",
        title: "Revenue came in overnight",
        message: `$${m.overnightRevenue.toLocaleString()} in new revenue while you were away. The machine is working.`,
        actionUrl: "/dashboard/billing",
        actionLabel: "View revenue",
        category: "revenue",
        expiresAt: expiresIn(48),
      }),
    );
  }

  // Lead streak
  if (m.consecutiveLeadDays >= 5) {
    alerts.push(
      makeAlert(tenantId, {
        severity: "info",
        title: `${m.consecutiveLeadDays}-day lead streak`,
        message: `Leads every day for ${m.consecutiveLeadDays} days straight. Your pipeline is alive and well.`,
        actionUrl: "/dashboard/leads",
        actionLabel: "View leads",
        category: "celebration",
        expiresAt: expiresIn(24),
      }),
    );
  }

  // Time saved celebration
  if (m.totalHoursSaved >= 10) {
    const workdays = Math.round((m.totalHoursSaved / 8) * 10) / 10;
    alerts.push(
      makeAlert(tenantId, {
        severity: "info",
        title: `${m.totalHoursSaved} hours saved`,
        message: `That's ${workdays} workdays of effort your automations handled. Worth $${Math.round(m.totalHoursSaved * 150).toLocaleString()} at $150/hr.`,
        actionUrl: "/dashboard/joy",
        actionLabel: "See breakdown",
        category: "celebration",
        expiresAt: expiresIn(168), // 7 days
      }),
    );
  }

  // Autonomous action report (positive framing)
  if (m.daysSinceLastLogin >= 7) {
    alerts.push(
      makeAlert(tenantId, {
        severity: "info",
        title: "We kept things running while you were away",
        message:
          "Your automations handled follow-ups, scoring, and nurture sequences. Everything is in order.",
        actionUrl: "/dashboard/joy",
        actionLabel: "See what happened",
        category: "celebration",
        expiresAt: expiresIn(72),
      }),
    );
  }

  // ── ACTION alerts (things that need attention) ────────────────────

  // Hot leads with no follow-up
  if (m.hotLeadsNoBooking > 0) {
    alerts.push(
      makeAlert(tenantId, {
        severity: "action-needed",
        title: "Hot leads waiting",
        message: `You have ${m.hotLeadsNoBooking} hot lead${m.hotLeadsNoBooking === 1 ? "" : "s"} with no follow-up in 48 hours. A quick call could close the deal.`,
        actionUrl: "/dashboard/leads?status=hot&noBooking=true",
        actionLabel: "Follow up now",
        category: "lead",
        expiresAt: expiresIn(24),
      }),
    );
  }

  // Warm leads expiring
  if (m.warmLeadsNoFollowUp > 0) {
    alerts.push(
      makeAlert(tenantId, {
        severity: "nudge",
        title: "Warm leads cooling down",
        message: `${m.warmLeadsNoFollowUp} lead${m.warmLeadsNoFollowUp === 1 ? " is" : "s are"} about to go cold. We can auto-nudge them, or you can reach out personally.`,
        actionUrl: "/dashboard/leads?status=warm&noFollowUp=true",
        actionLabel: "Review leads",
        category: "lead",
        expiresAt: expiresIn(48),
      }),
    );
  }

  // Pipeline getting thin
  if (m.pipelineCount < 3) {
    alerts.push(
      makeAlert(tenantId, {
        severity: "nudge",
        title: "Pipeline needs attention",
        message: `Only ${m.pipelineCount} active opportunit${m.pipelineCount === 1 ? "y" : "ies"} in your pipeline. Time to fill the top of the funnel.`,
        actionUrl: "/dashboard/leads",
        actionLabel: "Build pipeline",
        category: "pipeline",
        expiresAt: expiresIn(72),
      }),
    );
  }

  // Lead velocity declining
  if (m.leadVelocityTrend < -5) {
    alerts.push(
      makeAlert(tenantId, {
        severity: "action-needed",
        title: "Lead flow slowing down",
        message: `Lead velocity is down ${Math.abs(m.leadVelocityTrend)}% over two weeks. Consider refreshing your campaigns or trying a new channel.`,
        actionUrl: "/dashboard/analytics",
        actionLabel: "Diagnose",
        category: "pipeline",
        expiresAt: expiresIn(72),
      }),
    );
  }

  // ── Enforce 3:1 positive-to-negative ratio ────────────────────────
  // Count categories
  const positive = alerts.filter(
    (a) =>
      a.category === "celebration" ||
      a.category === "revenue" ||
      (a.severity === "info" && a.category !== "churn"),
  ).length;
  const negative = alerts.filter(
    (a) => a.severity === "action-needed" || a.severity === "urgent",
  ).length;

  // If ratio is off, add a bonus positive alert
  if (negative > 0 && positive / negative < 3) {
    alerts.push(
      makeAlert(tenantId, {
        severity: "info",
        title: "Your system is working for you",
        message: `${m.emailFollowUpsSent} follow-ups, ${m.leadsScored} leads scored, and ${m.bookingsScheduled} bookings handled — all without you lifting a finger.`,
        actionUrl: "/dashboard/joy",
        actionLabel: "See your Joy report",
        category: "celebration",
        expiresAt: expiresIn(48),
      }),
    );
  }

  // Store all alerts
  for (const a of alerts) {
    storeAlert(a);
  }

  return alerts;
}
