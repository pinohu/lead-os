// ── Rate Limit Cleanup Cron ────────────────────────────────────────────
// Runs every 6 hours. Deletes expired rate limit entries (older than 24h)
// to prevent the rate_limit_entries table from growing unbounded.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { requireCronAuth } from "@/lib/cron-auth";

export async function GET(req: NextRequest) {
  const unauthorized = requireCronAuth(req);
  if (unauthorized) return unauthorized;

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  try {
    const result = await prisma.rateLimitEntry.deleteMany({
      where: {
        createdAt: { lt: twentyFourHoursAgo },
      },
    });

    logger.info("cron/cleanup", `Deleted ${result.count} expired rate limit entries`);

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
    });
  } catch (err) {
    logger.error("cron/cleanup", "Error:", err);
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
  }
}
