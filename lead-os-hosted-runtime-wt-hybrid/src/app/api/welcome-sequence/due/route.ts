import { NextResponse } from "next/server";
import { processWelcomeSequenceDue } from "@/lib/welcome-sequence";
import { requireCronAuthOrFail } from "@/lib/api/cron-public-guards";

export const dynamic = "force-dynamic";

/**
 * GET /api/welcome-sequence/due
 *
 * Processes all welcome sequences whose nextStepDue <= now.
 * Authenticated via CRON_SECRET bearer token for use by external cron triggers.
 */
export async function GET(request: Request) {
  const authFailure = requireCronAuthOrFail(request);
  if (authFailure) return authFailure;

  try {
    const result = await processWelcomeSequenceDue();

    return NextResponse.json(
      {
        data: result,
        error: null,
        meta: {
          processed: result.processed,
          skipped: result.skipped,
          errors: result.errors,
        },
      },
    );
  } catch (err) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "PROCESS_FAILED",
          message: err instanceof Error ? err.message : "Failed to process due sequences",
        },
        meta: null,
      },
      { status: 500 },
    );
  }
}
