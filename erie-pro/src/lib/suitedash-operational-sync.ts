import type { RevenueActionAutomationPayload } from "@/lib/revenue-actions"

export const suiteDashOperationStatuses = ["planned", "queued", "in_progress", "completed", "failed", "skipped"] as const

export type SuiteDashOperationStatus = (typeof suiteDashOperationStatuses)[number]

export type SuiteDashOperationKind =
  | "customer_contact"
  | "provider_contact"
  | "project"
  | "portal"
  | "support_record"
  | "fulfillment_task"

export type SuiteDashOperation = {
  kind: SuiteDashOperationKind
  title: string
  idempotencyKey: string
  endpoint: string
  method: "POST" | "PATCH"
  required: boolean
  payload: Record<string, unknown>
  successCriteria: string
}

export type SuiteDashOperationalPackage = {
  id: string
  status: SuiteDashOperationStatus
  source: "erie-pro"
  integration: "suitedash"
  action: RevenueActionAutomationPayload
  operations: SuiteDashOperation[]
}

export type SuiteDashSetupExport = {
  generatedAt: string
  appUrl: string
  tokenVariable: string
  endpoints: {
    poll: string
    statusCallback: string
    genericPoll: string
  }
  operationKinds: Array<{
    kind: SuiteDashOperationKind
    purpose: string
    manualFallback: string
  }>
  pollViews: Array<{
    name: string
    url: string
    purpose: string
  }>
}

