import { after, NextRequest, NextResponse } from "next/server"
import { checkRateLimit } from "@/lib/rate-limit"
import { audit } from "@/lib/audit-log"
import { logger } from "@/lib/logger"
import { syncLeadEventToBoostspace } from "@/lib/lead-external-sync"
import {
  normalizeVendorCallPayload,
  recordUniversalCallEvent,
  UniversalCallEventSchema,
  verifyUniversalWebhookSecret,
} from "@/lib/universal-lead-events"

const MAX_CALL_EVENT_BODY_SIZE = 128 * 1024

type RouteContext = {
  params: Promise<{ source: string }>
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { source } = await context.params

  try {
    const rateLimited = await checkRateLimit(request, "call-event")
    if (rateLimited) return rateLimited

    const contentLength = parseInt(request.headers.get("content-length") ?? "0", 10)
    if (contentLength > MAX_CALL_EVENT_BODY_SIZE) {
      return NextResponse.json({ success: false, error: "Request body too large" }, { status: 413 })
    }

    const secret =
      request.headers.get("x-webhook-secret") ??
      request.headers.get("x-erie-pro-secret") ??
      request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
      null

    if (!verifyUniversalWebhookSecret(source, secret)) {
      return NextResponse.json({ success: false, error: "Invalid webhook secret" }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 })
    }

    const normalizedInput = normalizeVendorCallPayload(source, body as Record<string, unknown>)
    const parsed = UniversalCallEventSchema.safeParse(normalizedInput)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ") },
        { status: 400 }
      )
    }

    const event = await recordUniversalCallEvent(parsed.data, body)
    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"

    after(async () => {
      await Promise.allSettled([
        audit({
          action: "lead.event_captured",
          entityType: "lead_event",
          entityId: event.id,
          metadata: {
            eventType: event.eventType,
            sourceSystem: event.sourceSystem,
            serviceNiche: event.serviceNiche,
            requestedProviderSlug: event.requestedProviderSlug,
            transferStatus: event.transferStatus,
            manualReviewRequired: event.manualReviewRequired,
          },
          ipAddress,
        }),
        syncLeadEventToBoostspace(event.id),
      ])
    })

    return NextResponse.json({
      success: true,
      eventId: event.id,
      eventType: event.eventType,
      sourceSystem: event.sourceSystem,
      manualReviewRequired: event.manualReviewRequired,
      providerDeliveryStatus: event.providerDeliveryStatus,
    })
  } catch (error) {
    logger.error("api/webhooks/calls", `Failed to capture ${source} call event`, error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
