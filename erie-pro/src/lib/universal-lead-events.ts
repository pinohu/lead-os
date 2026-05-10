import { z } from "zod"
import { prisma } from "@/lib/db"
import { normalizePhone, sanitizeText } from "@/lib/validation"

const optionalText = (max = 1000) =>
  z.string().max(max).transform(sanitizeText).optional().nullable()

const optionalUrl = z.string().url().max(2000).optional().nullable()

export const PhoneClickEventSchema = z.object({
  eventType: z.literal("phone.click_created").default("phone.click_created"),
  eventId: optionalText(200),
  sourceDomain: z.string().max(200).default("erie.pro"),
  sourcePage: optionalText(1000),
  sourcePageType: optionalText(100),
  serviceNiche: optionalText(100),
  serviceSlug: optionalText(100),
  keywordCluster: optionalText(200),
  phoneNumberClicked: z.string().min(7).max(40).transform(normalizePhone),
  requestedProviderName: optionalText(200),
  requestedProviderSlug: optionalText(200),
  exclusiveProviderId: optionalText(200),
  exclusiveProviderName: optionalText(200),
  routingModel: z.enum(["provider_specific", "exclusive_niche", "general", "unknown"]).default("unknown"),
  sessionId: optionalText(300),
  utmSource: optionalText(200),
  utmMedium: optionalText(200),
  utmCampaign: optionalText(200),
  gclid: optionalText(300),
})

export type PhoneClickEventInput = z.infer<typeof PhoneClickEventSchema>

export const UniversalCallEventSchema = z.object({
  eventType: z
    .enum([
      "call.inbound_started",
      "call.inbound_completed",
      "call.ai_summary_created",
      "call.transfer_attempted",
      "call.transfer_completed",
      "call.transfer_failed",
      "chat.lead_captured",
      "sms.lead_captured",
    ])
    .default("call.ai_summary_created"),
  eventId: optionalText(200),
  callId: optionalText(200),
  sourceSystem: z.enum(["callscaler", "thoughtly", "insighto", "boostspace", "erie-pro", "unknown"]).default("unknown"),
  sourceDomain: z.string().max(200).default("erie.pro"),
  sourcePage: optionalText(1000),
  sourcePageType: optionalText(100),
  serviceNiche: optionalText(100),
  serviceSlug: optionalText(100),
  keywordCluster: optionalText(200),
  intentType: optionalText(100),
  urgency: z.enum(["standard", "urgent", "emergency"]).default("standard"),
  trackingNumber: z.string().max(40).transform((p) => (p ? normalizePhone(p) : p)).optional().nullable(),
  dialedNumber: z.string().max(40).transform((p) => (p ? normalizePhone(p) : p)).optional().nullable(),
  callerPhone: z.string().max(40).transform((p) => (p ? normalizePhone(p) : p)).optional().nullable(),
  consumerName: optionalText(200),
  consumerPhone: z.string().max(40).transform((p) => (p ? normalizePhone(p) : p)).optional().nullable(),
  consumerEmail: z.string().email().max(255).transform((e) => e.toLowerCase().trim()).optional().nullable(),
  requestSummary: optionalText(5000),
  aiSummary: optionalText(5000),
  transcriptText: optionalText(20000),
  transcriptUrl: optionalUrl,
  recordingUrl: optionalUrl,
  callDurationSeconds: z.coerce.number().int().min(0).max(86400).optional().nullable(),
  callOutcome: optionalText(100),
  transferStatus: z
    .enum(["not_transferred", "attempted", "completed", "failed", "voicemail", "after_hours", "unknown"])
    .default("unknown"),
  requestedProviderName: optionalText(200),
  requestedProviderSlug: optionalText(200),
  exclusiveProviderId: optionalText(200),
  exclusiveProviderName: optionalText(200),
  routingModel: z.enum(["provider_specific", "exclusive_niche", "general", "unknown"]).default("unknown"),
  consentToContact: z.boolean().default(true),
  marketingConsent: z.boolean().default(false),
}).refine(
  (event) =>
    Boolean(
      event.callId ||
        event.eventId ||
        event.callerPhone ||
        event.consumerPhone ||
        event.trackingNumber ||
        event.dialedNumber ||
        event.requestSummary ||
        event.aiSummary ||
        event.transcriptText
    ),
  "Call/conversation event must include a call ID, phone number, summary, transcript, or another real event identifier"
)

