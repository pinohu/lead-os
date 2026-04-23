import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import {
  getSubscription,
  cancelSubscription,
  pauseSubscription,
  resumeSubscription,
} from "@/lib/integrations/chargebee-adapter";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  const { id } = await params;

  try {
    const subscription = await getSubscription(id);
    if (!subscription) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: `Subscription ${id} not found` }, meta: null },
        { status: 404, headers },
      );
    }

    return NextResponse.json(
      { data: subscription, error: null, meta: null },
      { headers },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch subscription";
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message }, meta: null },
      { status: 500, headers },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  const { id } = await params;

  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Content-Type must be application/json" }, meta: null },
        { status: 415, headers },
      );
    }

    const body = await request.json();
    const action = body.action;

    if (!action || !["cancel", "pause", "resume"].includes(action)) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "action must be 'cancel', 'pause', or 'resume'" }, meta: null },
        { status: 422, headers },
      );
    }

    let subscription;
    switch (action) {
      case "cancel":
        subscription = await cancelSubscription(id, body.endOfTerm !== false);
        break;
      case "pause":
        subscription = await pauseSubscription(id);
        break;
      case "resume":
        subscription = await resumeSubscription(id);
        break;
    }

    return NextResponse.json(
      { data: subscription, error: null, meta: null },
      { headers },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update subscription";
    const isNotFound = message.includes("not found");
    const isAlreadyCancelled = message.includes("already cancelled");
    const isNotPaused = message.includes("not paused");

    let status = 500;
    let code = "UPDATE_FAILED";
    if (isNotFound) { status = 404; code = "NOT_FOUND"; }
    else if (isAlreadyCancelled || isNotPaused) { status = 409; code = "CONFLICT"; }

    return NextResponse.json(
      { data: null, error: { code, message }, meta: null },
      { status, headers },
    );
  }
}
