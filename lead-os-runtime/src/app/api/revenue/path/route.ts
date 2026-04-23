import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import {
  definePrimaryRevenuePath,
  getRevenuePathMetrics,
  identifyRevenueLeaks,
} from "@/lib/revenue-engine";

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId");
    const niche = url.searchParams.get("niche");

    if (!tenantId) {
      return NextResponse.json(
        {
          data: null,
          error: { code: "VALIDATION_ERROR", message: "tenantId query parameter is required" },
          meta: null,
        },
        { status: 400, headers },
      );
    }

    const nicheSlug = niche ?? "general";
    const path = definePrimaryRevenuePath(nicheSlug);
    const metrics = await getRevenuePathMetrics(tenantId);
    const leaks = identifyRevenueLeaks(metrics);

    return NextResponse.json(
      {
        data: { path, metrics, leaks },
        error: null,
        meta: { tenantId, niche: nicheSlug, leakCount: leaks.length },
      },
      { status: 200, headers },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      {
        data: null,
        error: { code: "INTERNAL_ERROR", message },
        meta: null,
      },
      { status: 500, headers },
    );
  }
}
