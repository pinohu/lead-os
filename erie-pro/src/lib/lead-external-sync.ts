import { prisma } from "@/lib/db"
import { logger } from "@/lib/logger"

const BOOSTSPACE_LEAD_EVENT_FIELD_IDS: Record<string, number> = {
  "Erie Event ID": 2917,
  "Erie Lead ID": 2921,
  "Event Type": 2925,
  "Event Version": 2929,
  "Source System": 2933,
  "Source Domain": 2937,
  "Source Page URL": 2941,
  "Source Page Type": 2945,
  "Service Niche": 2949,
  "Service Slug": 2953,
  City: 2957,
  State: 2961,
  ZIP: 2965,
  "Keyword Cluster": 2969,
  "Intent Type": 2973,
  Urgency: 2977,
  "Lead Value Tier": 2981,
  "External Event ID": 2985,
  "Call ID": 2989,
  "Phone Number Clicked": 2993,
  "Tracking Number": 2997,
  "Dialed Number": 3001,
  "Caller Phone": 3005,
  "Call Duration Seconds": 3009,
  "Call Outcome": 3013,
  "Transfer Status": 3017,
  "Recording URL": 3021,
  "Transcript URL": 3025,
  "Transcript Text": 3029,
  "AI Summary": 3033,
  "Consumer First Name": 3037,
  "Consumer Last Name": 3041,
  "Consumer Full Name": 3045,
  "Consumer Phone": 3049,
  "Consumer Email": 3053,
  "Consumer Address": 3057,
  "Request Summary": 3061,
  "Service Needed": 3065,
  "Preferred Timing": 3069,
  "Requested Provider ID": 3073,
  "Requested Provider Name": 3077,
  "Requested Provider Slug": 3081,
  "Requested Provider Phone": 3085,
  "Requested Provider Address": 3089,
  "Exclusive Provider ID": 3093,
  "Exclusive Provider Name": 3097,
  "Exclusive Provider Niche": 3101,
  "Routing Model": 3105,
  "Routing Decision": 3109,
  "Provider Delivery Status": 3113,
  "Provider Delivered At": 3117,
  "Manual Review Required": 3121,
  "Manual Review Reason": 3125,
  "Consent to Contact": 3129,
  "Marketing Consent": 3133,
  "Consent Text": 3137,
  "Consent Captured At": 3141,
  "UTM Source": 3145,
  "UTM Medium": 3149,
  "UTM Campaign": 3153,
  GCLID: 3157,
  "Session ID": 3161,
  "IP Hash": 3165,
  "User Agent": 3169,
  "Raw Payload": 3173,
  "Normalized Payload": 3177,
  "Boost.space Sync Status": 3181,
  "SuiteDash Sync Status": 3185,
  "SuiteDash Contact ID": 3189,
  "SuiteDash Opportunity ID": 3193,
  "Last Error": 3197,
  "Retry Count": 3201,
  "Created At": 3205,
  "Updated At": 3209,
}

type LeadForSync = {
  id: string
  niche: string
  city: string
  firstName: string | null
  lastName: string | null
  email: string
  phone: string | null
  message: string | null
  source: string
  sourcePage: string | null
  routeType: string
  routingIntent: string | null
  providerDeliveryStatus: string
  requestedProviderName: string | null
  requestedProviderSlug: string | null
  requestedProviderPhone: string | null
  requestedProviderAddress: string | null
  tcpaConsent: boolean
  tcpaConsentText: string | null
  tcpaConsentAt: Date | null
  createdAt: Date
}

export function buildLeadSyncPayload(lead: LeadForSync) {
  const leadName = `${lead.firstName ?? ""} ${lead.lastName ?? ""}`.trim()
  const sourcePageType = inferLeadSourcePageType(lead.sourcePage)

  return {
    event: lead.requestedProviderSlug || lead.requestedProviderName ? "lead.provider_specific.created" : "lead.created",
    eventVersion: "1.0",
    sentAt: new Date().toISOString(),
    lead: {
      id: lead.id,
      name: leadName || "Unknown",
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      phone: lead.phone,
      niche: lead.niche,
      city: lead.city,
      message: lead.message,
      source: lead.source,
      sourcePage: lead.sourcePage,
      sourcePageType,
      routeType: lead.routeType,
      routingIntent: lead.routingIntent,
      providerDeliveryStatus: lead.providerDeliveryStatus,
      createdAt: lead.createdAt.toISOString(),
    },
    requestedProvider: {
      name: lead.requestedProviderName,
      slug: lead.requestedProviderSlug,
      phone: lead.requestedProviderPhone,
      address: lead.requestedProviderAddress,
    },
    consent: {
      tcpaConsent: lead.tcpaConsent,
      tcpaConsentText: lead.tcpaConsentText,
      tcpaConsentAt: lead.tcpaConsentAt?.toISOString() ?? null,
    },
    recommendedCrmStatus: lead.requestedProviderSlug
      ? "Pending Provider Claim"
      : "New Erie.pro Lead",
  }
}

