import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { evaluateAllExperiments } from "@/lib/experiment-evaluator";
import { tenantConfig } from "@/lib/tenant";

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Content-Type must be application/json" }, meta: null },
        { status: 415, headers },
      );
    }

    const body = await request.json();
    const tenantId = typeof body.tenantId === "string" ? body.tenantId : tenantConfig.tenantId;

    const summary = await evaluateAllExperiments(tenantId);

    return NextResponse.json(
      { data: summary, error: null, meta: null },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "EVALUATION_FAILED", message: "Failed to evaluate experiments" }, meta: null },
      { status: 500, headers },
    );
  }
}
