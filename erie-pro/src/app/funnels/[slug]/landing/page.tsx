import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  HeartHandshake,
  Layers3,
  PackageCheck,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react"
import { getFunnelBySlug, getFunnelsForService, salesFunnels } from "@/lib/sales-funnels"
import { getOfferBySlug } from "@/lib/automated-offers"
import { getNicheBySlug } from "@/lib/niches"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { FunnelEventLink } from "@/components/funnel-event-link"

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ service?: string }>
}

function dollars(cents?: number) {
  if (cents === undefined) return null
  if (cents === 0) return "Free"
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
    cents / 100,
  )
}

function label(value: string) {
  return value.replace(/-/g, " ")
}

function publicCta(slug: string, fallback: string) {
  const labels: Record<string, string> = {
    "provider-discovery": "Check my local visibility",
    "lead-readiness-scorecard": "Start my free checkup",
    "service-page-blueprint": "Improve my service page",
    "missed-call-recovery": "Recover missed inquiries",
    "seasonal-booking": "Plan my seasonal campaign",
    "review-reputation": "Improve my reviews",
    "client-portal-starter": "Organize my client intake",
    "convertbox-funnel": "Plan my website lead path",
    "provider-launch": "Set up my provider foundation",
    "growth-intelligence": "Start monthly guidance",
    "government-opportunity": "Track local opportunities",
    "cart-abandonment": "Return to my next step",
    "customer-onboarding": "Open my next step",
    "refund-prevention": "Choose what fits now",
  }
  return labels[slug] ?? fallback.replace(/funnel/gi, "lead path")
}

function withCheckoutContext(
  href: string,
  context: {
    funnelSlug: string
    offerSlug?: string
    serviceSlug?: string
    serviceFamily?: string
    sourcePageType: string
  },
) {
  if (!href.startsWith("http")) return href
  const url = new URL(href)
  url.searchParams.set("funnelSlug", context.funnelSlug)
  url.searchParams.set("sourcePageType", context.sourcePageType)
  if (context.offerSlug) url.searchParams.set("offerSlug", context.offerSlug)
  if (context.serviceSlug) url.searchParams.set("serviceSlug", context.serviceSlug)
  if (context.serviceFamily) url.searchParams.set("serviceFamily", context.serviceFamily)
  url.searchParams.set("utm_source", "erie_pro")
  url.searchParams.set("utm_medium", "funnel_landing")
  url.searchParams.set("utm_campaign", context.funnelSlug)
  return url.toString()
}