function inferLeadSourcePageType(sourcePage: string | null): string | null {
  if (!sourcePage) return null
  try {
    const pathname = new URL(sourcePage).pathname
    if (pathname === "/" || pathname === "") return "homepage"
    if (pathname.startsWith("/client-sites/")) return "client_site"
    if (pathname.includes("/directory")) return "directory_page"
    const parts = pathname.split("/").filter(Boolean)
    if (parts.length >= 2) return "provider_profile"
    if (parts.length === 1) return "niche_landing_page"
  } catch {
    return null
  }
  return null
}

export async function syncLeadToBoostspace(leadId: string): Promise<void> {
  const webhookUrl = process.env.BOOST_SPACE_LEAD_WEBHOOK_URL || process.env.BOOSTSPACE_LEAD_WEBHOOK_URL

  if (!webhookUrl) {
    await prisma.lead.update({
      where: { id: leadId },
      data: { boostspaceSyncStatus: "not_configured" },
    }).catch(() => {})
    return
  }

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      id: true,
      niche: true,
      city: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      message: true,
      source: true,
      sourcePage: true,
      routeType: true,
      routingIntent: true,
      providerDeliveryStatus: true,
      requestedProviderName: true,
      requestedProviderSlug: true,
      requestedProviderPhone: true,
      requestedProviderAddress: true,
      tcpaConsent: true,
      tcpaConsentText: true,
      tcpaConsentAt: true,
      createdAt: true,
    },
  })

  if (!lead) return

  const payload = buildLeadSyncPayload(lead)

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      boostspaceSyncStatus: "pending",
      externalSyncPayload: payload,
    },
  })

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "EriePro-LeadSync/1.0",
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const text = await response.text().catch(() => "")
      throw new Error(`Boost.space webhook failed: ${response.status} ${text.slice(0, 300)}`)
    }

    await prisma.lead.update({
      where: { id: leadId },
      data: {
        boostspaceSyncStatus: "synced",
        boostspaceSyncedAt: new Date(),
        boostspaceLastError: null,
        suitedashSyncStatus: "pending",
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Boost.space sync error"
    logger.error("lead-external-sync", "Boost.space sync failed", error)
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        boostspaceSyncStatus: "failed",
        boostspaceLastError: message,
      },
    }).catch(() => {})
  }
}

