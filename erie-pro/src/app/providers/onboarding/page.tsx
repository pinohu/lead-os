import Link from "next/link"
import { ProviderOfferDisclaimer } from "@/components/provider-offer-disclaimer"

const steps = [
  "Confirm business name, phone, and service category",
  "Complete ownership verification (email, phone, or admin review)",
  "Review draft microsite — publication may stay in review until data quality passes",
  "Connect notification preferences in the provider dashboard",
]

export default function ProviderOnboardingPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-bold">Provider onboarding</h1>
      <p className="mt-2 text-muted-foreground">
        Payment activates your subscription record. Trust and publish steps are separate.
      </p>
      <ol className="mt-8 list-decimal space-y-3 pl-6">
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <p className="mt-8">
        <Link href="/provider/dashboard" className="text-primary underline">
          Open provider dashboard
        </Link>
      </p>
      <div className="mt-8">
        <ProviderOfferDisclaimer variant="microsite" />
      </div>
    </main>
  )
}
