// erie-pro/src/app/api/admin/reconcile-thrivecart-event/route.ts

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { formatZodErrors } from "@/lib/validation"
import { resolveReconciliationItem } from "@/lib/thrivecart-reconciliation"
import { processProviderOfferCheckout } from "@/lib/provider-offer-provisioning"
import { markThriveCartEventMatched } from "@/lib/thrivecart-reconciliation"

const BodySchema = z.object({
  reconciliationItemId: z.string(),
  planSlug: z.string(),
  providerId: z.string().optional(),
  email: z.string().email().optional(),
  resolutionNotes: z.string().min(3),
  ignore: z.boolean().optional(),
})

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: formatZodErrors(parsed.error) }, { status: 400 })
  }

  const item = await prisma.thriveCartReconciliationItem.findUnique({
    where: { id: parsed.data.reconciliationItemId },
    include: { thriveCartEvent: true },
  })
  if (!item) {
    return NextResponse.json({ success: false, error: "Reconciliation item not found" }, { status: 404 })
  }

  if (parsed.data.ignore) {
    await resolveReconciliationItem({
      itemId: item.id,
      resolvedBy: session.user.email ?? "admin",
      resolutionNotes: parsed.data.resolutionNotes,
      status: "ignored",
    })
    return NextResponse.json({ success: true, status: "ignored" })
  }

  const email =
    parsed.data.email ??
    item.thriveCartEvent.customerEmail ??
    (typeof item.thriveCartEvent.normalizedPayload === "object" &&
    item.thriveCartEvent.normalizedPayload &&
    "customer" in (item.thriveCartEvent.normalizedPayload as object)
      ? String((item.thriveCartEvent.normalizedPayload as { customer?: { email?: string } }).customer?.email ?? "")
      : "")

  if (!email) {
    return NextResponse.json({ success: false, error: "Customer email required" }, { status: 400 })
  }

  const result = await processProviderOfferCheckout({
    email,
    planSlug: parsed.data.planSlug,
    providerId: parsed.data.providerId,
    thriveCartOrderId: item.thriveCartEvent.orderId,
    thriveCartProductId: item.thriveCartEvent.productId,
    rawPayload: item.thriveCartEvent.rawPayload,
  })

  if (!result.matched) {
    return NextResponse.json({ success: false, error: result.reason }, { status: 422 })
  }

  await markThriveCartEventMatched({
    thriveCartEventId: item.thriveCartEventId,
    providerSubscriptionId: result.subscriptionId,
  })

  await resolveReconciliationItem({
    itemId: item.id,
    resolvedBy: session.user.email ?? "admin",
    resolutionNotes: parsed.data.resolutionNotes,
    status: "manual_resolved",
  })

  return NextResponse.json({
    success: true,
    providerId: result.providerId,
    subscriptionId: result.subscriptionId,
  })
}
