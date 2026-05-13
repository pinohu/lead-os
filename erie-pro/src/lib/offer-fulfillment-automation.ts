import { automatedOffers, getOfferBySlug, type FulfillmentChannelDefinition } from "@/lib/automated-offers"
import { logger } from "@/lib/logger"

type FulfillmentPurchaseContext = {
  id: string
  serviceSlug: string
  serviceLabel: string
  serviceFamily: string
  amountCents: number
  currency: string
  sourcePage: string | null
  offer: {
    slug: string
    title: string
    shortTitle: string | null
    fulfillmentType: string
  }
  customer: {
    email: string
    fullName: string | null
    firstName: string | null
    lastName: string | null
    phone: string | null
    companyName: string | null
    websiteUrl: string | null
    googleBusinessUrl: string | null
  }
}

export type FulfillmentAutomationAction = {
  toolId: FulfillmentChannelDefinition["toolId"]
  required: boolean
  status: "ready" | "external_not_configured"
  action: string
  idempotencyKey: string
  payload: Record<string, unknown>
}

export type FulfillmentAutomationResult = Omit<FulfillmentAutomationAction, "status"> & {
  status: "completed" | "skipped" | "failed"
  externalId?: string | null
  error?: string | null
}

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://erie.pro").replace(/\/$/, "")
}

function getChannels(purchase: FulfillmentPurchaseContext) {
  const offer = getOfferBySlug(purchase.offer.slug) ?? automatedOffers.find((item) => item.slug === purchase.offer.slug)
  return offer?.fulfillmentChannels ?? [{ toolId: "erie-pro", role: "Generate Erie.Pro asset", required: true }]
}

function basePayload(purchase: FulfillmentPurchaseContext, assetUrl?: string | null) {
  return {
    purchaseId: purchase.id,
    offerSlug: purchase.offer.slug,
    offerTitle: purchase.offer.title,
    fulfillmentType: purchase.offer.fulfillmentType,
    serviceSlug: purchase.serviceSlug,
    serviceLabel: purchase.serviceLabel,
    serviceFamily: purchase.serviceFamily,
    amountCents: purchase.amountCents,
    currency: purchase.currency,
    sourcePage: purchase.sourcePage,
    assetUrl: assetUrl ?? null,
    successUrl: `${siteUrl()}/offers/success/${purchase.offer.slug}`,
    customer: {
      email: purchase.customer.email,
      name: purchase.customer.fullName,
      firstName: purchase.customer.firstName,
      lastName: purchase.customer.lastName,
      phone: purchase.customer.phone,
      companyName: purchase.customer.companyName,
      websiteUrl: purchase.customer.websiteUrl,
      googleBusinessUrl: purchase.customer.googleBusinessUrl,
    },
  }
}

