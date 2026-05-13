import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowRight, CheckCircle2, Mail, PackageCheck } from "lucide-react"
import { automatedOffers, getOfferBySlug } from "@/lib/automated-offers"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ serviceSlug?: string; order_id?: string; orderId?: string }>
}

export function generateStaticParams() {
  return automatedOffers
    .filter((offer) => offer.thriveCartFunnel?.successPath)
    .map((offer) => ({ slug: offer.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const offer = getOfferBySlug(slug)
  if (!offer) return { title: "Offer confirmation not found" }
  return {
    title: `${offer.shortTitle} confirmation | Erie.Pro`,
    robots: { index: false, follow: false },
  }
}

export default async function OfferSuccessPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { serviceSlug, order_id, orderId } = await searchParams
  const offer = getOfferBySlug(slug)
  if (!offer) notFound()

  const order = order_id ?? orderId

  return (
    <main className="bg-white text-slate-950">
      <section className="border-b bg-slate-950">
        <div className="mx-auto max-w-4xl px-4 py-16 text-white sm:px-6">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-teal-400/10 px-3 py-1 text-sm font-semibold text-teal-100">
            <CheckCircle2 className="h-4 w-4" />
            Checkout received
          </div>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
            Your {offer.shortTitle} is being prepared.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-200">
            Erie.Pro has received the checkout event. The next step is to prepare your deliverable, connect the right service context, and send access details to your email.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-4xl gap-4 px-4 py-12 sm:px-6 md:grid-cols-3">
        {[
          ["Confirm", "Your purchase details are matched to the correct Erie.Pro offer."],
          ["Prepare", "The service-specific deliverable and follow-up path are created."],
          ["Send", "Access instructions are sent to the email used at checkout."],
        ].map(([title, body]) => (
          <Card key={title}>
            <CardHeader>
              <PackageCheck className="mb-2 h-5 w-5 text-teal-700" />
              <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-slate-600">{body}</CardContent>
          </Card>
        ))}
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-16 sm:px-6">
        <div className="rounded-lg border bg-slate-50 p-5">
          <h2 className="text-lg font-semibold">What happens next</h2>
          <div className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
            <p>Offer: {offer.title}</p>
            {serviceSlug ? <p>Service context: {serviceSlug.replace(/-/g, " ")}</p> : null}
            {order ? <p>Order reference: {order}</p> : null}
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/for-business">
                View provider options
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/contact">
                <Mail className="mr-2 h-4 w-4" />
                Contact Erie.Pro
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
