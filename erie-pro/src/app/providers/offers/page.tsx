import type { Metadata } from "next"
import { ProviderOfferPlanCard } from "@/components/provider-offer-plan-card"
import { ProviderOfferDisclaimer } from "@/components/provider-offer-disclaimer"
import { PROVIDER_OFFER_PLANS } from "@/lib/provider-offer-plans"
import { syncProviderOfferCatalog } from "@/lib/provider-offer-catalog-sync"

export const metadata: Metadata = {
  title: "Local Authority Plans | Erie.Pro",
  robots: { index: true, follow: true },
}

export default async function ProviderOffersPage() {
  await syncProviderOfferCatalog().catch(() => null)

  return (
    <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold">Local Authority Microsite plans</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Founding pricing follows platform maturity phases. Replacement values illustrate comparable services, not promised results.
      </p>
      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {PROVIDER_OFFER_PLANS.map((plan) => (
          <ProviderOfferPlanCard key={plan.slug} plan={plan} />
        ))}
      </div>
      <div className="mt-10">
        <ProviderOfferDisclaimer />
      </div>
    </main>
  )
}