export type UniversalCallEventInput = z.infer<typeof UniversalCallEventSchema>

type AnyRecord = Record<string, unknown>

export function inferUrgencyFromText(text: string | null | undefined): "standard" | "urgent" | "emergency" {
  const normalized = (text ?? "").toLowerCase()
  const emergencyTerms = [
    "unsafe",
    "can't drive",
    "cannot drive",
    "brakes failed",
    "brake failure",
    "flood",
    "flooding",
    "burst pipe",
    "no heat",
    "gas leak",
    "electrical fire",
    "sparking",
    "locked out",
    "medical",
    "deadline today",
  ]
  if (emergencyTerms.some((term) => normalized.includes(term))) return "emergency"

  const urgentTerms = ["today", "asap", "right away", "urgent", "same day", "soon", "stranded"]
  if (urgentTerms.some((term) => normalized.includes(term))) return "urgent"

  return "standard"
}

export function normalizeVendorCallPayload(sourceSystem: string, body: AnyRecord): UniversalCallEventInput {
  const extractedLead = asRecord(body.extractedLead) ?? asRecord(body.lead) ?? {}
  const summary = stringValue(body.aiSummary) ?? stringValue(body.summary) ?? stringValue(body.callSummary)
  const transcript = stringValue(body.transcriptText) ?? stringValue(body.transcript)
  const requestSummary =
    stringValue(body.requestSummary) ??
    stringValue(extractedLead.serviceNeeded) ??
    summary ??
    transcript

  const urgency =
    stringValue(body.urgency) ??
    stringValue(extractedLead.urgency) ??
    inferUrgencyFromText([requestSummary, summary, transcript].filter(Boolean).join(" "))

  return {
    eventType: (stringValue(body.eventType) as UniversalCallEventInput["eventType"]) ?? "call.ai_summary_created",
    eventId: stringValue(body.eventId) ?? stringValue(body.id),
    callId: stringValue(body.callId) ?? stringValue(body.call_id) ?? stringValue(body.conversationId),
    sourceSystem: normalizeSourceSystem(sourceSystem),
    sourceDomain: stringValue(body.sourceDomain) ?? "erie.pro",
    sourcePage: stringValue(body.sourcePage) ?? stringValue(body.landingPage),
    sourcePageType: stringValue(body.sourcePageType),
    serviceNiche: stringValue(body.serviceNiche) ?? stringValue(body.niche) ?? stringValue(extractedLead.serviceNiche),
    serviceSlug: stringValue(body.serviceSlug) ?? stringValue(body.nicheSlug),
    keywordCluster: stringValue(body.keywordCluster),
    intentType: stringValue(body.intentType),
    urgency: urgency === "urgent" || urgency === "emergency" ? urgency : "standard",
    trackingNumber: stringValue(body.trackingNumber),
    dialedNumber: stringValue(body.dialedNumber) ?? stringValue(body.to),
    callerPhone: stringValue(body.callerPhone) ?? stringValue(body.from),
    consumerName: stringValue(body.consumerName) ?? stringValue(extractedLead.consumerName) ?? stringValue(body.name),
    consumerPhone: stringValue(body.consumerPhone) ?? stringValue(extractedLead.consumerPhone) ?? stringValue(body.callerPhone) ?? stringValue(body.from),
    consumerEmail: stringValue(body.consumerEmail) ?? stringValue(extractedLead.consumerEmail) ?? stringValue(body.email),
    requestSummary,
    aiSummary: summary,
    transcriptText: transcript,
    transcriptUrl: stringValue(body.transcriptUrl),
    recordingUrl: stringValue(body.recordingUrl) ?? stringValue(body.recording),
    callDurationSeconds: numberValue(body.callDurationSeconds) ?? numberValue(body.duration) ?? numberValue(body.durationSeconds),
    callOutcome: stringValue(body.callOutcome) ?? stringValue(body.outcome),
    transferStatus: normalizeTransferStatus(stringValue(body.transferStatus)),
    requestedProviderName: stringValue(body.requestedProviderName) ?? stringValue(asRecord(body.requestedProvider)?.name),
    requestedProviderSlug: stringValue(body.requestedProviderSlug) ?? stringValue(asRecord(body.requestedProvider)?.slug),
    exclusiveProviderId: stringValue(body.exclusiveProviderId) ?? stringValue(asRecord(body.exclusiveProvider)?.id),
    exclusiveProviderName: stringValue(body.exclusiveProviderName) ?? stringValue(asRecord(body.exclusiveProvider)?.name),
    routingModel: normalizeRoutingModel(stringValue(body.routingModel)),
    consentToContact: booleanValue(body.consentToContact) ?? true,
    marketingConsent: booleanValue(body.marketingConsent) ?? false,
  }
}

