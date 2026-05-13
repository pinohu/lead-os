import { after, NextRequest, NextResponse } from "next/server"
import { audit } from "@/lib/audit-log"
import { logger } from "@/lib/logger"
import { checkRateLimit } from "@/lib/rate-limit"
import { recordRevenueActionPlan } from "@/lib/revenue-actions"
import { syncLeadEventToBoostspace } from "@/lib/lead-external-sync"
import { ConvertBoxEventSchema, recordConvertBoxEvent } from "@/lib/universal-lead-events"
import { formatZodErrors, MAX_BODY_SIZE } from "@/lib/validation"

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await checkRateLimit(request, "lead-event")
    if (rateLimited) return rateLimited

    const contentLength = parseInt(request.headers.get("content-length") ?? "0", 10)
    if (contentLength > MAX_BODY_SIZE) {
      return NextResponse.json({ success: false, error: "Request body too large" }, { status: 413 })
    }

    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 })
    }

    const parsed = ConvertBoxEventSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: formatZodErrors(parsed.error) }, { status: 400 })
    }

    const event = await recordConvertBoxEvent(parsed.data, body)
    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
    const actionPlanResult = await recordRevenueActionPlan({
      sourceSystem: "convertbox",
      eventType: parsed.data.eventType,
      customerEmail: parsed.data.consumerEmail,
      serviceSlug: parsed.data.serviceSlug ?? parsed.data.serviceNiche,
      serviceLabel: parsed.data.serviceLabel ?? parsed.data.serviceNiche,
      serviceFamily: parsed.data.family,
      sourcePage: parsed.data.sourcePage,
      sourcePageType: parsed.data.sourcePageType ?? "convertbox_event",
      convertBoxId: parsed.data.boxId == null ? null : String(parsed.data.boxId),
      utmSource: parsed.data.utmSource,
      utmMedium: parsed.data.utmMedium,
      utmCampaign: parsed.data.utmCampaign,
      gclid: parsed.data.gclid,
      metadata: {
        leadEventId: event.id,
        urgency: event.urgency,
        intentType: event.intentType,
        routingModel: event.routingModel,
        providerDeliveryStatus: event.providerDeliveryStatus,
        manualReviewRequired: event.manualReviewRequired,
        boxName: parsed.data.boxName ?? null,
        variation: parsed.data.variation ?? null,
        stepId: parsed.data.stepId ?? null,
        stepName: parsed.data.stepName ?? null,
        actionId: parsed.data.actionId ?? null,
        actionLabel: parsed.data.actionLabel ?? null,
        branchId: parsed.data.branchId ?? null,
        branchLabel: parsed.data.branchLabel ?? null,
      },
    }).catch((error) => {
      logger.error("api/events/convertbox", "Failed to record revenue action plan", error)
      return null
    })

    after(async () => {
      await Promise.allSettled([
        audit({
          action: "lead.event_captured",
          entityType: "lead_event",
          entityId: event.id,
          metadata: {
            eventType: event.eventType,
            serviceNiche: event.serviceNiche,
            serviceSlug: event.serviceSlug,
            sourcePage: event.sourcePage,
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
      boostspaceSyncStatus: event.boostspaceSyncStatus,
      suitedashSyncStatus: event.suitedashSyncStatus,
      actionPlan: actionPlanResult?.plan ?? null,
    })
  } catch (error) {
    logger.error("api/events/convertbox", "Failed to capture ConvertBox event", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
