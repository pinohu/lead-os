import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { collectPerformanceMetrics, generateInsights } from "@/lib/feedback-engine";
import { tenantConfig } from "@/lib/tenant";

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId") ?? tenantConfig.tenantId;
    const since = url.searchParams.get("since") ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const until = url.searchParams.get("until") ?? new Date().toISOString();

    const metrics = await collectPerformanceMetrics(tenantId, since, until);
    const insights = generateInsights(metrics);

    return NextResponse.json(
      { data: insights, error: null, meta: { count: insights.length, since, until } },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "INSIGHTS_FAILED", message: "Failed to generate insights" }, meta: null },
      { status: 500, headers },
    );
  }
}
