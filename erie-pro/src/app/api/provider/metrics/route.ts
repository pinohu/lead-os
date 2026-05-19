// erie-pro/src/app/api/provider/metrics/route.ts

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

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

  const provider = await prisma.provider.findUnique({
    where: { id: user.providerId },
    select: {
      totalLeads: true,
      convertedLeads: true,
      avgResponseTime: true,
      lifecycleStatus: true,
      eligibilityTier: true,
    },
  })

  const [microsite, openTasks, providerLeads30d] = await Promise.all([
    prisma.microsite.findFirst({ where: { providerId: user.providerId }, orderBy: { updatedAt: "desc" } }),
    prisma.providerTask.count({ where: { providerId: user.providerId, status: "open" } }),
    prisma.providerLead.count({
      where: {
        providerId: user.providerId,
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    }),
  ])

  return NextResponse.json({
    success: true,
    metrics: {
      platformLeads: provider?.totalLeads ?? 0,
      convertedLeads: provider?.convertedLeads ?? 0,
      avgResponseTimeSeconds: provider?.avgResponseTime ?? 0,
      micrositeQuoteLeads30d: providerLeads30d,
      openTasks,
      lifecycleStatus: provider?.lifecycleStatus,
      eligibilityTier: provider?.eligibilityTier,
      micrositeStatus: microsite?.status ?? null,
      micrositePublishMode: microsite?.publishMode ?? null,
    },
    disclaimer: "Metrics reflect recorded platform activity only, not guaranteed future performance.",
  })
}