export async function recordPhoneClickEvent(input: PhoneClickEventInput, rawPayload: unknown) {
  const normalized = PhoneClickEventSchema.parse(input)

  return prisma.leadEvent.create({
    data: {
      eventType: normalized.eventType,
      externalEventId: normalized.eventId ?? null,
      sourceSystem: "erie-pro",
      sourceDomain: normalized.sourceDomain,
      sourcePage: normalized.sourcePage ?? null,
      sourcePageType: normalized.sourcePageType ?? null,
      serviceNiche: normalized.serviceNiche ?? normalized.serviceSlug ?? null,
      serviceSlug: normalized.serviceSlug ?? normalized.serviceNiche ?? null,
      city: "erie",
      keywordCluster: normalized.keywordCluster ?? null,
      phoneNumberClicked: normalized.phoneNumberClicked,
      requestedProviderName: normalized.requestedProviderName ?? null,
      requestedProviderSlug: normalized.requestedProviderSlug ?? null,
      exclusiveProviderId: normalized.exclusiveProviderId ?? null,
      exclusiveProviderName: normalized.exclusiveProviderName ?? null,
      routingModel: normalized.routingModel,
      providerDeliveryStatus: "attribution_only",
      consentToContact: false,
      marketingConsent: false,
      rawPayload: rawPayload as object,
      normalizedPayload: normalized as object,
    },
  })
}

