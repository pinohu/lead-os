import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ProviderOfferDisclaimer } from "@/components/provider-offer-disclaimer"

export const metadata: Metadata = {
  title: "Grow Your Local Authority | Erie.Pro",
  description: "Local Authority Microsites for Erie County service businesses. No guaranteed outcomes.",
}

export default function ProvidersGrowPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">Build local authority without overpromising</h1>
      <p className="mt-4 text-muted-foreground">
        Erie.Pro helps service businesses publish structured microsites, keep profile data consistent, and route
        inquiries when criteria match. We do not guarantee rankings, lead volume, or revenue.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/providers/offers">Compare plans</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/for-business/claim">Claim a listing</Link>
        </Button>
      </div>
      <div className="mt-10 space-y-3">
        <ProviderOfferDisclaimer />
        <ProviderOfferDisclaimer variant="leads" />
      </div>
    </main>
  )
}
