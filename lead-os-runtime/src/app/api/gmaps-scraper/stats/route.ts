import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { getScrapeStats } from "@/lib/integrations/gmaps-scraper-adapter";

export const dynamic = "force-dynamic";

/**
 * GET /api/gmaps-scraper/stats
 *
 * Returns usage statistics for Google Maps scraping activity.
 */
export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const auth = await requireOperatorApiSession(request);
  if (auth.response) {
    return auth.response;
  }

  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId") ?? undefined;

    const stats = getScrapeStats(tenantId);

    return NextResponse.json(
      {
        data: stats,
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
          code: "STATS_FAILED",
          message: err instanceof Error ? err.message : "Failed to compute scrape stats",
        },
        meta: null,
      },
      { status: 500, headers },
    );
  }
}
