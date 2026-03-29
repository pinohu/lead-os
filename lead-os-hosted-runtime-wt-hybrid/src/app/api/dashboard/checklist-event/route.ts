import { NextResponse } from "next/server";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import {
  emitChecklistEvent,
  type ChecklistEventType,
} from "@/lib/onboarding-events";
import { tenantConfig } from "@/lib/tenant";

const VALID_EVENT_TYPES = new Set<ChecklistEventType>([
  "brand-configured",
  "email-connected",
  "widget-configured",
  "first-lead-captured",
  "scoring-reviewed",
  "gone-live",
]);

export async function POST(request: Request) {
  const auth = await requireOperatorApiSession(request);
  if (auth.response) {
    return auth.response;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_JSON", message: "Request body must be valid JSON" } },
      { status: 400 },
    );
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Request body must be an object" } },
      { status: 400 },
    );
  }

  const { eventType, metadata } = body as Record<string, unknown>;

  if (typeof eventType !== "string" || !VALID_EVENT_TYPES.has(eventType as ChecklistEventType)) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: `eventType must be one of: ${[...VALID_EVENT_TYPES].join(", ")}`,
          details: [{ field: "eventType", issue: "Invalid or missing event type" }],
        },
      },
      { status: 422 },
    );
  }

  if (metadata !== undefined && (typeof metadata !== "object" || metadata === null || Array.isArray(metadata))) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "metadata must be a plain object when provided",
          details: [{ field: "metadata", issue: "Must be a key-value object" }],
        },
      },
      { status: 422 },
    );
  }

  // Resolve tenant from header or singleton config.
  const tenantId =
    request.headers.get("x-tenant-id") ?? tenantConfig.tenantId;

  const now = new Date().toISOString();

  await emitChecklistEvent({
    tenantId,
    eventType: eventType as ChecklistEventType,
    metadata: metadata as Record<string, unknown> | undefined,
    occurredAt: now,
  });

  return NextResponse.json(
    { data: { ok: true, eventType, tenantId, occurredAt: now }, error: null, meta: null },
    { status: 200 },
  );
}
