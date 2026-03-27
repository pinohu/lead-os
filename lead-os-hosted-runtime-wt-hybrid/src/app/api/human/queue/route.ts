import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { identifyHighValueOpportunities, prioritizeQueue } from "@/lib/human-amplification";

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
    const queue = prioritizeQueue(opportunities);

    return NextResponse.json(
      { data: queue, error: null, meta: { tenantId } },
      { status: 200, headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "QUEUE_FAILED", message: "Failed to build prioritized queue" }, meta: null },
      { status: 500, headers },
    );
  }
}