export async function syncLeadEventToBoostspace(eventId: string): Promise<void> {
  const webhookUrl = process.env.BOOST_SPACE_LEAD_WEBHOOK_URL || process.env.BOOSTSPACE_LEAD_WEBHOOK_URL
  const apiToken =
    process.env.BOOST_SPACE_API_TOKEN ||
    process.env.BOOSTSPACE_API_TOKEN ||
    process.env.BOOST_SPACE_API_KEY ||
    process.env.BOOSTSPACE_API_KEY

  if (!webhookUrl && !apiToken) {
    await prisma.leadEvent.update({
      where: { id: eventId },
      data: { boostspaceSyncStatus: "not_configured" },
    }).catch(() => {})
    return
  }

  const event = await prisma.leadEvent.findUnique({
    where: { id: eventId },
  })

  if (!event) return

  const flatPayload = {
    Space: event.id,
    "Erie Event ID": event.id,
    "Erie Lead ID": event.leadId,
    "Event Type": event.eventType,
    "Event Version": "1.0",
    "Source System": event.sourceSystem,
    "Source Domain": event.sourceDomain,
    "Source Page URL": event.sourcePage,
    "Source Page Type": event.sourcePageType,
    "Service Niche": event.serviceNiche,
    "Service Slug": event.serviceSlug,
    City: event.city,
    State: "PA",
    ZIP: null,
    "Keyword Cluster": event.keywordCluster,
    "Intent Type": event.intentType,
    Urgency: event.urgency,
    "Lead Value Tier": null,
    "External Event ID": event.externalEventId,
    "Call ID": event.callId,
    "Phone Number Clicked": event.phoneNumberClicked,
    "Tracking Number": event.trackingNumber,
    "Dialed Number": event.dialedNumber,
    "Caller Phone": event.callerPhone,
    "Call Duration Seconds": event.callDurationSeconds,
    "Call Outcome": event.callOutcome,
    "Transfer Status": event.transferStatus,
    "Recording URL": event.recordingUrl,
    "Transcript URL": event.transcriptUrl,
    "Transcript Text": null,
    "AI Summary": null,
    "Consumer Full Name": event.consumerName,
    "Consumer First Name": event.consumerName?.split(" ")[0] ?? null,
    "Consumer Last Name": event.consumerName?.split(" ").slice(1).join(" ") || null,
    "Consumer Phone": event.consumerPhone,
    "Consumer Email": event.consumerEmail,
    "Request Summary": event.requestSummary,
    "Service Needed": event.serviceNiche,
    "Preferred Timing": event.urgency,
    "Requested Provider ID": null,
    "Requested Provider Name": event.requestedProviderName,
    "Requested Provider Slug": event.requestedProviderSlug,
    "Requested Provider Phone": null,
    "Requested Provider Address": null,
    "Requested Provider Address Street": null,
    "Requested Provider Address City": "Erie",
    "Requested Provider Address State/Region": "PA",
    "Requested Provider Address ZIP/Postal Code": null,
    "Requested Provider Address Country": "US",
    "Exclusive Provider ID": event.exclusiveProviderId,
    "Exclusive Provider Name": event.exclusiveProviderName,
    "Exclusive Provider Niche": event.serviceNiche,
    "Routing Model": event.routingModel,
    "Routing Decision": event.providerDeliveryStatus,
    "Provider Delivery Status": event.providerDeliveryStatus,
    "Provider Delivered At": null,
    "Manual Review Required": event.manualReviewRequired,
    "Manual Review Reason": event.manualReviewRequired ? "Event requires manual routing review before provider delivery." : null,
    "Consent to Contact": event.consentToContact,
    "Marketing Consent": event.marketingConsent,
    "Consent Text": null,
    "Consent Captured At": null,
    "UTM Source": readJsonString(event.normalizedPayload, "utmSource") ?? readJsonString(event.rawPayload, "utmSource"),
    "UTM Medium": readJsonString(event.normalizedPayload, "utmMedium") ?? readJsonString(event.rawPayload, "utmMedium"),
    "UTM Campaign": readJsonString(event.normalizedPayload, "utmCampaign") ?? readJsonString(event.rawPayload, "utmCampaign"),
    GCLID: readJsonString(event.normalizedPayload, "gclid") ?? readJsonString(event.rawPayload, "gclid"),
    "Session ID": readJsonString(event.normalizedPayload, "sessionId") ?? readJsonString(event.rawPayload, "sessionId"),
    "IP Hash": null,
    "User Agent": null,
    "Raw Payload": JSON.stringify(event.rawPayload ?? {}),
    "Normalized Payload": JSON.stringify(event.normalizedPayload ?? {}),
    "Boost.space Sync Status": event.boostspaceSyncStatus,
    "SuiteDash Sync Status": event.suitedashSyncStatus,
    "SuiteDash Contact ID": event.suitedashRecordId,
    "SuiteDash Opportunity ID": null,
    "Last Error": event.boostspaceLastError,
    "Retry Count": 0,
    "Created At": event.createdAt.toISOString(),
    "Updated At": event.updatedAt.toISOString(),
  }

  const payload = {
    ...flatPayload,
    event: event.eventType,
    eventVersion: "1.0",
    sentAt: new Date().toISOString(),
    flatLeadEvent: flatPayload,
    leadEvent: {
      id: event.id,
      eventType: event.eventType,
      sourceSystem: event.sourceSystem,
      sourceDomain: event.sourceDomain,
      sourcePage: event.sourcePage,
      sourcePageType: event.sourcePageType,
      serviceNiche: event.serviceNiche,
      serviceSlug: event.serviceSlug,
      city: event.city,
      keywordCluster: event.keywordCluster,
      intentType: event.intentType,
      urgency: event.urgency,
      externalEventId: event.externalEventId,
      callId: event.callId,
      phoneNumberClicked: event.phoneNumberClicked,
      trackingNumber: event.trackingNumber,
      dialedNumber: event.dialedNumber,
      callerPhone: event.callerPhone,
      callDurationSeconds: event.callDurationSeconds,
      callOutcome: event.callOutcome,
      transferStatus: event.transferStatus,
      recordingUrl: event.recordingUrl,
      transcriptUrl: event.transcriptUrl,
      consumerName: event.consumerName,
      consumerPhone: event.consumerPhone,
      consumerEmail: event.consumerEmail,
      requestSummary: event.requestSummary,
      requestedProviderName: event.requestedProviderName,
      requestedProviderSlug: event.requestedProviderSlug,
      exclusiveProviderId: event.exclusiveProviderId,
      exclusiveProviderName: event.exclusiveProviderName,
      routingModel: event.routingModel,
      providerDeliveryStatus: event.providerDeliveryStatus,
      manualReviewRequired: event.manualReviewRequired,
      leadId: event.leadId,
      createdAt: event.createdAt.toISOString(),
    },
    consent: {
      consentToContact: event.consentToContact,
      marketingConsent: event.marketingConsent,
    },
    rawPayload: event.rawPayload,
    normalizedPayload: event.normalizedPayload,
    recommendedCrmStatus: event.manualReviewRequired
      ? "Manual Review Required"
      : event.providerDeliveryStatus === "attribution_only"
      ? "Phone Attribution Event"
      : "Ready to Route",
  }

  await prisma.leadEvent.update({
    where: { id: eventId },
    data: { boostspaceSyncStatus: "pending" },
  })

  try {
    if (apiToken) {
      await createBoostspaceLeadEventRecord(flatPayload, apiToken)
    } else if (webhookUrl) {
      await postBoostspaceWebhook(webhookUrl, payload)
    }

    await prisma.leadEvent.update({
      where: { id: eventId },
      data: {
        boostspaceSyncStatus: "synced",
        boostspaceSyncedAt: new Date(),
        boostspaceLastError: null,
        suitedashSyncStatus: "pending",
      },
    })
  } catch (directError) {
    if (apiToken && webhookUrl) {
      try {
        await postBoostspaceWebhook(webhookUrl, payload)
        await prisma.leadEvent.update({
          where: { id: eventId },
          data: {
            boostspaceSyncStatus: "synced",
            boostspaceSyncedAt: new Date(),
            boostspaceLastError: null,
            suitedashSyncStatus: "pending",
          },
        })
        return
      } catch (webhookError) {
        const directMessage = directError instanceof Error ? directError.message : "Unknown Boost.space API sync error"
        const webhookMessage = webhookError instanceof Error ? webhookError.message : "Unknown Boost.space webhook sync error"
        logger.error("lead-external-sync", "Boost.space lead-event API and webhook sync failed", webhookError)
        await prisma.leadEvent.update({
          where: { id: eventId },
          data: {
            boostspaceSyncStatus: "failed",
            boostspaceLastError: `${directMessage}; webhook fallback: ${webhookMessage}`,
          },
        }).catch(() => {})
        return
      }
    }

    const message = directError instanceof Error ? directError.message : "Unknown Boost.space sync error"
    logger.error("lead-external-sync", "Boost.space lead-event sync failed", directError)
    await prisma.leadEvent.update({
      where: { id: eventId },
      data: {
        boostspaceSyncStatus: "failed",
        boostspaceLastError: message,
      },
    }).catch(() => {})
  }
}

