import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Your Erie.Pro offer is being prepared",
  description: "Confirmation page for Erie.Pro automated offer purchases.",
}

export default function OfferThankYouPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-20 text-center">
        <CheckCircle2 className="mb-6 h-14 w-14 text-emerald-400" aria-hidden="true" />
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-emerald-300">
          Purchase received
        </p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Your Erie County growth asset is being generated.
        </h1>
        <p className="mt-5 text-lg leading-8 text-slate-200">
          Check your email for the delivery link. Erie.Pro also stores the purchase and fulfillment record so
          follow-up can stay coordinated across the provider workflow.
        </p>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" className="bg-emerald-400 text-slate-950 hover:bg-emerald-300">
            <Link href="/for-business">Back to provider tools</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20">
            <Link href="/services">Explore Erie services</Link>
          </Button>
        </div>
      </section>
    </main>
  )
}
