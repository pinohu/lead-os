import type { Metadata } from "next"
import Link from "next/link"
import { prisma } from "@/lib/db"
import { syncProviderOfferCatalog } from "@/lib/provider-offer-catalog-sync"
import { PROVIDER_OFFER_PLANS } from "@/lib/provider-offer-plans"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Provider Offers | Erie.Pro Admin",
  robots: { index: false, follow: false },
}

export const dynamic = "force-dynamic"

function money(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`
}

export default async function AdminProviderOffersPage() {
  await syncProviderOfferCatalog().catch(() => null)

  const [plans, unmatched, subscriptions] = await Promise.all([
    prisma.providerPlan.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.thriveCartReconciliationItem.count({ where: { status: "unmatched" } }),
    prisma.providerSubscription.count(),
  ])

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Provider offers</h1>
      <p className="text-sm text-muted-foreground">
        Active subscriptions: {subscriptions}. Unmatched ThriveCart items: {unmatched}.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {plans.map((plan) => (
          <Card key={plan.id}>
            <CardHeader>
              <CardTitle className="text-base">{plan.displayName}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                {money(plan.setupFeeCents)} setup / {money(plan.monthlyFeeCents)} mo
              </p>
              <p>Phase: {plan.foundingPhase}</p>
              <p>TC setup: {plan.thriveCartSetupId ?? "not mapped"}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-sm">
        Code catalog: {PROVIDER_OFFER_PLANS.length} plans.{" "}
        <Link href="/admin/thrivecart-events" className="underline">
          Reconciliation queue
        </Link>
      </p>
    </div>
  )
}
