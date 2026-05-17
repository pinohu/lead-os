// ── GET /api/admin/analytics/lead-sla ───────────────────────────────
// JSON version of /admin/lead-sla. Same auth pattern as the intake
// analytics endpoint: admin session OR CRON_SECRET bearer.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  computeSlaAnalytics,
  type LeadAnalyticsRow,
} from "@/lib/leads/sla-analytics";

export const dynamic = "force-dynamic";

function isAuthorized(req: NextRequest, role?: string): boolean {
  if (role === "admin") return true;
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

  const rawLeads = await prisma.lead.findMany({
    where: { createdAt: { gte: rangeStart, lte: rangeEnd } },
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
    orderBy: { createdAt: "desc" },
    take: 2000,
  });

  const rows: LeadAnalyticsRow[] = rawLeads.map((l) => ({
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

  const analytics = computeSlaAnalytics(rows, rangeStart, rangeEnd);
  return NextResponse.json(analytics);
}
