// erie-pro/src/app/api/offers/checkout-url/route.ts

import { NextRequest, NextResponse } from "next/server"
import { getProviderOfferPlan } from "@/lib/provider-offer-plans"
import { syncProviderOfferCatalog } from "@/lib/provider-offer-catalog-sync"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  const planSlug = request.nextUrl.searchParams.get("plan") ?? "starter"
  const providerId = request.nextUrl.searchParams.get("providerId")
  await syncProviderOfferCatalog().catch(() => null)

  const def = getProviderOfferPlan(planSlug)
  if (!def) {
    return NextResponse.json({ success: false, error: "Unknown plan" }, { status: 404 })
  }

  const dbPlan = await prisma.providerPlan.findUnique({ where: { slug: planSlug } })
  const productId = dbPlan?.thriveCartSetupId ?? def.thriveCartSetupId
  const account = process.env.THRIVECART_ACCOUNT_SLUG ?? "relgard"
  const base = productId
    ? `https://${account}.thrivecart.com/`
    : null

  const passthrough = new URLSearchParams({
    plan_slug: planSlug,
    source_page_type: "provider_offer_checkout",
    ...(providerId ? { provider_id: providerId } : {}),
  })

  return NextResponse.json({
    success: true,
    planSlug,
    checkoutUrl: base ? `${base}?${passthrough}` : null,
    thriveCartProductId: productId ?? null,
    disclaimer: "Checkout completes in ThriveCart. Payment does not guarantee microsite publication or lead volume.",
  })
}
