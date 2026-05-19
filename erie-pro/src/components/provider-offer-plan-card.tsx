// erie-pro/src/components/provider-offer-plan-card.tsx

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { ProviderOfferPlanDefinition } from "@/lib/provider-offer-plans"
import { FOUNDING_PHASE_LABELS } from "@/lib/provider-offer-plans"
import { ProviderOfferDisclaimer } from "@/components/provider-offer-disclaimer"

function money(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`
}

export function ProviderOfferPlanCard({ plan }: { plan: ProviderOfferPlanDefinition }) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle>{plan.displayName}</CardTitle>
        <CardDescription>{FOUNDING_PHASE_LABELS[plan.foundingPhase]}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="space-y-1 text-sm">
          <p>
            <span className="text-muted-foreground">Setup</span> {money(plan.setupFeeCents)}
          </p>
          <p>
            <span className="text-muted-foreground">Monthly</span> {money(plan.monthlyFeeCents)}
            {plan.monthlyFeeMinCents ? "+" : ""}
          </p>
        </div>
        <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
          {plan.valueStack.slice(0, 3).map((item) => (
            <li key={item.label}>{item.label}</li>
          ))}
        </ul>
        <ProviderOfferDisclaimer variant="founding" />
        <Button asChild className="mt-auto w-full">
          <Link href={`/providers/offers/${plan.slug}`}>View plan</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
