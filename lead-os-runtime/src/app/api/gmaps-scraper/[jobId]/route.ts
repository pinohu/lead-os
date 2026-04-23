import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { getScrapeJob } from "@/lib/integrations/gmaps-scraper-adapter";

export const dynamic = "force-dynamic";

/**
 * GET /api/gmaps-scraper/[jobId]
 *
 * Returns the status and results of a specific scrape job.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const auth = await requireOperatorApiSession(request);
  if (auth.response) {
    return auth.response;
  }

  try {
    const { jobId } = await params;
    const job = getScrapeJob(jobId);

    if (!job) {
      return NextResponse.json(
        {
          data: null,
          error: { code: "NOT_FOUND", message: `Scrape job "${jobId}" not found` },
          meta: null,
        },
        { status: 404, headers },
      );
    }

    return NextResponse.json(
      {
        data: {
          id: job.id,
          query: job.query,
          status: job.status,
          result: job.result ?? null,
          tenantId: job.tenantId ?? null,
          createdAt: job.createdAt,
          completedAt: job.completedAt ?? null,
        },
        error: null,
        meta: null,
      },
      { headers },
    );
  } catch (err) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "FETCH_FAILED",
          message: err instanceof Error ? err.message : "Failed to get scrape job",
        },
        meta: null,
      },
      { status: 500, headers },
    );
  }
}
