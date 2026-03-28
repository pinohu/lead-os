import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { getAnalyticsTimeSeries } from "@/lib/data-pipeline";

const VALID_GRANULARITIES = new Set(["day", "week", "month"]);

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId");
    if (!tenantId) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "tenantId is required" }, meta: null },
        { status: 400, headers },
      );
    }

    const since = url.searchParams.get("since") ?? new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
    const until = url.searchParams.get("until") ?? new Date().toISOString().slice(0, 10);
    const granularity = url.searchParams.get("granularity") ?? "day";

    if (!VALID_GRANULARITIES.has(granularity)) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: `granularity must be one of: ${[...VALID_GRANULARITIES].join(", ")}` }, meta: null },
        { status: 400, headers },
      );
    }

    const snapshots = await getAnalyticsTimeSeries(
      tenantId,
      since,
      until,
      granularity as "day" | "week" | "month",
    );

    return NextResponse.json(
      { data: snapshots, error: null, meta: { count: snapshots.length, since, until, granularity } },
      { headers },
    );
  } catch (err) {
    console.error("[analytics-snapshot]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to fetch analytics snapshots" }, meta: null },
      { status: 500, headers },
    );
  }
}
