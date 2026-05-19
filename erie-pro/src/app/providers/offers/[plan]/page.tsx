import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ProviderOfferCheckoutButton } from "@/components/provider-offer-checkout-button"
import { ProviderOfferDisclaimer } from "@/components/provider-offer-disclaimer"
import { getProviderOfferPlan, PROVIDER_OFFER_PLANS, FOUNDING_PHASE_LABELS } from "@/lib/provider-offer-plans"

type PageProps = { params: Promise<{ plan: string }> }

export async function generateStaticParams() {
  return PROVIDER_OFFER_PLANS.map((plan) => ({ plan: plan.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { plan: slug } = await params
  const plan = getProviderOfferPlan(slug)
  if (!plan) return { title: "Plan not found" }
  return { title: `${plan.displayName} | Erie.Pro` }
}

function money(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`
}

export default async function ProviderOfferPlanPage({ params }: PageProps) {
  const { plan: slug } = await params
  const plan = getProviderOfferPlan(slug)
  if (!plan) notFound()

  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-sm text-muted-foreground">{FOUNDING_PHASE_LABELS[plan.foundingPhase]}</p>
      <h1 className="mt-2 text-3xl font-bold">{plan.displayName}</h1>
      <p className="mt-4 text-lg">
        {money(plan.setupFeeCents)} setup · {money(plan.monthlyFeeCents)}/mo
      </p>
      <ul className="mt-8 space-y-4">
        {plan.valueStack.map((item) => (
          <li key={item.label} className="rounded-lg border p-4">
            <p className="font-medium">{item.label}</p>
            <p className="mt-1 text-sm text-muted-foreground">{item.strategicValueNote}</p>
            {item.replacementValueCents ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Comparable value reference: {money(item.replacementValueCents)} (not a guarantee or refund amount)
              </p>
            ) : null}
          </li>
        ))}
      </ul>
      <div className="mt-8 space-y-3">
        <p className="text-sm text-muted-foreground">
          Maintenance limits: {plan.maintenanceLimits.contentUpdatesPerMonth} content updates/mo,{" "}
          {plan.maintenanceLimits.seoTuneUpsPerQuarter} SEO tune-ups/quarter (operational support, not ranking promises).
        </p>
        <ProviderOfferDisclaimer />
        <ProviderOfferDisclaimer variant="microsite" />
      </div>
      <div className="mt-6">
        <ProviderOfferCheckoutButton planSlug={plan.slug} />
      </div>
    </main>
  )
}
