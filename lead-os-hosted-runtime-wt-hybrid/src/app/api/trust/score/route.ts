import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { calculateTrustScore, getTrustRecommendations } from "@/lib/trust-engine";

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(request.headers.get("origin")) });
}

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId");
    if (!tenantId) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "tenantId query parameter is required" }, meta: null },
        { status: 400, headers },
      );
    }

    const includeRecommendations = url.searchParams.get("recommendations") !== "false";
    const score = calculateTrustScore(tenantId);
    const recommendations = includeRecommendations ? getTrustRecommendations(tenantId) : [];

    return NextResponse.json(
      { data: { score, recommendations }, error: null, meta: null },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "TRUST_SCORE_FAILED", message: "Failed to calculate trust score" }, meta: null },
      { status: 500, headers },
    );
  }
}
