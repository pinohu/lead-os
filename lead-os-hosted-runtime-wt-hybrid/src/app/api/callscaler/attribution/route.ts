import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { getSourceAttribution } from "@/lib/integrations/callscaler-adapter";

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId") ?? undefined;

    const attribution = await getSourceAttribution(tenantId);
    return NextResponse.json(
      { data: attribution, error: null, meta: { count: attribution.length } },
      { headers },
    );
  } catch (err) {
    console.error("[callscaler/attribution GET]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "ATTRIBUTION_FAILED", message: "Failed to compute source attribution" }, meta: null },
      { status: 500, headers },
    );
  }
}