function slugify(value: string | null | undefined, fallback: string) {
  const slug = (value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  return slug || fallback
}

function label(value: string | null | undefined, fallback: string) {
  return value?.trim() || fallback
}

export function buildSuiteDashIdempotencyKey(input: {
  actionId: string
  kind: SuiteDashOperationKind
  contextKey?: string | null
}) {
  return [
    "erie-pro",
    "suitedash",
    input.actionId,
    input.kind,
    slugify(input.contextKey, "context"),
  ].join(":")
}

export function shouldRouteToSuiteDash(action: RevenueActionAutomationPayload) {
  return action.routing.preferredTool === "suitedash" || action.targetTools.includes("suitedash")
}

export function buildSuiteDashOperationalPackage(input: {
  action: RevenueActionAutomationPayload
  status?: string | null
}): SuiteDashOperationalPackage {
  const action = input.action
  const status = suiteDashOperationStatuses.includes(input.status as SuiteDashOperationStatus)
    ? input.status as SuiteDashOperationStatus
    : "planned"
  const context = action.context
  const service = label(context.serviceLabel ?? context.serviceSlug, "Erie County service")
  const offer = label(context.offerTitle ?? context.offerSlug, "Erie.Pro offer")
  const customerEmail = label(context.customerEmail, "unknown@erie.pro")
  const company = label(
    readMetadataString(context.eventMetadata, "companyName") ?? readMetadataString(context.eventMetadata, "company"),
    `${service} contact`,
  )
  const sourceUrl = label(context.sourcePage, "https://erie.pro")
  const serviceSlug = slugify(context.serviceSlug ?? context.serviceLabel, "service")
  const offerSlug = slugify(context.offerSlug ?? context.offerTitle, "offer")
  const basePayload = {
    erieActionId: action.actionId,
    automationKey: action.automationKey,
    outcome: action.outcome,
    priority: action.priority,
    service,
    serviceSlug: context.serviceSlug,
    serviceFamily: context.serviceFamily,
    offer,
    offerSlug: context.offerSlug,
    customerEmail,
    sourceSystem: context.sourceSystem,
    sourceEventType: context.sourceEventType,
    sourceUrl,
    orderId: context.orderId,
    productId: context.productId,
    purchaseId: context.purchaseId,
    coupon: context.coupon,
    affiliate: context.affiliate,
    amountCents: context.amountCents,
    utmSource: context.utmSource,
    utmMedium: context.utmMedium,
    utmCampaign: context.utmCampaign,
    gclid: context.gclid,
  }

  const operations: SuiteDashOperation[] = [
    {
      kind: "customer_contact",
      title: `Create or update customer contact for ${customerEmail}`,
      idempotencyKey: buildSuiteDashIdempotencyKey({ actionId: action.actionId, kind: "customer_contact", contextKey: customerEmail }),
      endpoint: "/contact",
      method: "POST",
      required: true,
      payload: {
        ...basePayload,
        email: customerEmail,
        role: action.outcome === "recover" ? "Revenue Recovery Contact" : "Erie.Pro Customer",
        companyName: company,
        tags: ["erie-pro", `outcome:${action.outcome}`, `service:${serviceSlug}`, `offer:${offerSlug}`],
      },
      successCriteria: "A SuiteDash contact exists with Erie.Pro action ID, service, offer, and attribution notes.",
    },
    {
      kind: "provider_contact",
      title: `Attach provider or business context for ${service}`,
      idempotencyKey: buildSuiteDashIdempotencyKey({ actionId: action.actionId, kind: "provider_contact", contextKey: `${serviceSlug}-${offerSlug}` }),
      endpoint: "/contact",
      method: "POST",
      required: action.outcome === "deliver" || action.outcome === "route",
      payload: {
        ...basePayload,
        email: customerEmail,
        role: "Provider Operations Contact",
        companyName: company,
        tags: ["erie-pro", "provider-context", `family:${slugify(context.serviceFamily, "service-family")}`],
      },
      successCriteria: "Provider/business context is searchable from the customer record and service family.",
    },
    {
      kind: "project",
      title: `Open operations project for ${offer}`,
      idempotencyKey: buildSuiteDashIdempotencyKey({ actionId: action.actionId, kind: "project", contextKey: `${offerSlug}-${serviceSlug}` }),
      endpoint: "/project",
      method: "POST",
      required: action.outcome === "deliver" || action.outcome === "route",
      payload: {
        ...basePayload,
        projectName: `${service} - ${offer}`,
        stage: action.outcome === "deliver" ? "Fulfillment" : "Routing",
        dueInMinutes: action.automationKey?.includes("paid_offer") ? 5 : 120,
      },
      successCriteria: "A SuiteDash project tracks fulfillment/routing status without losing revenue context.",
    },
    {
      kind: "portal",
      title: `Prepare portal access for ${offer}`,
      idempotencyKey: buildSuiteDashIdempotencyKey({ actionId: action.actionId, kind: "portal", contextKey: customerEmail }),
      endpoint: "/portal",
      method: "POST",
      required: action.outcome === "deliver",
      payload: {
        ...basePayload,
        portalName: `${service} ${offer}`,
        accessPolicy: "customer-or-provider-owned",
        welcomeEmail: false,
      },
      successCriteria: "Portal access is ready for delivered assets, onboarding files, and support history.",
    },
    {
      kind: "support_record",
      title: `Create support/recovery record for ${action.title}`,
      idempotencyKey: buildSuiteDashIdempotencyKey({ actionId: action.actionId, kind: "support_record", contextKey: action.outcome }),
      endpoint: "/support/ticket",
      method: "POST",
      required: action.outcome === "recover" || action.priority === "immediate",
      payload: {
        ...basePayload,
        subject: action.title,
        body: action.action,
        supportType: action.outcome === "recover" ? "revenue-recovery" : "fulfillment-watch",
      },
      successCriteria: "A support/recovery record exists for human-visible follow-up and audit trail.",
    },
    {
      kind: "fulfillment_task",
      title: `Queue fulfillment task for ${offer}`,
      idempotencyKey: buildSuiteDashIdempotencyKey({ actionId: action.actionId, kind: "fulfillment_task", contextKey: action.automationKey }),
      endpoint: "/task",
      method: "POST",
      required: true,
      payload: {
        ...basePayload,
        taskName: action.title,
        taskDescription: action.action,
        ownerTool: action.ownerTool,
        fallbackTools: action.routing.fallbackTools,
      },
      successCriteria: "A task exists with owner, fallback, due timing, and the canonical Neon reference.",
    },
  ]

  return {
    id: action.actionId,
    status,
    source: "erie-pro",
    integration: "suitedash",
    action,
    operations,
  }
}

export function buildSuiteDashSetupExport(appUrl: string, tokenVariable = "SUITEDASH_REVENUE_ACTION_TOKEN"): SuiteDashSetupExport {
  const baseUrl = appUrl.replace(/\/$/, "")
  return {
    generatedAt: new Date().toISOString(),
    appUrl: baseUrl,
    tokenVariable,
    endpoints: {
      poll: `${baseUrl}/api/integrations/suitedash/revenue-actions`,
      statusCallback: `${baseUrl}/api/integrations/suitedash/revenue-actions`,
      genericPoll: `${baseUrl}/api/revenue-actions?ownerTool=suitedash`,
    },
    operationKinds: [
      {
        kind: "customer_contact",
        purpose: "Create or update the buyer/requester/provider contact with service, offer, and attribution context.",
        manualFallback: "Create a contact manually and paste the Erie.Pro action ID into the notes/custom field.",
      },
      {
        kind: "provider_contact",
        purpose: "Attach provider/business context so service delivery can be managed by company, not only person.",
        manualFallback: "Create or tag the provider/company contact and link it to the customer contact.",
      },
      {
        kind: "project",
        purpose: "Open the operational workspace for fulfillment, routing, or onboarding.",
        manualFallback: "Create a SuiteDash project using the operation title and copy all payload fields into notes.",
      },
      {
        kind: "portal",
        purpose: "Prepare the customer/provider portal for deliverables, files, and onboarding context.",
        manualFallback: "Enable portal access from the contact/project once the matching template is configured.",
      },
      {
        kind: "support_record",
        purpose: "Create a recoverable support/revenue record for urgent fulfillment, refunds, failed payments, and cancellations.",
        manualFallback: "Create a ticket with the action title, body, and source URL.",
      },
      {
        kind: "fulfillment_task",
        purpose: "Create the concrete task queue item so every event becomes deliver, recover, route, or learn work.",
        manualFallback: "Create a task under the project and paste the idempotency key into the task description.",
      },
    ],
    pollViews: [
      {
        name: "SuiteDash deliver actions",
        url: `${baseUrl}/api/integrations/suitedash/revenue-actions?status=planned&outcome=deliver`,
        purpose: "Paid purchases that need SuiteDash contact, project, portal, and fulfillment task work.",
      },
      {
        name: "SuiteDash route actions",
        url: `${baseUrl}/api/integrations/suitedash/revenue-actions?status=planned&outcome=route`,
        purpose: "Context-routing actions where SuiteDash is owner or downstream operations record.",
      },
      {
        name: "SuiteDash recovery actions",
        url: `${baseUrl}/api/integrations/suitedash/revenue-actions?status=planned&outcome=recover`,
        purpose: "Refund, cancellation, failed-payment, and abandoned-cart follow-up records.",
      },
    ],
  }
}

function readMetadataString(value: Record<string, unknown> | null | undefined, key: string) {
  const candidate = value?.[key]
  return typeof candidate === "string" && candidate.trim() ? candidate.trim() : null
}
