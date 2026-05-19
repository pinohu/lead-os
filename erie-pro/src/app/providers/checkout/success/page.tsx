import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ProviderOfferDisclaimer } from "@/components/provider-offer-disclaimer"

export default function ProviderCheckoutSuccessPage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
      <h1 className="text-2xl font-bold">Payment received</h1>
      <p className="mt-4 text-muted-foreground">
        ThriveCart confirmed your order. Provisioning starts when we can match your payment to a provider profile with minimum data.
        Publication still requires verification and our data-quality review.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Button asChild>
          <Link href="/providers/onboarding">Continue onboarding</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/provider/dashboard">Provider dashboard</Link>
        </Button>
      </div>
      <div className="mt-8 text-left">
        <ProviderOfferDisclaimer />
      </div>
    </main>
  )
}
