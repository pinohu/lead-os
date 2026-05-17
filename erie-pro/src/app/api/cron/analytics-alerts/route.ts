// ── /api/cron/analytics-alerts ──────────────────────────────────────
// Runs daily (configured in vercel.json). Evaluates current analytics
// against thresholds and posts any new alerts to Slack.
//
// Auth: requires CRON_SECRET in Authorization header.
// Slack: requires SLACK_ALERTS_WEBHOOK_URL. Without it, alerts are
//        logged but not posted (safe-by-default for non-prod).

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computeIntakeAnalytics } from "@/lib/intake/analytics";
import {
  computeSlaAnalytics,
  type LeadAnalyticsRow,
} from "@/lib/leads/sla-analytics";
import { computeExperimentAnalytics } from "@/lib/experiments/analytics";
import { EXPERIMENTS } from "@/lib/experiments/registry";
import { loadExperimentData } from "@/lib/experiments/runtime";
import { evaluateAllAlerts } from "@/lib/alerts/thresholds";
import { postAlertsToSlack } from "@/lib/alerts/slack";
import { cityConfig } from "@/lib/city-config";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 }
    );
  }
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Look at the last 24 hours for intake/SLA (fast-changing) and the
  // last 30 days for experiments (significance needs sample).
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last30d = new Date(now.getTime() - 30 * 86400000);

  try {
    // ── Intake analytics (last 24h) ─────────────────────────────
    const intakeRows = await prisma.intakeConversation.findMany({
      where: {
        variant: "intake",
        createdAt: { gte: last24h, lte: now },
      },
      select: {
        id: true,
        startedFromNicheSlug: true,
        currentStep: true,
        outcomeStatus: true,
        outcome: true,
        messages: true,
        leadId: true,
        createdAt: true,
        updatedAt: true,
      },
      take: 5000,
    });
    const intakeAnalytics = computeIntakeAnalytics(intakeRows, last24h, now);

    // ── SLA analytics (last 24h) ────────────────────────────────
    const rawLeads = await prisma.lead.findMany({
      where: { createdAt: { gte: last24h, lte: now } },
      select: {
        id: true,
        niche: true,
        city: true,
        routedToId: true,
        slaDeadline: true,
        createdAt: true,
        routedTo: { select: { businessName: true } },
        outcomes: {
          select: {
            outcome: true,
            responseTimeSeconds: true,
            createdAt: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
      take: 1000,
    });
    const slaRows: LeadAnalyticsRow[] = rawLeads.map((l) => ({
      id: l.id,
      niche: l.niche,
      city: l.city,
      routedToId: l.routedToId,
      routedToName: l.routedTo?.businessName ?? null,
      slaDeadline: l.slaDeadline,
      createdAt: l.createdAt,
      outcomes: l.outcomes.map((o) => ({
        outcome: o.outcome as "responded" | "converted" | "no_response" | "declined" | "cancelled",
        responseTimeSeconds: o.responseTimeSeconds,
        createdAt: o.createdAt,
      })),
    }));
    const slaAnalytics = computeSlaAnalytics(slaRows, last24h, now);

    // ── Experiments (last 30d) ──────────────────────────────────
    const experimentAnalytics = await Promise.all(
      EXPERIMENTS.map(async (exp) => {
        const data = await loadExperimentData(exp.key, last30d, now);
        return computeExperimentAnalytics(exp, data.exposures, data.conversions);
      })
    );

    // ── Evaluate + post ─────────────────────────────────────────
    const alerts = evaluateAllAlerts(intakeAnalytics, slaAnalytics, experimentAnalytics);
    const postResult = await postAlertsToSlack(alerts, cityConfig.domain);

    logger.info(
      "cron/analytics-alerts",
      `Evaluated ${alerts.length} alerts; posted=${postResult.posted}, deduped=${postResult.deduped}, failed=${postResult.failed}`
    );

    return NextResponse.json({
      evaluatedAt: now.toISOString(),
      alertCount: alerts.length,
      alertKeys: alerts.map((a) => a.key),
      posted: postResult.posted,
      deduped: postResult.deduped,
      failed: postResult.failed,
    });
  } catch (err) {
    logger.error(
      "cron/analytics-alerts",
      `Fatal: ${err instanceof Error ? err.message : err}`
    );
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}
