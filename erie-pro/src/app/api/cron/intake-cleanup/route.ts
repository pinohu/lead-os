// ── Intake Conversation Cleanup Cron ──────────────────────────────────
// Runs daily at 4 AM. Two passes:
//   1. Mark conversations stuck "in_progress" for >24h as "abandoned"
//      (preserves the data for funnel analysis but updates the status).
//   2. Hard-delete conversations older than 30 days that never produced a
//      Lead (preserves successful conversion records; only purges
//      abandoned/error rows).

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  try {
    // ── Pass 1: mark stale in-progress as abandoned ────────────────
    const abandoned = await prisma.intakeConversation.updateMany({
      where: {
        outcomeStatus: "in_progress",
        updatedAt: { lt: oneDayAgo },
      },
      data: { outcomeStatus: "abandoned" },
    });

    // ── Pass 2: hard-delete >30d old non-completed convos ─────────
    // Keep completed conversations (they're tied to Leads via leadId).
    const deleted = await prisma.intakeConversation.deleteMany({
      where: {
        outcomeStatus: { in: ["abandoned", "error"] },
        updatedAt: { lt: thirtyDaysAgo },
        leadId: null,
      },
    });

    logger.info(
      "cron/intake-cleanup",
      `marked ${abandoned.count} as abandoned; deleted ${deleted.count} old rows`
    );

    return NextResponse.json({
      success: true,
      markedAbandoned: abandoned.count,
      hardDeleted: deleted.count,
    });
  } catch (err) {
    logger.error(
      "cron/intake-cleanup",
      "Error",
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
  }
}
