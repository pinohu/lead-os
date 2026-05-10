import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { audit } from "@/lib/audit-log"
import { prisma } from "@/lib/db"
import { sendNewLeadNotification } from "@/lib/email"
import { logger } from "@/lib/logger"

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, context: RouteContext) {
  const session = await auth()
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params
  const body = await req.json().catch(() => ({}))
  const providerEmail = String(body.providerEmail ?? "").trim().toLowerCase()
  const notes = String(body.notes ?? "").trim()

  try {
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: { routedTo: true },
    })

    if (!lead) {
      return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 })
    }

    const provider = lead.requestedProviderSlug
      ? await prisma.provider.findFirst({
          where: {
            slug: lead.requestedProviderSlug,
            subscriptionStatus: "active",
            emailVerified: true,
            verificationStatus: { in: ["verified", "auto_verified", "admin_approved"] },
          },
        })
      : null

    const deliveryEmail = provider?.email ?? providerEmail
    if (!deliveryEmail) {
      return NextResponse.json(
        { success: false, error: "Add a provider email or verify/claim the requested provider before delivery." },
        { status: 400 }
      )
    }

    const providerName = provider?.businessName ?? lead.requestedProviderName ?? "Requested provider"
    const leadName = `${lead.firstName ?? ""} ${lead.lastName ?? ""}`.trim() || "New Lead"

    const sent = await sendNewLeadNotification(
      deliveryEmail,
      providerName,
      leadName,
      lead.email,
      lead.phone,
      lead.niche,
      lead.message
    )

    if (!sent) {
      await prisma.lead.update({
        where: { id },
        data: {
          providerDeliveryStatus: "failed",
          providerDeliveryNotes: notes || "Email delivery failed.",
        },
      })
      return NextResponse.json({ success: false, error: "Provider email delivery failed." }, { status: 502 })
    }

    const updated = await prisma.lead.update({
      where: { id },
      data: {
        routedToId: provider?.id ?? lead.routedToId,
        routeType: provider ? "primary" : lead.routeType,
        providerDeliveryStatus: "delivered",
        providerDeliveredAt: new Date(),
        providerDeliveredBy: session.user.email ?? "admin",
        providerDeliveryNotes: notes || `Delivered to ${deliveryEmail}`,
      },
    })

    await audit({
      action: "lead.provider_delivered",
      entityType: "lead",
      entityId: id,
      providerId: provider?.id,
      metadata: {
        deliveryEmail,
        providerName,
        requestedProviderSlug: lead.requestedProviderSlug,
        notes,
      },
    })

    return NextResponse.json({
      success: true,
      message: `Lead delivered to ${providerName}`,
      lead: updated,
    })
  } catch (err) {
    logger.error("admin/leads/deliver", "Error delivering lead", err)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
