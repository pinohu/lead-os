import { NextResponse } from "next/server";
import { evaluateDueJobs } from "@/lib/gbp-sync-scheduler";

export const dynamic = "force-dynamic";

/**
 * GET /api/gbp-sync/due
 *
 * Returns sync jobs whose nextRunAt <= now, enabled=true, and status != "running".
 * Authenticated via CRON_SECRET bearer token for use by external cron triggers.
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json(
      { data: null, error: { code: "NOT_CONFIGURED", message: "Cron not configured" }, meta: null },
      { status: 503 },
    );
  }

  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { data: null, error: { code: "UNAUTHORIZED", message: "Unauthorized" }, meta: null },
      { status: 401 },
    );
  }

  try {
    const dueJobs = evaluateDueJobs();

    return NextResponse.json(
      { data: dueJobs, error: null, meta: { count: dueJobs.length } },
    );
  } catch (err) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "EVALUATE_FAILED",
          message: err instanceof Error ? err.message : "Failed to evaluate due jobs",
        },
        meta: null,
      },
      { status: 500 },
    );
  }
}
