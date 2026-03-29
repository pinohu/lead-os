import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { getFormalooStats } from "@/lib/integrations/formaloo-adapter";

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId") ?? undefined;

    const stats = await getFormalooStats(tenantId);

    return NextResponse.json(
      { data: stats, error: null, meta: null },
      { headers },
    );
  } catch (err) {
    console.error("[formaloo-stats]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "STATS_FAILED", message: "Failed to fetch Formaloo stats" }, meta: null },
      { status: 500, headers },
    );
  }
}
