// ── Stale Lead Archival Cron ───────────────────────────────────────────
// Runs daily at 3 AM. Archives unmatched leads older than 60 days
// to keep the active lead pool clean and queries fast.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { requireCronAuth } from "@/lib/cron-auth";

export async function GET(req: NextRequest) {
  const unauthorized = requireCronAuth(req);
  if (unauthorized) return unauthorized;

  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

  try {
    // Archive unmatched leads older than 60 days by setting routeType
    // to a sentinel value. We reuse "overflow" as the closest available
    // enum — but tag them with a null routedToId to distinguish from
    // actual overflow assignments. The createdAt date acts as the
    // archival indicator (> 60 days old + overflow + no provider = archived).
    //
    // Note: If the schema adds an "archived" LeadRouteType enum value
    // in the future, update this to use it instead.
    const result = await prisma.lead.updateMany({
      where: {
        routeType: "unmatched",
        createdAt: { lt: sixtyDaysAgo },
      },
      data: {
        routeType: "overflow", // closest available enum; see note above
      },
    });

    logger.info("cron/archive-stale-leads", `Archived ${result.count} stale unmatched leads older than 60 days`);

    return NextResponse.json({
      success: true,
      archivedCount: result.count,
    });
  } catch (err) {
    logger.error("cron/archive-stale-leads", "Error:", err);
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
  }
}
