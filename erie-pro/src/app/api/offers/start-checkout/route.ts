// erie-pro/src/app/api/offers/start-checkout/route.ts

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { formatZodErrors } from "@/lib/validation"

const BodySchema = z.object({
  planSlug: z.string(),
  providerId: z.string().optional(),
  email: z.string().email().optional(),
})

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: formatZodErrors(parsed.error) }, { status: 400 })
  }

  const params = new URLSearchParams({ plan: parsed.data.planSlug })
  if (parsed.data.providerId) params.set("providerId", parsed.data.providerId)
  if (parsed.data.email) params.set("email", parsed.data.email)

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin
  const checkoutRes = await fetch(`${origin}/api/offers/checkout-url?${params}`, { cache: "no-store" })
  const checkout = await checkoutRes.json()

  if (!checkoutRes.ok || !checkout.checkoutUrl) {
    return NextResponse.json(
      {
        success: false,
        error: "ThriveCart checkout URL not configured for this plan",
        planSlug: parsed.data.planSlug,
      },
      { status: 503 },
    )
  }

  return NextResponse.json({
    success: true,
    checkoutUrl: checkout.checkoutUrl,
    planSlug: parsed.data.planSlug,
  })
}
