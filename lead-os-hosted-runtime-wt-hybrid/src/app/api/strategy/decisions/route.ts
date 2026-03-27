import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { getStrategicDecisions, type DecisionStatus } from "@/lib/strategy-engine";

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
    const status = url.searchParams.get("status") as DecisionStatus | null;

    if (!tenantId) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "tenantId query parameter is required" }, meta: null },
        { status: 400, headers },
      );
    }

    const validStatuses: DecisionStatus[] = ["proposed", "approved", "executing", "completed", "rejected"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: `status must be one of: ${validStatuses.join(", ")}` }, meta: null },
        { status: 400, headers },
      );
    }

    const decisions = getStrategicDecisions(tenantId, status ?? undefined);

    return NextResponse.json(
      {
        data: { decisions },
        error: null,
        meta: { count: decisions.length, tenantId },
      },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to fetch strategic decisions" }, meta: null },
      { status: 500, headers },
    );
  }
}
