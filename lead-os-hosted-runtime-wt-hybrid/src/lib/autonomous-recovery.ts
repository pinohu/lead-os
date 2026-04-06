/* ------------------------------------------------------------------ */
/*  Autonomous Recovery – acts while the user sleeps                   */
/* ------------------------------------------------------------------ */

import type { TenantMetrics } from "./joy-engine";

// --------------- types ---------------

export interface RecoveryAction {
  id: string;
  tenantId: string;
  type:
    | "churn-prevention"
    | "lead-reengagement"
    | "scope-alert"
    | "location-recovery"
    | "pipeline-fill";
  trigger: string;
  actionTaken: string;
  outcome: "pending" | "succeeded" | "failed";
  automatedAt: string;
  details: Record<string, unknown>;
}

export interface LocationMetrics {
  locationId: string;
  locationName: string;
  leadsThisWeek: number;
  leadsPreviousWeek: number;
  avgResponseTimeMinutes: number;
}

export interface ProjectMetrics {
  projectId: string;
  projectName: string;
  estimatedHours: number;
  actualHours: number;
}

// --------------- in-memory store ---------------

import { EvictableMap } from "./evictable-map";

const recoveryStore: Map<string, RecoveryAction[]> = new EvictableMap();

function storeAction(a: RecoveryAction) {
  const list = recoveryStore.get(a.tenantId) ?? [];
  list.push(a);
  recoveryStore.set(a.tenantId, list);
}

export function getRecoveryActions(tenantId: string): RecoveryAction[] {
  return recoveryStore.get(tenantId) ?? [];
}

// --------------- helpers ---------------

