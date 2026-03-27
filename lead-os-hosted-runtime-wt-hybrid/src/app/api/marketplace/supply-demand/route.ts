import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { analyzeSupplyDemand, identifyScarcityOpportunities, generateLeadScarcitySignals } from "@/lib/marketplace-growth";

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId") ?? "default";

    const supplyDemand = analyzeSupplyDemand(tenantId);
    const scarcityOpportunities = identifyScarcityOpportunities();
    const scarcitySignals = generateLeadScarcitySignals();

    return NextResponse.json(
      {
        data: { supplyDemand, scarcityOpportunities, scarcitySignals },
        error: null,
        meta: { nicheCount: supplyDemand.length },
      },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to fetch supply-demand analysis" }, meta: null },
      { status: 500, headers },
    );
  }
}
