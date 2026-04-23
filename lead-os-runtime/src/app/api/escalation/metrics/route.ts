import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { getEscalationMetrics } from "@/lib/escalation-engine";

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId");
    const period = url.searchParams.get("period");

    if (!tenantId || tenantId.trim().length === 0) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "tenantId query parameter is required" }, meta: null },
        { status: 400, headers },
      );
    }

    if (!period || period.trim().length === 0) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "period query parameter is required (e.g. 2026-03)" }, meta: null },
        { status: 400, headers },
      );
    }

    const metrics = getEscalationMetrics(tenantId, period);

    return NextResponse.json(
      { data: metrics, error: null, meta: null },
      { status: 200, headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "INTERNAL_ERROR", message: "Failed to generate escalation metrics" }, meta: null },
      { status: 500, headers },
    );
  }
}