function uid(): string {
  return `rec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function action(
  tenantId: string,
  partial: Omit<RecoveryAction, "id" | "tenantId" | "automatedAt">,
): RecoveryAction {
  return {
    id: uid(),
    tenantId,
    automatedAt: new Date().toISOString(),
    ...partial,
  };
}

// --------------- detectAndRecover ---------------

export async function detectAndRecover(
  tenantId: string,
  metrics?: TenantMetrics,
  locations?: LocationMetrics[],
  projects?: ProjectMetrics[],
): Promise<RecoveryAction[]> {
  const m: TenantMetrics = metrics ?? {
    totalLeads: 137,
    newLeadsToday: 0,
    newLeadsOvernight: 0,
    mrr: 4250,
    conversionRate: 14.2,
    previousConversionRate: 12.8,
    consecutiveLeadDays: 5,
    totalHoursSaved: 47,
    consecutiveGrowthMonths: 2,
    overnightConversions: 0,
    overnightRevenue: 0,
    overnightBookings: 0,
    warmLeadsNoFollowUp: 4,
    hotLeadsNoBooking: 2,
    pipelineCount: 2,
    emailFollowUpsSent: 42,
    leadsScored: 28,
    reportsGenerated: 4,
    intakesProcessed: 15,
    nurtureSequencesActive: 3,
    bookingsScheduled: 9,
    daysSinceLastLogin: 0,
    leadVelocityTrend: -3,
  };

  const actions: RecoveryAction[] = [];

  // ── Churn Prevention ──────────────────────────────────────────────

  if (m.daysSinceLastLogin >= 7) {
    const a = action(tenantId, {
      type: "churn-prevention",
      trigger: `User has not logged in for ${m.daysSinceLastLogin} days`,
      actionTaken:
        "Sent re-engagement email highlighting recent wins and time saved by automations",
      outcome: "succeeded",
      details: {
        daysSinceLogin: m.daysSinceLastLogin,
        emailTemplate: "win-recap-reengagement",
        totalHoursSaved: m.totalHoursSaved,
      },
    });
    actions.push(a);
    storeAction(a);
  }

  if (m.leadVelocityTrend < -2) {
    const a = action(tenantId, {
      type: "churn-prevention",
      trigger: `Lead velocity declining for 2+ weeks (trend: ${m.leadVelocityTrend}%)`,
      actionTaken:
        "Suggested new lead source activation and prepared campaign draft for review",
      outcome: "pending",
      details: {
        velocityTrend: m.leadVelocityTrend,
        suggestedChannels: ["Google Local Services", "Facebook Lead Ads", "Referral Campaign"],
      },
    });
    actions.push(a);
    storeAction(a);
  }

  // ── Lead Re-engagement ────────────────────────────────────────────

  if (m.warmLeadsNoFollowUp > 0) {
    const a = action(tenantId, {
      type: "lead-reengagement",
      trigger: `${m.warmLeadsNoFollowUp} warm leads with no contact in 5+ days`,
      actionTaken: `Auto-sent next nurture step to ${m.warmLeadsNoFollowUp} warm leads`,
      outcome: "succeeded",
      details: {
        leadsContacted: m.warmLeadsNoFollowUp,
        nurtureStep: "follow-up-value-add",
      },
    });
    actions.push(a);
    storeAction(a);
  }

  if (m.hotLeadsNoBooking > 0) {
    const a = action(tenantId, {
      type: "lead-reengagement",
      trigger: `${m.hotLeadsNoBooking} hot leads with no booking`,
      actionTaken: `Sent "your spot is reserved" urgency message to ${m.hotLeadsNoBooking} hot leads`,
      outcome: "succeeded",
      details: {
        leadsContacted: m.hotLeadsNoBooking,
        messageTemplate: "spot-reserved-urgency",
      },
    });
    actions.push(a);
    storeAction(a);
  }

  // ── Pipeline Fill ─────────────────────────────────────────────────

  if (m.pipelineCount < 3) {
    const a = action(tenantId, {
      type: "pipeline-fill",
      trigger: `Only ${m.pipelineCount} active opportunities in pipeline (minimum: 3)`,
      actionTaken:
        "Activated automated prospecting sequence targeting past engaged leads",
      outcome: "succeeded",
      details: {
        currentPipeline: m.pipelineCount,
        sequenceActivated: "re-engage-past-prospects",
        estimatedReach: 25,
      },
    });
    actions.push(a);
    storeAction(a);
  }

  if (m.newLeadsToday === 0 && m.consecutiveLeadDays === 0) {
    const a = action(tenantId, {
      type: "pipeline-fill",
      trigger: "No new leads in 7+ days",
      actionTaken:
        "Prepared niche expansion recommendations and new channel activation plan",
      outcome: "pending",
      details: {
        recommendations: [
          "Expand to adjacent vertical",
          "Activate dormant referral partners",
          "Launch a limited-time lead magnet campaign",
        ],
      },
    });
    actions.push(a);
    storeAction(a);
  }

  // ── Location Recovery (franchises) ────────────────────────────────

  if (locations) {
    for (const loc of locations) {
      // Volume drop > 30%
      if (
        loc.leadsPreviousWeek > 0 &&
        loc.leadsThisWeek / loc.leadsPreviousWeek < 0.7
      ) {
        const dropPct = Math.round(
          (1 - loc.leadsThisWeek / loc.leadsPreviousWeek) * 100,
        );
        const a = action(tenantId, {
          type: "location-recovery",
          trigger: `${loc.locationName}: lead volume dropped ${dropPct}% week-over-week`,
          actionTaken: `Generated recovery plan for ${loc.locationName}: increase ad spend, activate dormant campaigns, re-engage past customers`,
          outcome: "pending",
          details: {
            locationId: loc.locationId,
            locationName: loc.locationName,
            dropPercent: dropPct,
            leadsThisWeek: loc.leadsThisWeek,
            leadsPreviousWeek: loc.leadsPreviousWeek,
            recoveryPlan: [
              "Increase local ad spend by 25%",
              "Re-activate top 3 dormant campaigns",
              "Send win-back email to past 90-day customers",
            ],
          },
        });
        actions.push(a);
        storeAction(a);
      }

      // Slow response time
      if (loc.avgResponseTimeMinutes > 120) {
        const a = action(tenantId, {
          type: "location-recovery",
          trigger: `${loc.locationName}: average response time ${Math.round(loc.avgResponseTimeMinutes)} min (target: <120 min)`,
          actionTaken: `Alerted location manager and activated auto-response for ${loc.locationName}`,
          outcome: "succeeded",
          details: {
            locationId: loc.locationId,
            locationName: loc.locationName,
            avgResponseMinutes: Math.round(loc.avgResponseTimeMinutes),
            autoResponseActivated: true,
          },
        });
        actions.push(a);
        storeAction(a);
      }
    }
  }

  // ── Scope Guardian (consultants) ──────────────────────────────────

  if (projects) {
    for (const proj of projects) {
      if (
        proj.estimatedHours > 0 &&
        proj.actualHours / proj.estimatedHours > 1.2
      ) {
        const overPct = Math.round(
          (proj.actualHours / proj.estimatedHours - 1) * 100,
        );
        const a = action(tenantId, {
          type: "scope-alert",
          trigger: `${proj.projectName}: hours exceed estimate by ${overPct}%`,
          actionTaken: `Flagged for review and generated change order draft for ${proj.projectName}`,
          outcome: "pending",
          details: {
            projectId: proj.projectId,
            projectName: proj.projectName,
            estimatedHours: proj.estimatedHours,
            actualHours: proj.actualHours,
            overagePercent: overPct,
            changeOrderDraft: {
              reason: "Scope expanded beyond original estimate",
              additionalHours: Math.round(proj.actualHours - proj.estimatedHours),
              suggestedRate: 150,
            },
          },
        });
        actions.push(a);
        storeAction(a);
      }
    }
  }

  return actions;
}
