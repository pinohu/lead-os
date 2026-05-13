import Link from "next/link"
import type { Metadata } from "next"
import { ArrowRight, Calculator, DollarSign, ShieldCheck } from "lucide-react"
import { automatedOffers } from "@/lib/automated-offers"
import { cityConfig } from "@/lib/city-config"
import { niches } from "@/lib/niches"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export const metadata: Metadata = {
  title: "Pricing Guides",
  description: `Compare Erie, PA local service pricing guides for plumbing, HVAC, roofing, dental, legal, auto repair, restoration, and more. Request a provider quote before hiring.`,
  alternates: { canonical: `https://${cityConfig.domain}/pricing` },
}

const featuredPricingSlugs = [
  "plumbing",
  "hvac",
  "electrical",
  "roofing",
  "restoration",
  "garage-door",
  "foundation",
  "dental",
  "legal",
  "auto-repair",
  "pest-control",
  "snow-removal",
]

function providerCheckoutUrl(url: string, offerSlug: string) {
  const checkout = new URL(url)
  checkout.searchParams.set("offerSlug", offerSlug)
  checkout.searchParams.set("sourcePageType", "pricing_page")
  checkout.searchParams.set("utm_source", "erie_pro")
  checkout.searchParams.set("utm_medium", "pricing_page")
  checkout.searchParams.set("utm_campaign", "provider_offers")
  return checkout.toString()
}

export default function PricingGuidesPage() {
  const featured = featuredPricingSlugs
    .map((slug) => niches.find((n) => n.slug === slug))
    .filter(Boolean) as typeof niches
  const providerOffers = automatedOffers.filter((offer) => offer.basePriceCents > 0 && offer.checkoutUrl)

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `https://${cityConfig.domain}/pricing#webpage`,
        name: `Pricing Guides | ${cityConfig.domain}`,
        url: `https://${cityConfig.domain}/pricing`,
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: `https://${cityConfig.domain}` },
            { "@type": "ListItem", position: 2, name: "Pricing Guides", item: `https://${cityConfig.domain}/pricing` },
          ],
        },
      },
      {
        "@type": "ItemList",
        "@id": `https://${cityConfig.domain}/pricing#pricing-guides`,
        name: `Pricing Guides | ${cityConfig.domain}`,
        numberOfItems: niches.length,
        itemListElement: niches.map((niche, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: `${niche.label} pricing`,
          url: `https://${cityConfig.domain}/${niche.slug}/pricing`,
        })),
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main>
        <div className="border-b bg-muted/30">
          <div className="mx-auto max-w-5xl px-4 py-3 sm:px-6">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/">Home</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Pricing Guides</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>

        <section className="border-b bg-muted/30 py-12">
          <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
            <Badge variant="secondary" className="mb-4">
              <Calculator className="mr-1.5 h-3.5 w-3.5" />
              Cost research
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
              Pricing guides for Erie services
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
              Compare common cost factors before you request help. Prices vary by scope,
              provider, materials, timing, permits, and site conditions, so final quotes
              should come from the provider after reviewing your job.
            </p>
            <div className="mt-8">
              <Button asChild size="lg">
                <Link href="/get-matched">
                  Get a personalized match
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold">Most-used pricing guides</h2>
            <Badge variant="outline">{niches.length} total guides</Badge>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((niche) => (
              <Card key={niche.slug} className="transition-colors hover:border-primary/40">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <span>{niche.icon}</span>
                    {niche.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-sm leading-6 text-muted-foreground">
                    {niche.description}
                  </p>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/${niche.slug}/pricing`}>View pricing guide</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="border-t bg-muted/30 py-12">
          <div className="mx-auto grid max-w-5xl gap-4 px-4 sm:px-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <DollarSign className="mb-2 h-5 w-5 text-primary" />
                <CardTitle>Use pricing as a planning tool</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-6 text-muted-foreground">
                Online ranges help you compare likely cost drivers. Final pricing should
                be confirmed by a provider after reviewing the work, access, timing, and materials.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <ShieldCheck className="mb-2 h-5 w-5 text-primary" />
                <CardTitle>Avoid unsupported price claims</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-6 text-muted-foreground">
                Erie.pro should not invent guaranteed prices, medical costs, legal fees,
                insurance outcomes, or licensed-work estimates without verified support.
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Badge variant="outline" className="mb-3">For Erie County providers</Badge>
              <h2 className="text-2xl font-bold">Provider growth packages</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Choose a focused Erie.Pro package when you want your service page, follow-up, reviews, seasonal demand, or opportunity tracking to work harder.
              </p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {providerOffers.map((offer) => (
              <Card key={offer.slug} className="transition-colors hover:border-primary/40">
                <CardHeader>
                  <CardTitle className="text-lg">{offer.shortTitle}</CardTitle>
                  <div className="text-2xl font-bold">
                    {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(offer.basePriceCents / 100)}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-sm leading-6 text-muted-foreground">{offer.description}</p>
                  <Button asChild size="sm">
                    <Link href={providerCheckoutUrl(offer.checkoutUrl!, offer.slug)}>
                      {offer.primaryCta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </>
  )
}
