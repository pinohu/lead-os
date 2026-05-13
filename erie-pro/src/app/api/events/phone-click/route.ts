import { after, NextRequest, NextResponse } from "next/server"
import { checkRateLimit } from "@/lib/rate-limit"
import { formatZodErrors, MAX_BODY_SIZE } from "@/lib/validation"
import { audit } from "@/lib/audit-log"
import { logger } from "@/lib/logger"
import { syncLeadEventToBoostspace } from "@/lib/lead-external-sync"
import { recordRevenueActionPlan } from "@/lib/revenue-actions"
import { PhoneClickEventSchema, recordPhoneClickEvent } from "@/lib/universal-lead-events"

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

    const parsed = PhoneClickEventSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: formatZodErrors(parsed.error) }, { status: 400 })
    }

    const event = await recordPhoneClickEvent(parsed.data, body)
    const actionPlanResult = await recordRevenueActionPlan({
      sourceSystem: "erie-pro",
      eventType: event.eventType,
      serviceSlug: event.serviceSlug ?? event.serviceNiche,
      serviceLabel: event.serviceNiche ?? event.serviceSlug,
      sourcePage: event.sourcePage,
      sourcePageType: event.sourcePageType ?? "phone_click",
      utmSource: parsed.data.utmSource,
      utmMedium: parsed.data.utmMedium,
      utmCampaign: parsed.data.utmCampaign,
      gclid: parsed.data.gclid,
      metadata: {
        leadEventId: event.id,
        externalEventId: event.externalEventId,
        phoneNumberClicked: event.phoneNumberClicked,
        requestedProviderName: event.requestedProviderName,
        requestedProviderSlug: event.requestedProviderSlug,
        exclusiveProviderId: event.exclusiveProviderId,
        exclusiveProviderName: event.exclusiveProviderName,
        routingModel: event.routingModel,
        keywordCluster: event.keywordCluster,
        sessionId: parsed.data.sessionId ?? null,
      },
    }).catch((error) => {
      logger.error("api/events/phone-click", "Failed to create revenue action plan for phone click", error)
      return null
    })
    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"

    after(async () => {
      await Promise.allSettled([
        audit({
          action: "lead.event_captured",
          entityType: "lead_event",
          entityId: event.id,
          metadata: {
            eventType: event.eventType,
            serviceNiche: event.serviceNiche,
            requestedProviderSlug: event.requestedProviderSlug,
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
      actionPlan: actionPlanResult?.plan ?? null,
    })
  } catch (error) {
    logger.error("api/events/phone-click", "Failed to capture phone click event", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