export async function recordUniversalCallEvent(input: UniversalCallEventInput, rawPayload: unknown) {
  const normalized = UniversalCallEventSchema.parse(input)
  const textForUrgency = [normalized.requestSummary, normalized.aiSummary, normalized.transcriptText].filter(Boolean).join(" ")
  const urgency = normalized.urgency === "standard" ? inferUrgencyFromText(textForUrgency) : normalized.urgency
  const manualReviewRequired =
    urgency === "emergency" ||
    normalized.routingModel === "unknown" ||
    (!normalized.requestedProviderSlug && !normalized.exclusiveProviderId && !normalized.serviceNiche)

  return prisma.leadEvent.create({
    data: {
      eventType: normalized.eventType,
      sourceSystem: normalized.sourceSystem,
      sourceDomain: normalized.sourceDomain,
      sourcePage: normalized.sourcePage ?? null,
      sourcePageType: normalized.sourcePageType ?? null,
      serviceNiche: normalized.serviceNiche ?? normalized.serviceSlug ?? null,
      serviceSlug: normalized.serviceSlug ?? normalized.serviceNiche ?? null,
      city: "erie",
      keywordCluster: normalized.keywordCluster ?? null,
      intentType: normalized.intentType ?? null,
      urgency,
      externalEventId: normalized.eventId ?? null,
      callId: normalized.callId ?? null,
      trackingNumber: normalized.trackingNumber ?? null,
      dialedNumber: normalized.dialedNumber ?? null,
      callerPhone: normalized.callerPhone ?? normalized.consumerPhone ?? null,
      callDurationSeconds: normalized.callDurationSeconds ?? null,
      callOutcome: normalized.callOutcome ?? null,
      transferStatus: normalized.transferStatus,
      recordingUrl: normalized.recordingUrl ?? null,
      transcriptUrl: normalized.transcriptUrl ?? null,
      consumerName: normalized.consumerName ?? null,
      consumerPhone: normalized.consumerPhone ?? normalized.callerPhone ?? null,
      consumerEmail: normalized.consumerEmail ?? null,
      requestSummary: normalized.requestSummary ?? normalized.aiSummary ?? normalized.transcriptText ?? null,
      requestedProviderName: normalized.requestedProviderName ?? null,
      requestedProviderSlug: normalized.requestedProviderSlug ?? null,
      exclusiveProviderId: normalized.exclusiveProviderId ?? null,
      exclusiveProviderName: normalized.exclusiveProviderName ?? null,
      routingModel: normalized.routingModel,
      providerDeliveryStatus: manualReviewRequired ? "manual_review_required" : "ready_to_route",
      manualReviewRequired,
      consentToContact: normalized.consentToContact,
      marketingConsent: normalized.marketingConsent,
      rawPayload: rawPayload as object,
      normalizedPayload: { ...normalized, urgency } as object,
    },
  })
}

export function verifyUniversalWebhookSecret(sourceSystem: string, secret: string | null): boolean {
  const source = normalizeSourceSystem(sourceSystem)
  const perSource: Record<string, string | undefined> = {
    callscaler: process.env.CALLSCALER_WEBHOOK_SECRET,
    thoughtly: process.env.THOUGHTLY_WEBHOOK_SECRET,
    insighto: process.env.INSIGHTO_WEBHOOK_SECRET,
    boostspace: process.env.BOOSTSPACE_WEBHOOK_SECRET,
  }
  const expected = perSource[source] || process.env.UNIVERSAL_LEAD_EVENT_WEBHOOK_SECRET
  if (!expected) return process.env.NODE_ENV !== "production"
  return Boolean(secret) && secret === expected
}

function normalizeSourceSystem(value: string | null | undefined): UniversalCallEventInput["sourceSystem"] {
  const normalized = (value ?? "unknown").toLowerCase().replace(/[^a-z]/g, "")
  if (normalized.includes("callscaler")) return "callscaler"
  if (normalized.includes("thoughtly")) return "thoughtly"
  if (normalized.includes("insighto")) return "insighto"
  if (normalized.includes("boost")) return "boostspace"
  if (normalized.includes("erie")) return "erie-pro"
  return "unknown"
}

function normalizeTransferStatus(value: string | null | undefined): UniversalCallEventInput["transferStatus"] {
  const normalized = (value ?? "unknown").toLowerCase().replace(/[\s-]/g, "_")
  if (["not_transferred", "attempted", "completed", "failed", "voicemail", "after_hours"].includes(normalized)) {
    return normalized as UniversalCallEventInput["transferStatus"]
  }
  return "unknown"
}

function normalizeRoutingModel(value: string | null | undefined): UniversalCallEventInput["routingModel"] {
  const normalized = (value ?? "unknown").toLowerCase().replace(/[\s-]/g, "_")
  if (["provider_specific", "exclusive_niche", "general"].includes(normalized)) {
    return normalized as UniversalCallEventInput["routingModel"]
  }
  return "unknown"
}

function asRecord(value: unknown): AnyRecord | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as AnyRecord) : null
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined
}

function numberValue(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value)
  return undefined
}

function booleanValue(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true
    if (value.toLowerCase() === "false") return false
  }
  return undefined
}
