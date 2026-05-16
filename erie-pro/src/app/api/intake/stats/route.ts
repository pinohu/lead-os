// ── Intake Funnel Stats ───────────────────────────────────────────────
// GET /api/intake/stats — Admin-only endpoint that returns a funnel
// breakdown of intake conversations over the last 30 days. Used for
// ops and A/B test analysis.
//
// Auth: requires Bearer CRON_SECRET (admin tools share this token in this
// codebase; rotate to a dedicated admin token if/when one exists).

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const since = req.nextUrl.searchParams.get("since");
  const sinceDate = since
    ? new Date(since)
    : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // default: last 30 days

  if (isNaN(sinceDate.getTime())) {
    return NextResponse.json(
      { error: "Invalid 'since' parameter (expects ISO date)" },
      { status: 400 }
    );
  }

  try {
    // Status breakdown
    const byStatus = await prisma.intakeConversation.groupBy({
      by: ["outcomeStatus"],
      where: { createdAt: { gte: sinceDate } },
      _count: { _all: true },
    });

    // Step breakdown for in-progress (where do people abandon?)
    const byStep = await prisma.intakeConversation.groupBy({
      by: ["currentStep"],
      where: {
        createdAt: { gte: sinceDate },
        outcomeStatus: { in: ["in_progress", "abandoned"] },
      },
      _count: { _all: true },
    });

    // Top niches by conversation volume
    const byNiche = await prisma.intakeConversation.groupBy({
      by: ["startedFromNicheSlug"],
      where: { createdAt: { gte: sinceDate } },
      _count: { _all: true },
      orderBy: { _count: { id: "desc" } },
      take: 20,
    });

    // Conversion: % of started conversations that completed
    const totalStarted = byStatus.reduce((s, r) => s + r._count._all, 0);
    const completed =
      byStatus.find((r) => r.outcomeStatus === "completed")?._count._all ?? 0;
    const completionRate = totalStarted > 0 ? completed / totalStarted : 0;

    // Variant comparison (intake vs form, if any form-tracked rows exist)
    const byVariant = await prisma.intakeConversation.groupBy({
      by: ["variant", "outcomeStatus"],
      where: { createdAt: { gte: sinceDate } },
      _count: { _all: true },
    });

    return NextResponse.json({
      since: sinceDate.toISOString(),
      totalStarted,
      completed,
      completionRate: Math.round(completionRate * 1000) / 10, // % with one decimal
      byStatus: byStatus.map((r) => ({
        status: r.outcomeStatus,
        count: r._count._all,
      })),
      byStep: byStep.map((r) => ({
        step: r.currentStep,
        count: r._count._all,
      })),
      byNiche: byNiche.map((r) => ({
        niche: r.startedFromNicheSlug ?? "(homepage)",
        count: r._count._all,
      })),
      byVariant: byVariant.map((r) => ({
        variant: r.variant,
        status: r.outcomeStatus,
        count: r._count._all,
      })),
    });
  } catch (err) {
    logger.error(
      "intake.stats",
      "Failed",
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
