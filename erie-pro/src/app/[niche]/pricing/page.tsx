import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import {
  DollarSign,
  ArrowRight,
  Info,
  TrendingUp,
  BriefcaseBusiness,
  CheckCircle2,
  ExternalLink,
} from "lucide-react"
import { cityConfig } from "@/lib/city-config"
import { getNicheBySlug } from "@/lib/niches"
import { getNicheContent, getAllNicheSlugs } from "@/lib/niche-content"
import {
  buildOfferVariantCopy,
  getOfferBySlug,
  getServiceOfferRecommendations,
  inferServiceFamily,
  type AutomatedOfferSlug,
} from "@/lib/automated-offers"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { InternalLinks } from "@/components/internal-links"
import { SeoLaunchEnhancement } from "@/components/seo-launch-enhancement"
import { FunnelEventLink } from "@/components/funnel-event-link"

type Props = { params: Promise<{ niche: string }> }

const offerFunnelSlugs: Partial<Record<AutomatedOfferSlug, string>> = {
  "erie-lead-readiness-scorecard": "lead-readiness-scorecard",
  "service-page-conversion-blueprint": "service-page-blueprint",
  "provider-launch-kit": "provider-launch",
  "growth-intelligence-subscription": "growth-intelligence",
  "convertbox-funnel-in-a-box": "convertbox-funnel",
  "review-reputation-growth-kit": "review-reputation",
  "missed-call-recovery-kit": "missed-call-recovery",
  "seasonal-booking-campaign-pack": "seasonal-booking",
  "government-opportunity-scanner": "government-opportunity",
  "client-portal-starter-pack": "client-portal-starter",
}

