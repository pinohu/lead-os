import { NextResponse } from "next/server";
import { evaluateDueJobs } from "@/lib/gbp-sync-scheduler";
import { requireCronAuthOrFail } from "@/lib/api/cron-public-guards";

export const dynamic = "force-dynamic";

/**
 * GET /api/gbp-sync/due
 *
 * Returns sync jobs whose nextRunAt <= now, enabled=true, and status != "running".
 * Authenticated via CRON_SECRET bearer token for use by external cron triggers.
 */
export async function GET(request: Request) {
  const authFailure = requireCronAuthOrFail(request);
  if (authFailure) return authFailure;

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
