import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { getIngressAnalytics } from "@/lib/ingress-engine";
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
    const since = url.searchParams.get("since") ?? undefined;

    const analytics = await getIngressAnalytics(tenantId, since);

    return NextResponse.json(
      { data: analytics, error: null, meta: { count: analytics.length } },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "ANALYTICS_FAILED", message: "Failed to fetch ingress analytics" }, meta: null },
      { status: 500, headers },
    );
  }
}
