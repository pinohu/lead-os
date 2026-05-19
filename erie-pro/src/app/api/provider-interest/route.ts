// erie-pro/src/app/api/provider-interest/route.ts

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { checkRateLimit } from "@/lib/rate-limit"
import { formatZodErrors } from "@/lib/validation"

const BodySchema = z.object({
  email: z.string().email(),
  businessName: z.string().optional(),
  phone: z.string().optional(),
  niche: z.string().optional(),
  planSlug: z.string().optional(),
  sourcePage: z.string().optional(),
  convertBoxId: z.string().optional(),
})

export async function POST(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, "provider-interest")
  if (rateLimited) return rateLimited

  const body = await request.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: formatZodErrors(parsed.error) }, { status: 400 })
  }

  const interest = await prisma.providerInterest.create({
    data: {
      email: parsed.data.email.toLowerCase().trim(),
      businessName: parsed.data.businessName,
      phone: parsed.data.phone,
      niche: parsed.data.niche,
      planSlug: parsed.data.planSlug,
      sourcePage: parsed.data.sourcePage,
      convertBoxId: parsed.data.convertBoxId,
    },
  })

  return NextResponse.json({ success: true, id: interest.id })
}
