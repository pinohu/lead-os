import { NextResponse } from "next/server";
import { handleWebhookEvent } from "@/lib/integrations/chargebee-adapter";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Content-Type must be application/json" }, meta: null },
        { status: 415 },
      );
    }

    const body = await request.json();

    if (!body.eventType || typeof body.eventType !== "string") {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "eventType is required" }, meta: null },
        { status: 400 },
      );
    }

    if (!body.content || typeof body.content !== "object") {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "content is required and must be an object" }, meta: null },
        { status: 400 },
      );
    }

    const result = await handleWebhookEvent({
      eventType: body.eventType,
      content: body.content,
      occurredAt: typeof body.occurredAt === "string" ? body.occurredAt : new Date().toISOString(),
    });

    return NextResponse.json(
      { data: result, error: null, meta: null },
      { status: 200 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook processing failed";
    return NextResponse.json(
      { data: null, error: { code: "WEBHOOK_ERROR", message }, meta: null },
      { status: 400 },
    );
  }
}
