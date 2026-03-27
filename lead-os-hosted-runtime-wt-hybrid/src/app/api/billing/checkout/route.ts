import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { createCheckoutSession } from "@/lib/billing";

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

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

    if (!body.tenantId || typeof body.tenantId !== "string" || body.tenantId.trim().length === 0) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "tenantId is required" }, meta: null },
        { status: 400, headers },
      );
    }

    if (!body.planId || typeof body.planId !== "string" || body.planId.trim().length === 0) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "planId is required" }, meta: null },
        { status: 400, headers },
      );
    }

    const result = await createCheckoutSession(
      body.tenantId.trim(),
      body.planId.trim(),
      typeof body.successUrl === "string" ? body.successUrl : undefined,
      typeof body.cancelUrl === "string" ? body.cancelUrl : undefined,
    );

    return NextResponse.json(
      { data: { url: result.url, sessionId: result.sessionId, dryRun: result.dryRun }, error: null, meta: null },
      { status: 200, headers },
    );
  } catch (err) {
    const message = err instanceof Error && err.message.startsWith("Unknown plan")
      ? err.message
      : "Failed to create checkout session";
    const status = message.startsWith("Unknown plan") ? 400 : 500;
    return NextResponse.json(
      { data: null, error: { code: "CHECKOUT_FAILED", message }, meta: null },
      { status, headers },
    );
  }
}
