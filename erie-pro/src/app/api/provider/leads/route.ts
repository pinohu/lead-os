// erie-pro/src/app/api/provider/leads/route.ts

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { LEAD_ROUTING_DISCLAIMER } from "@/lib/provider-offer-compliance"

export async function GET(request: NextRequest) {
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

  const page = Math.max(1, Number(request.nextUrl.searchParams.get("page") ?? "1"))
  const pageSize = Math.min(50, Math.max(5, Number(request.nextUrl.searchParams.get("pageSize") ?? "20")))
  const skip = (page - 1) * pageSize

  const [items, total] = await Promise.all([
    prisma.providerLead.findMany({
      where: { providerId: user.providerId },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.providerLead.count({ where: { providerId: user.providerId } }),
  ])

  return NextResponse.json({
    success: true,
    items,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    disclaimer: LEAD_ROUTING_DISCLAIMER,
  })
}
