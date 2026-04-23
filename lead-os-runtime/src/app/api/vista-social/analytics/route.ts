import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { getAnalytics } from "@/lib/integrations/vista-social-adapter";

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { session, response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId") ?? session.email;

    const analytics = await getAnalytics(tenantId);

    return NextResponse.json(
      { data: analytics, error: null, meta: null },
      { headers },
    );
  } catch (err) {
    logger.error("vista-social/analytics GET failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to get analytics" }, meta: null },
      { status: 500, headers },
    );
  }
}
