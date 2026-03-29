import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { getSearchStats } from "@/lib/integrations/clodura-adapter";

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { session, response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId") ?? session.email;

    const stats = await getSearchStats(tenantId);

    return NextResponse.json(
      { data: stats, error: null, meta: null },
      { headers },
    );
  } catch (err) {
    console.error("[clodura/stats GET]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "STATS_FAILED", message: "Failed to retrieve search stats" }, meta: null },
      { status: 500, headers },
    );
  }
}
