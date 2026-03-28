import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { getPerformanceSummary, getPostsByPlatform } from "@/lib/social-performance-tracker";

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId");
    const platform = url.searchParams.get("platform") ?? undefined;

    if (!tenantId) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "tenantId query parameter is required" }, meta: null },
        { status: 400, headers },
      );
    }

    if (platform) {
      const posts = getPostsByPlatform(tenantId, platform);
      return NextResponse.json(
        {
          data: posts,
          error: null,
          meta: { tenantId, platform, postCount: posts.length },
        },
        { headers },
      );
    }

    const summary = getPerformanceSummary(tenantId);

    return NextResponse.json(
      {
        data: summary,
        error: null,
        meta: { tenantId },
      },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to fetch performance data" }, meta: null },
      { status: 500, headers },
    );
  }
}