export function buildFulfillmentAutomationActions(
  purchase: FulfillmentPurchaseContext,
  assetUrl?: string | null,
): FulfillmentAutomationAction[] {
  const payload = basePayload(purchase, assetUrl)
  return getChannels(purchase).map((channel) => {
    const idempotencyKey = [
      "erie-pro",
      "fulfillment",
      purchase.id,
      purchase.offer.slug,
      channel.toolId,
    ].join(":")

    if (channel.toolId === "erie-pro") {
      return {
        toolId: channel.toolId,
        required: channel.required,
        status: "ready",
        action: "deliver_generated_asset",
        idempotencyKey,
        payload: { ...payload, role: channel.role },
      }
    }

    if (channel.toolId === "productdyno") {
      return {
        toolId: channel.toolId,
        required: channel.required,
        status: process.env.PRODUCTDYNO_API_KEY || process.env.PRODUCTDYNO_WEBHOOK_URL ? "ready" : "external_not_configured",
        action: "grant_protected_product_access",
        idempotencyKey,
        payload: {
          ...payload,
          role: channel.role,
          productKey: mapProductDynoProductKey(purchase.offer.slug),
          accessLevel: purchase.offer.fulfillmentType === "subscription_report" ? "recurring" : "lifetime",
        },
      }
    }

    if (channel.toolId === "documents") {
      return {
        toolId: channel.toolId,
        required: channel.required,
        status: process.env.DOCUMENT_DELIVERY_WEBHOOK_URL ? "ready" : "external_not_configured",
        action: "generate_printable_document",
        idempotencyKey,
        payload: {
          ...payload,
          role: channel.role,
          documentType: purchase.offer.fulfillmentType === "blueprint" ? "pdf_blueprint" : "printable_kit",
          templateKey: `${purchase.offer.slug}:${purchase.serviceFamily.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        },
      }
    }

    if (channel.toolId === "taskade") {
      return {
        toolId: channel.toolId,
        required: channel.required,
        status: process.env.TASKADE_WEBHOOK_URL || process.env.TASKADE_API_KEY ? "ready" : "external_not_configured",
        action: "create_fulfillment_review_task",
        idempotencyKey,
        payload: {
          ...payload,
          role: channel.role,
          queue: purchase.offer.fulfillmentType === "subscription_report" ? "monthly-review" : "offer-fulfillment",
          taskTitle: `Review ${purchase.serviceLabel} ${purchase.offer.shortTitle ?? purchase.offer.title}`,
        },
      }
    }

    return {
      toolId: channel.toolId,
      required: channel.required,
      status: "ready",
      action: `sync_${channel.toolId}`,
      idempotencyKey,
      payload: { ...payload, role: channel.role },
    }
  })
}

function mapProductDynoProductKey(offerSlug: string) {
  const rawMap = process.env.PRODUCTDYNO_PRODUCT_MAP_JSON
  if (!rawMap) return offerSlug
  try {
    const parsed = JSON.parse(rawMap) as Record<string, string>
    return parsed[offerSlug] ?? offerSlug
  } catch {
    return offerSlug
  }
}

async function postJson(url: string, token: string | undefined, body: Record<string, unknown>) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "EriePro-Fulfillment/1.0",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    throw new Error(`${url} failed: ${response.status} ${await response.text().catch(() => "")}`)
  }
  return response.json().catch(() => ({})) as Promise<Record<string, unknown>>
}

export async function executeFulfillmentAutomationActions(
  actions: FulfillmentAutomationAction[],
): Promise<FulfillmentAutomationResult[]> {
  const results: FulfillmentAutomationResult[] = []
  for (const action of actions) {
    if (action.status === "external_not_configured") {
      results.push({ ...action, status: "skipped", error: "External destination is not configured." })
      continue
    }

    try {
      if (action.toolId === "productdyno" && process.env.PRODUCTDYNO_WEBHOOK_URL) {
        const response = await postJson(process.env.PRODUCTDYNO_WEBHOOK_URL, process.env.PRODUCTDYNO_API_KEY, {
          idempotencyKey: action.idempotencyKey,
          action: action.action,
          ...action.payload,
        })
        results.push({ ...action, status: "completed", externalId: String(response.id ?? response.memberId ?? "") || null })
        continue
      }

      if (action.toolId === "documents" && process.env.DOCUMENT_DELIVERY_WEBHOOK_URL) {
        const response = await postJson(process.env.DOCUMENT_DELIVERY_WEBHOOK_URL, process.env.DOCUMENT_DELIVERY_TOKEN, {
          idempotencyKey: action.idempotencyKey,
          action: action.action,
          ...action.payload,
        })
        results.push({ ...action, status: "completed", externalId: String(response.id ?? response.documentId ?? "") || null })
        continue
      }

      if (action.toolId === "taskade" && process.env.TASKADE_WEBHOOK_URL) {
        const response = await postJson(process.env.TASKADE_WEBHOOK_URL, process.env.TASKADE_API_KEY, {
          idempotencyKey: action.idempotencyKey,
          action: action.action,
          ...action.payload,
        })
        results.push({ ...action, status: "completed", externalId: String(response.id ?? response.taskId ?? "") || null })
        continue
      }

      results.push({ ...action, status: action.toolId === "erie-pro" ? "completed" : "skipped", error: action.toolId === "erie-pro" ? null : "No executable webhook configured for this channel." })
    } catch (error) {
      logger.error("offer-fulfillment-automation", `Fulfillment action failed: ${action.toolId}`, error)
      results.push({
        ...action,
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown fulfillment action error",
      })
    }
  }
  return results
}

export function buildFulfillmentSetupExport() {
  return {
    generatedAt: new Date().toISOString(),
    environmentVariables: [
      "PRODUCTDYNO_API_KEY",
      "PRODUCTDYNO_WEBHOOK_URL",
      "PRODUCTDYNO_PRODUCT_MAP_JSON",
      "DOCUMENT_DELIVERY_WEBHOOK_URL",
      "DOCUMENT_DELIVERY_TOKEN",
      "TASKADE_WEBHOOK_URL",
      "TASKADE_API_KEY",
    ],
    offers: automatedOffers.map((offer) => ({
      slug: offer.slug,
      title: offer.title,
      fulfillmentType: offer.fulfillmentType,
      checkoutProductId: offer.checkoutProductId ?? null,
      channels: offer.fulfillmentChannels ?? [{ toolId: "erie-pro", role: "Generate Erie.Pro asset", required: true }],
    })),
  }
}
