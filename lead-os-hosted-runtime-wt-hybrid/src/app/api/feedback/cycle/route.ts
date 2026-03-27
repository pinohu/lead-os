import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { runFeedbackCycle, getFeedbackHistory } from "@/lib/feedback-engine";
import { tenantConfig } from "@/lib/tenant";

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
    const tenantId = url.searchParams.get("tenantId") ?? tenantConfig.tenantId;
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 20, 1), 100);

    const history = await getFeedbackHistory(tenantId, limit);

    return NextResponse.json(
      { data: history, error: null, meta: { count: history.length } },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "LIST_FAILED", message: "Failed to list feedback cycles" }, meta: null },
      { status: 500, headers },
    );
  }
}

const VALID_CYCLE_TYPES = new Set(["daily", "weekly", "monthly"]);

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
    const type = VALID_CYCLE_TYPES.has(body.type) ? body.type : "daily";

    const cycle = await runFeedbackCycle(tenantId, type);

    return NextResponse.json(
      { data: cycle, error: null, meta: null },
      { status: 201, headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "CYCLE_FAILED", message: "Failed to run feedback cycle" }, meta: null },
      { status: 500, headers },
    );
  }
}
