import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { detectModelDrift } from "@/lib/tenant-scoring-model";

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json(
        { data: null, error: { code: "MISSING_PARAM", message: "tenantId is required" }, meta: null },
        { status: 400, headers },
      );
    }

    const alert = await detectModelDrift(tenantId);

    return NextResponse.json(
      {
        data: alert,
        error: null,
        meta: {
          tenantId,
          driftDetected: alert !== null,
          checkedAt: new Date().toISOString(),
        },
      },
      { headers },
    );
  } catch (err) {
    logger.error("scoring-model/drift GET failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "DRIFT_CHECK_FAILED", message: "Failed to check model drift" }, meta: null },
      { status: 500, headers },
    );
  }
}