function formatPrice(cents: number) {
  if (cents === 0) return "Free"
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

function buildProviderCheckoutUrl(input: {
  checkoutUrl: string
  offerSlug: string
  funnelSlug?: string
  serviceSlug: string
  serviceLabel: string
  serviceFamily: string
}) {
  const checkout = new URL(input.checkoutUrl)
  checkout.searchParams.set("offerSlug", input.offerSlug)
  if (input.funnelSlug) checkout.searchParams.set("funnelSlug", input.funnelSlug)
  checkout.searchParams.set("serviceSlug", input.serviceSlug)
  checkout.searchParams.set("serviceLabel", input.serviceLabel)
  checkout.searchParams.set("serviceFamily", input.serviceFamily)
  checkout.searchParams.set("sourcePageType", "service_pricing_page")
  checkout.searchParams.set("sourcePage", `/${input.serviceSlug}/pricing`)
  checkout.searchParams.set("visitorSegment", "provider")
  checkout.searchParams.set("utm_source", "erie_pro")
  checkout.searchParams.set("utm_medium", "service_pricing_page")
  checkout.searchParams.set("utm_campaign", `${input.serviceSlug}_provider_offers`)
  return checkout.toString()
}

export function generateStaticParams() {
  return getAllNicheSlugs().map((slug) => ({ niche: slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { niche: slug } = await params
  const niche = getNicheBySlug(slug)
  const content = getNicheContent(slug)
  if (!niche || !content) return { title: "Not Found" }
  return {
    title: `${niche.label} Costs in ${cityConfig.name}, ${cityConfig.stateCode} — Pricing Guide`,
    description: `How much does ${content.serviceLabel} cost in ${cityConfig.name}? See average prices for common services and get a free quote.`,
    alternates: { canonical: `https://${cityConfig.domain}/${slug}/pricing` },
  }
}

export default async function NichePricingPage({ params }: Props) {
  const { niche: slug } = await params
  const niche = getNicheBySlug(slug)
  const content = getNicheContent(slug)
  if (!niche || !content) notFound()
  const serviceFamily = inferServiceFamily(niche.slug)
  const providerRecommendations = getServiceOfferRecommendations(niche)
  const freeScorecardRecommendation = providerRecommendations.find(
    (recommendation) => recommendation.offerSlug === "erie-lead-readiness-scorecard",
  )
  const paidProviderOffers = providerRecommendations
    .map((recommendation) => ({
      recommendation,
      offer: getOfferBySlug(recommendation.offerSlug),
    }))
    .filter((item) => item.offer?.checkoutUrl && item.offer.basePriceCents > 0)
    .slice(0, 3)

  const pricingJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `https://${cityConfig.domain}/${slug}/pricing#pricelist`,
    name: `${niche.label} Pricing in ${cityConfig.name}, ${cityConfig.stateCode}`,
    description: `Average prices for ${content.serviceLabel} in ${cityConfig.name}. Updated for ${new Date().getFullYear()}.`,
    numberOfItems: content.pricingRanges.length,
    itemListElement: content.pricingRanges.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.service,
      description: item.range,
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingJsonLd) }}
      />
      <main>
      {/* ── Breadcrumb ────────────────────────────────────────── */}
      <div className="border-b bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 py-3 sm:px-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={`/${slug}`}>{niche.label}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Pricing</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="border-b bg-muted/30 pb-12 pt-10">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Badge variant="secondary" className="mb-4">
            <DollarSign className="mr-1.5 h-3 w-3" />
            Pricing Guide
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            How Much Does {niche.label} Cost in{" "}
            {cityConfig.name}, {cityConfig.stateCode}?
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Average prices for common {content.serviceLabel} in the Erie
            area. Updated for {new Date().getFullYear()}.
          </p>
        </div>
      </section>

      {/* ── Pricing Table ─────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              {cityConfig.name} {niche.label} Pricing
            </CardTitle>
            <CardDescription>
              Average costs based on {cityConfig.name}-area providers.
              Actual prices depend on job scope, complexity, and materials.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableCaption>
                Prices are estimates for {cityConfig.name},{" "}
                {cityConfig.stateCode} as of {new Date().getFullYear()}.
                Get a personalized quote for your specific needs.
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60%]">Service</TableHead>
                  <TableHead className="text-right">
                    Typical Price Range
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {content.pricingRanges.map((item, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">
                      {item.service}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {item.range}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      {/* ── Pricing Factors ───────────────────────────────────── */}
      <section className="bg-muted/50 py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="mb-8 text-2xl font-bold tracking-tight">
            What Affects {niche.label} Pricing in{" "}
            {cityConfig.name}?
          </h2>
          <div className="space-y-6">
            <Card>
              <CardContent className="flex items-start gap-4 pt-6">
                <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                <div>
                  <h3 className="font-semibold">
                    Erie&apos;s Climate and Conditions
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Lake effect weather, harsh winters, and heavy snowfall
                    create unique demands on {content.serviceLabel}. Materials
                    and techniques must withstand freeze-thaw cycles, which can
                    affect pricing compared to milder regions.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-start gap-4 pt-6">
                <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                <div>
                  <h3 className="font-semibold">
                    Home Age and Condition
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Many Erie homes were built before 1960. Older homes often
                    require additional work to bring systems up to current
                    Pennsylvania codes, which can add to project costs.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-start gap-4 pt-6">
                <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                <div>
                  <h3 className="font-semibold">
                    Seasonal Demand
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Prices and availability fluctuate with the seasons.
                    Emergency services during winter storms command premium
                    rates, while scheduling work in the off-season can offer
                    better pricing and availability.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-start gap-4 pt-6">
                <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                <div>
                  <h3 className="font-semibold">
                    Licensing and Permits
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Pennsylvania licensing requirements and Erie municipal
                    permits protect consumers but add modest costs. Always
                    verify your provider is properly licensed — unlicensed
                    work may seem cheaper but carries significant risks.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section className="py-12">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <h2 className="text-xl font-bold">
            Get an Exact Price for Your Project
          </h2>
          <p className="mt-2 text-muted-foreground">
            These are averages. Get a free, personalized quote from a
            verified {niche.label.toLowerCase()} provider in{" "}
            {cityConfig.name}.
          </p>
          <Button asChild size="lg" className="mt-6">
            <Link href={`/${slug}#quote`}>
              {content.ctaPrimary}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="border-y bg-slate-950 py-14 text-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <Badge className="border-white/20 bg-white/10 text-white hover:bg-white/10">
                <BriefcaseBusiness className="mr-1.5 h-3.5 w-3.5" />
                For Erie County {niche.label.toLowerCase()} providers
              </Badge>
              <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
                Turn this pricing interest into better local inquiries.
              </h2>
              <p className="mt-4 text-sm leading-6 text-slate-200">
                If you provide {niche.label.toLowerCase()} in Erie County, this page
                shows what buyers are trying to understand before they contact someone.
                Use that intent to improve your page, proof, response path, and follow-up.
              </p>
              <div className="mt-6 rounded-md border border-white/15 bg-white/10 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-300" />
                  <div>
                    <p className="font-semibold text-white">
                      Start with the lowest-friction diagnostic.
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-200">
                      See whether local buyers can quickly understand your offer,
                      trust your proof, and take the right next step.
                    </p>
                    {freeScorecardRecommendation ? (
                      <Button asChild className="mt-4 bg-white text-slate-950 hover:bg-slate-100">
                        <FunnelEventLink
                          href={`/funnels/lead-readiness-scorecard/landing?service=${niche.slug}&sourcePageType=service_pricing_page&utm_source=erie_pro&utm_medium=service_pricing_page&utm_campaign=${niche.slug}_provider_scorecard`}
                          eventType="service_pricing.scorecard_clicked"
                          funnelSlug="lead-readiness-scorecard"
                          offerSlug={freeScorecardRecommendation.offerSlug}
                          serviceSlug={niche.slug}
                          serviceLabel={niche.label}
                          serviceFamily={serviceFamily}
                          visitorSegment="provider"
                          sourcePageType="service_pricing_page"
                        >
                          Get my free scorecard
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </FunnelEventLink>
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              {paidProviderOffers.map(({ recommendation, offer }) => {
                if (!offer?.checkoutUrl) return null
                const copy = buildOfferVariantCopy(offer, niche)
                const checkoutUrl = buildProviderCheckoutUrl({
                  checkoutUrl: offer.checkoutUrl,
                  offerSlug: offer.slug,
                  funnelSlug: offerFunnelSlugs[offer.slug],
                  serviceSlug: niche.slug,
                  serviceLabel: niche.label,
                  serviceFamily,
                })
                return (
                  <Card key={offer.slug} className="border-white/15 bg-white text-slate-950">
                    <CardHeader className="pb-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <CardTitle className="text-lg">{copy.subheadline}</CardTitle>
                          <CardDescription className="mt-2 text-slate-600">
                            {recommendation.conversionAngle}
                          </CardDescription>
                        </div>
                        <div className="text-left text-xl font-bold sm:text-right">
                          {formatPrice(offer.basePriceCents)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-6 text-slate-700">
                        {copy.promise}
                      </p>
                      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          {recommendation.urgency} path · {serviceFamily}
                        </p>
                        <Button asChild size="sm">
                          <FunnelEventLink
                            href={checkoutUrl}
                            eventType="service_pricing.provider_checkout_clicked"
                            funnelSlug={offerFunnelSlugs[offer.slug]}
                            offerSlug={offer.slug}
                            serviceSlug={niche.slug}
                            serviceLabel={niche.label}
                            serviceFamily={serviceFamily}
                            visitorSegment="provider"
                            sourcePageType="service_pricing_page"
                          >
                            {offer.primaryCta}
                            <ExternalLink className="ml-2 h-4 w-4" />
                          </FunnelEventLink>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <SeoLaunchEnhancement nicheSlug={slug} nicheLabel={niche.label} pageType="pricing" />

      <InternalLinks niche={slug} currentPage="pricing" />
    </main>
    </>
  )
}
