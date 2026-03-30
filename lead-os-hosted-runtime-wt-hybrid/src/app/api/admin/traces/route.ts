import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import { getRecentTraces, getTracesByTenant, getTraceSummary } from "@/lib/request-tracer";

export async function GET(request: Request) {
  const { context, response } = await requireAuth(request, "read:analytics");
  if (response) return response;

  const url = new URL(request.url);
  const summary = url.searchParams.get("summary") === "true";
  const tenantId = url.searchParams.get("tenantId") ?? context?.tenantId;
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 100), 500);

  if (summary) {
    return NextResponse.json({ data: getTraceSummary(), error: null, meta: null });
  }

  const traces = tenantId ? getTracesByTenant(tenantId, limit) : getRecentTraces(limit);

  return NextResponse.json({
    data: traces,
    error: null,
    meta: { count: traces.length, limit },
  });
}
