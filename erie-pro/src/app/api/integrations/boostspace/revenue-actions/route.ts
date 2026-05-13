import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import type { Prisma } from "@/generated/prisma"
import { prisma } from "@/lib/db"
import { logger } from "@/lib/logger"
import {
  buildRevenueActionAutomationPayload,
  type RevenueAction,
  type RevenueOutcome,
} from "@/lib/revenue-actions"
import {
  boostspaceRevenueActionStatuses,
  buildBoostspaceRevenueActionEnvelope,
} from "@/lib/boostspace-revenue-actions"

export const dynamic = "force-dynamic"

const StatusSchema = z.enum(boostspaceRevenueActionStatuses)

const StatusCallbackSchema = z.object({
  id: z.string().min(1),
  status: StatusSchema,
  ownerNote: z.string().max(2000).optional(),
  externalRecordId: z.string().max(300).optional(),
  externalSystem: z.string().max(120).default("boostspace"),
})

type RevenueActionMetadata = {
  status?: string
  sourceSystem?: string
  sourceEventType?: string
  purchaseId?: string | null
  offerSlug?: string | null
  offerTitle?: string | null
  customerEmail?: string | null
  funnelSlug?: string | null
  orderId?: string | null
  productId?: string | null
  coupon?: string | null
  affiliate?: string | null
  amountCents?: number | null
  action?: RevenueAction
  eventMetadata?: Record<string, unknown>
  ownerNote?: string
  externalRecordId?: string
  externalSystem?: string
}

function hasBoostspaceAccess(request: NextRequest) {
  const token = process.env.BOOST_SPACE_REVENUE_ACTION_TOKEN || process.env.REVENUE_ACTIONS_API_TOKEN
  if (!token) return true
  const auth = request.headers.get("authorization")
  const bearer = auth?.startsWith("Bearer ") ? auth.slice("Bearer ".length).trim() : null
  return bearer === token || request.nextUrl.searchParams.get("token") === token
}

function isDatabaseUnavailable(error: unknown) {
  return error instanceof Error && error.message.includes("DATABASE_URL is not set")
}

function serializeForBoostspace(item: {
  id: string
  eventType: string
  serviceSlug: string | null
  serviceLabel: string | null
  serviceFamily: string | null
  sourcePage: string | null
  sourcePageType: string | null
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
  gclid: string | null
  metadata: Prisma.JsonValue | null
  createdAt: Date
}) {
  const metadata = (item.metadata ?? {}) as RevenueActionMetadata
  const action = metadata.action
  const outcome = item.eventType.replace("revenue_action.", "") as RevenueOutcome
  const automationPayload = buildRevenueActionAutomationPayload({
    actionId: item.id,
    eventType: item.eventType,
    status: metadata.status,
    action,
    sourceSystem: metadata.sourceSystem,
    sourceEventType: metadata.sourceEventType,
    purchaseId: metadata.purchaseId,
    offerSlug: metadata.offerSlug,
    offerTitle: metadata.offerTitle,
    customerEmail: metadata.customerEmail,
    funnelSlug: metadata.funnelSlug,
    orderId: metadata.orderId,
    productId: metadata.productId,
    coupon: metadata.coupon,
    affiliate: metadata.affiliate,
    amountCents: metadata.amountCents,
    serviceSlug: item.serviceSlug,
    serviceLabel: item.serviceLabel,
    serviceFamily: item.serviceFamily,
    sourcePage: item.sourcePage,
    sourcePageType: item.sourcePageType,
    utmSource: item.utmSource,
    utmMedium: item.utmMedium,
    utmCampaign: item.utmCampaign,
    gclid: item.gclid,
    eventMetadata: metadata.eventMetadata ?? null,
  })

  return {
    ...buildBoostspaceRevenueActionEnvelope({
      id: item.id,
      outcome,
      status: metadata.status,
      automationPayload,
    }),
    createdAt: item.createdAt.toISOString(),
  }
}

export async function GET(request: NextRequest) {
  if (!hasBoostspaceAccess(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const status = request.nextUrl.searchParams.get("status") ?? "planned"
  const outcome = request.nextUrl.searchParams.get("outcome")
  const limit = Math.min(Number(request.nextUrl.searchParams.get("limit") ?? 50) || 50, 100)

  try {
    const records = await prisma.offerInteraction.findMany({
      where: {
        eventType: outcome ? `revenue_action.${outcome}` : { startsWith: "revenue_action." },
      },
      orderBy: { createdAt: "asc" },
      take: 500,
    })

    const actions = records
      .map(serializeForBoostspace)
      .filter((item) => (status === "all" ? true : item.status === status))
      .filter((item) => {
        const targets = item.automationPayload.targetTools
        return item.automationPayload.routing.preferredTool === "boostspace" || targets.includes("boostspace")
      })
      .slice(0, limit)

    return NextResponse.json({
      success: true,
      integration: "boostspace",
      status,
      outcome: outcome ?? "all",
      count: actions.length,
      actions,
    })
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return NextResponse.json({
        success: true,
        integration: "boostspace",
        status,
        outcome: outcome ?? "all",
        count: 0,
        actions: [],
        warning: "DATABASE_URL is not configured; Boost.space revenue actions cannot be loaded in this environment.",
      })
    }
    logger.error("api/integrations/boostspace/revenue-actions", "Failed to load Boost.space revenue actions", error)
    return NextResponse.json({ success: false, error: "Could not load Boost.space revenue actions" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  if (!hasBoostspaceAccess(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parsed = StatusCallbackSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const existing = await prisma.offerInteraction.findUnique({ where: { id: parsed.data.id } })
    if (!existing || !existing.eventType.startsWith("revenue_action.")) {
      return NextResponse.json({ success: false, error: "Revenue action not found" }, { status: 404 })
    }

    const metadata = (existing.metadata ?? {}) as RevenueActionMetadata
    const updated = await prisma.offerInteraction.update({
      where: { id: parsed.data.id },
      data: {
        metadata: {
          ...metadata,
          status: parsed.data.status,
          ownerNote: parsed.data.ownerNote ?? metadata.ownerNote,
          externalRecordId: parsed.data.externalRecordId ?? metadata.externalRecordId,
          externalSystem: parsed.data.externalSystem,
          statusUpdatedAt: new Date().toISOString(),
        } as Prisma.InputJsonValue,
      },
    })

    return NextResponse.json({ success: true, action: serializeForBoostspace(updated) })
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return NextResponse.json(
        { success: false, error: "DATABASE_URL is not configured; Boost.space revenue action status cannot be updated in this environment." },
        { status: 503 },
      )
    }
    logger.error("api/integrations/boostspace/revenue-actions", "Failed to update Boost.space revenue action", error)
    return NextResponse.json({ success: false, error: "Could not update Boost.space revenue action" }, { status: 500 })
  }
}
