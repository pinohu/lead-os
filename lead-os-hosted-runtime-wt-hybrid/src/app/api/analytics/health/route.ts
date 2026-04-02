import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { calculateHealthScore, getAtRiskTenants, getFeatureUsage } from "@/lib/product-analytics";

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId");

    if (tenantId) {
      const [healthScore, featureUsage] = await Promise.all([
        calculateHealthScore(tenantId),
        getFeatureUsage(tenantId),
      ]);

      return NextResponse.json(
        { data: { healthScore, featureUsage }, error: null, meta: null },
        { headers },
      );
    }

    const atRiskTenants = await getAtRiskTenants();
    return NextResponse.json(
      { data: { atRiskTenants }, error: null, meta: { count: atRiskTenants.length } },
      { headers },
    );
  } catch (err) {
    logger.error("analytics-health failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to fetch health scores" }, meta: null },
      { status: 500, headers },
    );
  }
}
