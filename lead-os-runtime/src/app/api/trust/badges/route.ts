import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { generateTrustBadges, getTrustBadgeConfig } from "@/lib/trust-engine";

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId");
    const niche = url.searchParams.get("niche");

    if (!tenantId) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "tenantId query parameter is required" }, meta: null },
        { status: 400, headers },
      );
    }

    const badges = generateTrustBadges(tenantId);
    const config = niche ? getTrustBadgeConfig(niche) : null;

    return NextResponse.json(
      { data: { badges, config }, error: null, meta: { count: badges.length } },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "BADGES_FAILED", message: "Failed to generate trust badges" }, meta: null },
      { status: 500, headers },
    );
  }
}
