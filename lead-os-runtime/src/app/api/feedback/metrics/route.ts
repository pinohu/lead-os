import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { collectPerformanceMetrics } from "@/lib/feedback-engine";
import { tenantConfig } from "@/lib/tenant";

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId") ?? tenantConfig.tenantId;
    const since = url.searchParams.get("since") ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const until = url.searchParams.get("until") ?? new Date().toISOString();

    const metrics = await collectPerformanceMetrics(tenantId, since, until);

    return NextResponse.json(
      { data: metrics, error: null, meta: { since, until } },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "METRICS_FAILED", message: "Failed to collect performance metrics" }, meta: null },
      { status: 500, headers },
    );
  }
}
