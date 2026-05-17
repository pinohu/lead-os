// ── GET /api/admin/analytics/intake ─────────────────────────────────
// JSON version of /admin/intake-analytics. Supports two auth modes:
//   1. Admin session cookie (same as dashboard pages)
//   2. CRON_SECRET bearer token (for scheduled jobs like analytics-alerts)
//
// Query params:
//   ?days=N  (1..365, default 30)

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { computeIntakeAnalytics } from "@/lib/intake/analytics";

export const dynamic = "force-dynamic";

function isAuthorized(req: NextRequest, role?: string): boolean {
  // Admin session?
  if (role === "admin") return true;
  // Cron bearer?
  const auth = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && auth === `Bearer ${cronSecret}`) return true;
  return false;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!isAuthorized(req, role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const daysParam = parseInt(url.searchParams.get("days") ?? "30", 10);
  const days = Number.isFinite(daysParam) && daysParam > 0 && daysParam <= 365 ? daysParam : 30;

  const rangeEnd = new Date();
  const rangeStart = new Date(rangeEnd.getTime() - days * 86400000);

  const rows = await prisma.intakeConversation.findMany({
    where: {
      variant: "intake",
      createdAt: { gte: rangeStart, lte: rangeEnd },
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
    orderBy: { createdAt: "desc" },
    take: 5000,
  });

  const analytics = computeIntakeAnalytics(rows, rangeStart, rangeEnd);
  return NextResponse.json(analytics);
}