export function generateStaticParams() {
  return salesFunnels.map((funnel) => ({ slug: funnel.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const funnel = getFunnelBySlug(slug)
  if (!funnel) return { title: "Funnel landing page not found" }
  return {
    title: `${funnel.publicCopy.title} | Erie.Pro`,
    description: funnel.publicCopy.subtitle,
  }
}

export default async function FunnelLandingPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { service } = await searchParams
  const funnel = getFunnelBySlug(slug)
  if (!funnel) notFound()

  const niche = service ? getNicheBySlug(service) : null
  const serviceRecommendation = niche
    ? getFunnelsForService(niche.slug).find((item) => item.funnel.slug === funnel.slug)
    : null
  const offer = funnel.primaryOfferSlug ? getOfferBySlug(funnel.primaryOfferSlug) : serviceRecommendation?.offer
  const orderBump = funnel.orderBumpSlug ? getOfferBySlug(funnel.orderBumpSlug) : serviceRecommendation?.orderBump
  const price = dollars(offer?.basePriceCents)
  const checkoutHref = withCheckoutContext(offer?.checkoutUrl ?? "/for-business", {
    funnelSlug: funnel.slug,
    offerSlug: offer?.slug,
    serviceSlug: niche?.slug,
    serviceFamily: serviceRecommendation?.serviceFamily,
    sourcePageType: "funnel_landing",
  })
  const serviceLabel = niche?.label ?? "your Erie County service"
  const copy = funnel.publicCopy
  const ctaLabel = publicCta(funnel.slug, funnel.primaryCta)
  const publicTitle = copy.title
  const whereThisHelps =
    niche && funnel.primaryAudience === "provider"
      ? copy.whoItsFor.replace("providers", `${serviceLabel.toLowerCase()} providers`)
      : copy.whoItsFor
  const afterStart = [
    "Clear confirmation of what happens next.",
    "A first action you can take quickly.",
    "Simple guidance to avoid common mistakes.",
    "A practical example so the material feels easier to apply.",
    "A natural next step only when you are ready.",
    "A chance to share feedback so the support keeps improving.",
  ]
  const faqs = [
    ...copy.faq,
    {
      question: "What happens after I click?",
      answer: offer?.checkoutUrl
        ? "You go to the matching checkout with the right service context already selected."
        : "You go to the provider growth page where you can choose the next step that fits.",
    },
  ]

  return (
    <main className="bg-white text-slate-950">
      <section className="border-b bg-slate-950">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_.95fr] lg:py-16">
          <div className="text-white">
            <div className="mb-5 flex flex-wrap gap-2">
              <Badge className="bg-white text-teal-800 hover:bg-white">
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                {copy.eyebrow}
              </Badge>
              {niche ? <Badge className="bg-teal-950 text-white hover:bg-teal-950">{niche.label}</Badge> : null}
            </div>
            <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">{copy.title}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-teal-50">{copy.subtitle}</p>
            <p className="mt-5 max-w-2xl text-sm leading-6 text-teal-50/90">{copy.reassurance}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-12 bg-white px-6 text-teal-800 hover:bg-teal-50">
                <FunnelEventLink
                  href={checkoutHref}
                  eventType="funnel.landing_primary_cta_clicked"
                  funnelSlug={funnel.slug}
                  offerSlug={offer?.slug}
                  serviceSlug={niche?.slug}
                  serviceLabel={niche?.label}
                  serviceFamily={serviceRecommendation?.serviceFamily}
                  visitorSegment={funnel.primaryAudience}
                >
                  {ctaLabel}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </FunnelEventLink>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 border-white bg-white/10 px-6 text-white hover:bg-white hover:text-teal-900">
                <Link href="/for-business">See provider options</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Recommended next step</p>
                <h2 className="mt-2 text-2xl font-bold">{publicTitle}</h2>
              </div>
              {price ? <Badge className="bg-slate-950 text-white hover:bg-slate-950">{price}</Badge> : null}
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">{copy.outcome}</p>
            <div className="mt-6 grid gap-3">
              {[
                ["Where this helps", whereThisHelps, Layers3],
                ["What it helps solve", copy.problem, Target],
                ["Why it is low risk", copy.reassurance, ShieldCheck],
              ].map(([title, body, Icon]) => {
                const Visual = Icon as typeof Layers3
                return (
                  <div key={String(title)} className="flex gap-3 rounded-md border border-slate-200 p-3">
                    <Visual className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" />
                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-500">{String(title)}</p>
                      <p className="mt-1 text-sm text-slate-700">{String(body)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl items-start gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[.8fr_1.2fr]">
        <div>
          <Badge variant="outline">Why this matters</Badge>
          <h2 className="mt-4 text-3xl font-bold">{copy.outcome}</h2>
          <p className="mt-4 leading-7 text-slate-600">{copy.problem}</p>
          <p className="mt-4 leading-7 text-slate-600">{copy.reassurance}</p>
        </div>
        <div className="grid self-start gap-4 sm:grid-cols-2">
          {copy.included.slice(0, 4).map((outcome, index) => {
            const icons = [Target, ShieldCheck, PackageCheck, HeartHandshake]
            const Icon = icons[index] ?? CheckCircle2
            return (
              <Card key={outcome} className="border-slate-200">
                <CardContent className="p-5">
                  <Icon className="mb-4 h-6 w-6 text-teal-700" />
                  <p className="text-sm leading-6 text-slate-700">{outcome}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      <section className="bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="max-w-2xl">
            <Badge variant="outline">What you receive</Badge>
            <h2 className="mt-4 text-3xl font-bold">Clear assets you can actually use.</h2>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {copy.included.map((item) => (
              <div key={item} className="flex min-h-0 items-start gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" />
                <p className="text-sm leading-6 text-slate-700">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid items-start gap-8 lg:grid-cols-[1fr_1fr]">
          <div>
            <Badge variant="outline">How it works</Badge>
            <h2 className="mt-4 text-3xl font-bold">A simple path from interest to action.</h2>
            <div className="mt-8 space-y-4">
              {copy.steps.map((step, index) => (
                <div key={step} className="flex gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-700 text-sm font-bold text-white">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold">Step {index + 1}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{step}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-950 p-6 text-white">
            <PackageCheck className="h-8 w-8 text-teal-300" />
            <h2 className="mt-4 text-2xl font-bold">What is included</h2>
            <div className="mt-6 space-y-3">
              {copy.included.map((item) => (
                <div key={item} className="rounded-md bg-white/10 p-3 text-sm text-slate-100">{item}</div>
              ))}
              {orderBump ? (
                <div className="rounded-md bg-teal-400 p-3 text-sm font-medium text-teal-950">
                  Optional add-on: {orderBump.title}
                </div>
              ) : null}
            </div>
            <Button asChild className="mt-7 h-12 w-full bg-white text-slate-950 hover:bg-slate-100">
              <FunnelEventLink
                href={checkoutHref}
                eventType="funnel.landing_value_stack_cta_clicked"
                funnelSlug={funnel.slug}
                offerSlug={offer?.slug}
                serviceSlug={niche?.slug}
                serviceLabel={niche?.label}
                serviceFamily={serviceRecommendation?.serviceFamily}
                visitorSegment={funnel.primaryAudience}
              >
                {ctaLabel}
                <ArrowRight className="ml-2 h-4 w-4" />
              </FunnelEventLink>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-y bg-slate-50">
        <div className="mx-auto grid max-w-6xl items-start gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <Badge variant="outline">After you start</Badge>
            <h2 className="mt-4 text-3xl font-bold">You are guided toward the first useful action.</h2>
            <p className="mt-4 leading-7 text-slate-600">
              Each offer is designed to make the next step clear so the material does not sit unused.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {afterStart.map((item) => (
              <div key={item} className="flex min-h-0 items-start gap-3 rounded-md border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700">
                <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <h2 className="text-3xl font-bold">Questions before you start</h2>
        <Accordion type="single" collapsible className="mt-6">
          {faqs.map((faq) => (
            <AccordionItem key={faq.question} value={faq.question}>
              <AccordionTrigger>{faq.question}</AccordionTrigger>
              <AccordionContent>{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <section className="bg-teal-800">
        <div className="mx-auto max-w-4xl px-4 py-12 text-center text-white sm:px-6">
          <h2 className="text-3xl font-bold">{copy.title}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-teal-50">{copy.subtitle}</p>
          <Button asChild size="lg" className="mt-8 h-12 bg-white px-6 text-teal-800 hover:bg-teal-50">
            <FunnelEventLink
              href={checkoutHref}
              eventType="funnel.landing_final_cta_clicked"
              funnelSlug={funnel.slug}
              offerSlug={offer?.slug}
              serviceSlug={niche?.slug}
              serviceLabel={niche?.label}
              serviceFamily={serviceRecommendation?.serviceFamily}
              visitorSegment={funnel.primaryAudience}
            >
              {ctaLabel}
              <ArrowRight className="ml-2 h-4 w-4" />
            </FunnelEventLink>
          </Button>
        </div>
      </section>
    </main>
  )
}
