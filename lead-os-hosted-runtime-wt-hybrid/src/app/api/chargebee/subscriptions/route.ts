import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { createSubscription, listSubscriptions } from "@/lib/integrations/chargebee-adapter";

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Content-Type must be application/json" }, meta: null },
        { status: 415, headers },
      );
    }

    const body = await request.json();

    if (!body.customerId || typeof body.customerId !== "string" || body.customerId.trim().length === 0) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "customerId is required" }, meta: null },
        { status: 400, headers },
      );
    }

    if (!body.planId || typeof body.planId !== "string" || body.planId.trim().length === 0) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "planId is required" }, meta: null },
        { status: 400, headers },
      );
    }

    const subscription = await createSubscription({
      customerId: body.customerId.trim(),
      planId: body.planId.trim(),
      trialDays: typeof body.trialDays === "number" ? body.trialDays : undefined,
      tenantId: typeof body.tenantId === "string" ? body.tenantId.trim() : undefined,
    });

    return NextResponse.json(
      { data: subscription, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create subscription";
    const isNotFound = message.includes("not found");
    return NextResponse.json(
      { data: null, error: { code: isNotFound ? "NOT_FOUND" : "CREATE_FAILED", message }, meta: null },
      { status: isNotFound ? 404 : 500, headers },
    );
  }
}

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  try {
    const url = new URL(request.url);
    const customerId = url.searchParams.get("customerId") ?? undefined;
    const subscriptions = await listSubscriptions(customerId);

    return NextResponse.json(
      { data: subscriptions, error: null, meta: { count: subscriptions.length } },
      { headers },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list subscriptions";
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message }, meta: null },
      { status: 500, headers },
    );
  }
}
