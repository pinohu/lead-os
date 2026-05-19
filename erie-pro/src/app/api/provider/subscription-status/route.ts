// erie-pro/src/app/api/provider/subscription-status/route.ts

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { PROVIDER_OFFER_DISCLAIMERS } from "@/lib/provider-offer-compliance"

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { providerId: true },
  })
  if (!user?.providerId) {
    return NextResponse.json({ success: false, error: "No provider profile" }, { status: 404 })
  }

  const subscription = await prisma.providerSubscription.findUnique({
    where: { providerId: user.providerId },
    include: { plan: true, provider: { select: { lifecycleStatus: true, eligibilityTier: true } } },
  })

  return NextResponse.json({
    success: true,
    subscription,
    disclaimer: PROVIDER_OFFER_DISCLAIMERS.general,
  })
}
