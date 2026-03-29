import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { getNovocallStats } from "@/lib/integrations/novocall-adapter";

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId") ?? undefined;

    const stats = await getNovocallStats(tenantId);
    return NextResponse.json(
      { data: stats, error: null, meta: null },
      { headers },
    );
  } catch (err) {
    console.error("[novocall/stats GET]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "STATS_FAILED", message: "Failed to compute callback stats" }, meta: null },
      { status: 500, headers },
    );
  }
}