async function postBoostspaceWebhook(webhookUrl: string, payload: unknown) {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "EriePro-LeadEventSync/1.0",
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => "")
    throw new Error(`Boost.space webhook failed: ${response.status} ${text.slice(0, 300)}`)
  }
}

async function createBoostspaceLeadEventRecord(flatPayload: Record<string, unknown>, apiToken: string) {
  const apiBaseUrl = (
    process.env.BOOST_SPACE_API_BASE_URL ||
    process.env.BOOSTSPACE_API_BASE_URL ||
    "https://neatcircle.boost.space/api"
  ).replace(/\/$/, "")
  const spaceId = Number(process.env.BOOST_SPACE_LEAD_EVENT_SPACE_ID ?? 5)
  const statusSystemId = Number(process.env.BOOST_SPACE_LEAD_EVENT_STATUS_SYSTEM_ID ?? 94)

  const customFieldsValues = Object.entries(BOOSTSPACE_LEAD_EVENT_FIELD_IDS)
    .map(([fieldName, customFieldInputId]) => {
      const value = flatPayload[fieldName]
      if (value === null || value === undefined || value === "") return null

      return {
        customFieldInputId,
        module: "custom-module-item",
        value: typeof value === "boolean" ? String(value) : String(value),
      }
    })
    .filter((entry): entry is { customFieldInputId: number; module: string; value: string } => Boolean(entry))

  const response = await fetch(`${apiBaseUrl}/custom-module-item`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "EriePro-LeadEventSync/1.0",
    },
    body: JSON.stringify({
      spaceId,
      statusSystemId,
      customFieldsValues,
    }),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => "")
    throw new Error(`Boost.space API create failed: ${response.status} ${text.slice(0, 300)}`)
  }
}

function readJsonString(value: unknown, key: string): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const record = value as Record<string, unknown>
  const candidate = record[key]
  return typeof candidate === "string" && candidate.trim() ? candidate.trim() : null
}
