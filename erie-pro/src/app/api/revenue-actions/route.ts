import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import type { Prisma } from "@/generated/prisma"
import type { RevenueAction } from "@/lib/revenue-actions"
import { prisma } from "@/lib/db"
import { logger } from "@/lib/logger"

export const dynamic = "force-dynamic"

const ActionStatusSchema = z.enum(["planned", "queued", "in_progress", "completed", "failed", "skipped"])

const UpdateActionSchema = z.object({
  id: z.string().min(1),
  status: ActionStatusSchema,
  ownerNote: z.string().max(2000).optional(),
  externalRecordId: z.string().max(300).optional(),
  externalSystem: z.string().max(120).optional(),
})

type RevenueActionMetadata = {
  status?: string
  sourceSystem?: string
  sourceEventType?: string
  primaryOutcome?: string
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
  statusUpdatedAt?: string
}

function hasAccess(request: NextRequest) {
  const token = process.env.REVENUE_ACTIONS_API_TOKEN
  if (!token) return true
  const auth = request.headers.get("authorization")
  const bearer = auth?.startsWith("Bearer ") ? auth.slice("Bearer ".length).trim() : null
  return bearer === token || request.nextUrl.searchParams.get("token") === token
}

function isDatabaseUnavailable(error: unknown) {
  return error instanceof Error && error.message.includes("DATABASE_URL is not set")
}

function serializeAction(item: {
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
  return {
    id: item.id,
    eventType: item.eventType,
    outcome: item.eventType.replace("revenue_action.", ""),
    status: metadata.status ?? "planned",
    priority: action?.priority ?? "normal",
    title: action?.title ?? "Planned revenue action",
    action: action?.action ?? null,
    ownerTool: action?.ownerTool ?? "neon",
    targetTools: action?.targetTools ?? [],
    automationKey: action?.automationKey ?? null,
    dueInMinutes: action?.dueInMinutes ?? null,
    sourceSystem: metadata.sourceSystem ?? null,
    sourceEventType: metadata.sourceEventType ?? null,
    primaryOutcome: metadata.primaryOutcome ?? null,
    purchaseId: metadata.purchaseId ?? null,
    offerSlug: metadata.offerSlug ?? null,
    offerTitle: metadata.offerTitle ?? null,
    customerEmail: metadata.customerEmail ?? null,
    funnelSlug: metadata.funnelSlug ?? null,
    orderId: metadata.orderId ?? null,
    productId: metadata.productId ?? null,
    coupon: metadata.coupon ?? null,
    affiliate: metadata.affiliate ?? null,
    amountCents: metadata.amountCents ?? null,
    serviceSlug: item.serviceSlug,
    serviceLabel: item.serviceLabel,
    serviceFamily: item.serviceFamily,
    sourcePage: item.sourcePage,
    sourcePageType: item.sourcePageType,
    utmSource: item.utmSource,
    utmMedium: item.utmMedium,
    utmCampaign: item.utmCampaign,
    gclid: item.gclid,
    ownerNote: metadata.ownerNote ?? null,
    externalRecordId: metadata.externalRecordId ?? null,
    externalSystem: metadata.externalSystem ?? null,
    statusUpdatedAt: metadata.statusUpdatedAt ?? null,
    createdAt: item.createdAt.toISOString(),
  }
}

export async function GET(request: NextRequest) {
  if (!hasAccess(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const status = request.nextUrl.searchParams.get("status") ?? "planned"
  const outcome = request.nextUrl.searchParams.get("outcome")
  const ownerTool = request.nextUrl.searchParams.get("ownerTool")
  const limit = Math.min(Number(request.nextUrl.searchParams.get("limit") ?? 50) || 50, 200)

  try {
    const actions = await prisma.offerInteraction.findMany({
      where: {
        eventType: outcome ? `revenue_action.${outcome}` : { startsWith: "revenue_action." },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    })

    const filtered = actions
      .map(serializeAction)
      .filter((item) => (status === "all" ? true : item.status === status))
      .filter((item) => (ownerTool ? item.ownerTool === ownerTool || item.targetTools.includes(ownerTool) : true))
      .slice(0, limit)

    return NextResponse.json({
      success: true,
      status,
      outcome: outcome ?? "all",
      ownerTool: ownerTool ?? "all",
      count: filtered.length,
      actions: filtered,
    })
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return NextResponse.json({
        success: true,
        status,
        outcome: outcome ?? "all",
        ownerTool: ownerTool ?? "all",
        count: 0,
        actions: [],
        warning: "DATABASE_URL is not configured; revenue actions cannot be loaded in this environment.",
      })
    }
    logger.error("api/revenue-actions", "Failed to load revenue actions", error)
    return NextResponse.json({ success: false, error: "Could not load revenue actions" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  if (!hasAccess(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parsed = UpdateActionSchema.safeParse(body)
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
          externalSystem: parsed.data.externalSystem ?? metadata.externalSystem,
          statusUpdatedAt: new Date().toISOString(),
        } as Prisma.InputJsonValue,
      },
    })

    return NextResponse.json({ success: true, action: serializeAction(updated) })
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return NextResponse.json(
        {
          success: false,
          error: "DATABASE_URL is not configured; revenue action status cannot be updated in this environment.",
        },
        { status: 503 },
      )
    }
    logger.error("api/revenue-actions", "Failed to update revenue action", error)
    return NextResponse.json({ success: false, error: "Could not update revenue action" }, { status: 500 })
  }
}
