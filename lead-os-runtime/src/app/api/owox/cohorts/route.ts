import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { getCohortAnalysis } from "@/lib/integrations/owox-adapter";

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId") ?? undefined;
    const period = url.searchParams.get("period") ?? undefined;

    const cohorts = await getCohortAnalysis(tenantId, period);

    return NextResponse.json(
      { data: cohorts, error: null, meta: { count: cohorts.length } },
      { headers },
    );
  } catch (err) {
    logger.error("owox/cohorts GET failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to fetch cohort analysis" }, meta: null },
      { status: 500, headers },
    );
  }
}
