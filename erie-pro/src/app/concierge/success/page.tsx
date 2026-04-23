import type { Metadata } from "next"
import Link from "next/link"
import { CheckCircle2, ArrowRight, Clock, Phone } from "lucide-react"
import { cityConfig } from "@/lib/city-config"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Thanks — we're on it",
  robots: { index: false, follow: false },
}

export default async function ConciergeSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string; plan?: string; dry_run?: string }>
}) {
  const params = await searchParams
  const isAnnual = params.plan === "annual"

  return (
    <main className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
      <Card className="border-2 border-primary/40 shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl">
            {isAnnual ? "You're an Annual Member — welcome." : "We're on it."}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 text-sm">
          <p>
            {isAnnual
              ? `Thanks for joining. You now have unlimited Concierge matches for the next 12 months, same-day priority on every request, and our reliability guarantee.`
              : `Thanks for upgrading to Concierge. We'll call 2–3 vetted ${cityConfig.name} pros, confirm price and availability, and text you the one to book.`}
          </p>

          <ul className="space-y-3 rounded-md border bg-muted/40 p-4">
            <li className="flex items-start gap-2">
              <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
              <span>
                <strong>Response time:</strong> same-day on weekdays, usually
                within 2 hours during business hours.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Phone className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
              <span>
                <strong>Next step:</strong> expect a text from{" "}
                <code className="rounded bg-background px-1 py-0.5 text-xs">
                  (814) 200-0328
                </code>{" "}
                with the pro&apos;s name, price quote, and booking link.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
              <span>
                <strong>If we can&apos;t match you:</strong> we refund you in
                full — no questions.
              </span>
            </li>
          </ul>

          {params.dry_run && (
            <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
              Dry-run mode: no real charge was made. Session:{" "}
              <code>{params.session_id}</code>
            </p>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild className="flex-1">
              <Link href="/">
                Back to {cityConfig.domain}
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <a href={`mailto:hello@${cityConfig.domain}?subject=Concierge%20request`}>
                Email us the details
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
