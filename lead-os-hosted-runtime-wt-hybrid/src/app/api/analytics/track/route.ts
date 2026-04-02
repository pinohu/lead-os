import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { trackProductEvent } from "@/lib/product-analytics";

const MAX_EVENT_LENGTH = 200;
const MAX_PROPERTIES_SIZE = 10_000;

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  try {
    const body = await request.json();

    if (!body.tenantId || typeof body.tenantId !== "string") {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "tenantId is required" }, meta: null },
        { status: 400, headers },
      );
    }

    if (!body.event || typeof body.event !== "string" || body.event.trim().length === 0) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "event is required" }, meta: null },
        { status: 400, headers },
      );
    }

    if (body.event.length > MAX_EVENT_LENGTH) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: `event must not exceed ${MAX_EVENT_LENGTH} characters` }, meta: null },
        { status: 400, headers },
      );
    }

    const properties = typeof body.properties === "object" && body.properties !== null ? body.properties : {};
    if (JSON.stringify(properties).length > MAX_PROPERTIES_SIZE) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "properties payload is too large" }, meta: null },
        { status: 400, headers },
      );
    }

    const event = await trackProductEvent({
      tenantId: body.tenantId,
      userId: typeof body.userId === "string" ? body.userId : undefined,
      event: body.event.trim(),
      properties,
    });

    return NextResponse.json(
      { data: event, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    logger.error("analytics-track failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "TRACK_FAILED", message: "Failed to track event" }, meta: null },
      { status: 500, headers },
    );
  }
}
