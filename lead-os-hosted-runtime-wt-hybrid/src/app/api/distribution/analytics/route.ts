import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { getDistributionReport, getTopPerformingContent } from "@/lib/distribution-engine";

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
    const tenantId = url.searchParams.get("tenantId");
    const period = url.searchParams.get("period") ?? "30d";
    const type = url.searchParams.get("type");

    if (!tenantId) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "tenantId is required" }, meta: null },
        { status: 400, headers },
      );
    }

    if (type === "top-content") {
      const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "10", 10), 100);
      const topContent = getTopPerformingContent(tenantId, limit);
      return NextResponse.json(
        { data: topContent, error: null, meta: { count: topContent.length, type: "top-content" } },
        { headers },
      );
    }

    const report = getDistributionReport(tenantId, period);
    return NextResponse.json(
      { data: report, error: null, meta: { period, channelCount: report.channels.length } },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to fetch distribution analytics" }, meta: null },
      { status: 500, headers },
    );
  }
}
