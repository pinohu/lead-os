import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { identifyHighValueOpportunities } from "@/lib/human-amplification";

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
    const tenantId = url.searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "tenantId is required" }, meta: null },
        { status: 400, headers },
      );
    }

    const opportunities = await identifyHighValueOpportunities(tenantId);

    return NextResponse.json(
      { data: opportunities, error: null, meta: { count: opportunities.length, tenantId } },
      { status: 200, headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "SCAN_FAILED", message: "Failed to identify opportunities" }, meta: null },
      { status: 500, headers },
    );
  }
}
