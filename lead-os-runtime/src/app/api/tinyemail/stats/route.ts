import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { getTinyEmailStats } from "@/lib/integrations/tinyemail-adapter";

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { session, response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId") ?? undefined;

    const stats = await getTinyEmailStats(tenantId);

    return NextResponse.json(
      { data: stats, error: null, meta: null },
      { headers },
    );
  } catch (err) {
    logger.error("tinyemail/stats GET failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to fetch stats" }, meta: null },
      { status: 500, headers },
    );
  }
}
