import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { getFlowluStats } from "@/lib/integrations/flowlu-adapter";

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId") ?? undefined;

    const stats = await getFlowluStats(tenantId);

    return NextResponse.json(
      { data: stats, error: null, meta: null },
      { headers },
    );
  } catch (err) {
    console.error("[flowlu/stats GET]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "STATS_FAILED", message: "Failed to retrieve stats" }, meta: null },
      { status: 500, headers },
    );
  }
}
