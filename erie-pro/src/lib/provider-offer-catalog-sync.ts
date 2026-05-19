// erie-pro/src/lib/provider-offer-catalog-sync.ts

import type { Prisma } from "@/generated/prisma"
import { prisma } from "@/lib/db"
import { planDisclaimersJson, PROVIDER_OFFER_PLANS } from "@/lib/provider-offer-plans"

export async function syncProviderOfferCatalog() {
  const disclaimers = planDisclaimersJson()
  for (const plan of PROVIDER_OFFER_PLANS) {
    await prisma.providerPlan.upsert({
      where: { slug: plan.slug },
      create: {
        slug: plan.slug,
        displayName: plan.displayName,
        setupFeeCents: plan.setupFeeCents,
        monthlyFeeCents: plan.monthlyFeeCents,
        monthlyFeeMinCents: plan.monthlyFeeMinCents ?? null,
        foundingPhase: plan.foundingPhase,
        maintenanceLimits: plan.maintenanceLimits as unknown as Prisma.InputJsonValue,
        valueStack: plan.valueStack as unknown as Prisma.InputJsonValue,
        disclaimers,
        thriveCartSetupId: plan.thriveCartSetupId ?? null,
        thriveCartMonthlyId: plan.thriveCartMonthlyId ?? null,
        sortOrder: PROVIDER_OFFER_PLANS.indexOf(plan) * 10,
      },
      update: {
        displayName: plan.displayName,
        setupFeeCents: plan.setupFeeCents,
        monthlyFeeCents: plan.monthlyFeeCents,
        foundingPhase: plan.foundingPhase,
        maintenanceLimits: plan.maintenanceLimits as unknown as Prisma.InputJsonValue,
        valueStack: plan.valueStack as unknown as Prisma.InputJsonValue,
        disclaimers,
      },
    })
  }
}
