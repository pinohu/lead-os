// ── Rate Limit Cleanup Cron ────────────────────────────────────────────
// Runs every 6 hours. Deletes expired rate limit entries (older than 24h)
// to prevent the rate_limit_entries table from growing unbounded.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  // Validate CRON_SECRET
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  }
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
