// erie-pro/src/components/seo/area-niche-matrix-content.tsx
import Link from "next/link"
import { ArrowRight, MapPin, Star } from "lucide-react"
import { cityConfig } from "@/lib/city-config"
import type { LocalNiche } from "@/lib/niches"
import type { ServiceAreaEntry } from "@/lib/area-registry"
import type { LocalNicheContent } from "@/lib/niche-content"
import { getAreaNicheCanonicalPath, getAreaNicheCanonicalUrl } from "@/lib/area-niche-urls"
import { getModifiersForNiche } from "@/lib/service-modifiers"
import type { AggregateRatingSummary } from "@/lib/listing-aggregate-rating"
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
import { InternalLinks } from "@/components/internal-links"

interface DirectoryListingCard {
  id: string
  slug: string
  businessName: string
  rating: number | null
  reviewCount: number
}

interface AreaNicheMatrixContentProps {
  niche: LocalNiche
  area: ServiceAreaEntry
  content: LocalNicheContent
  listings: DirectoryListingCard[]
  aggregate: AggregateRatingSummary | null
}

export function AreaNicheMatrixContent({
  niche,
  area,
  content,
  listings,
  aggregate,
}: AreaNicheMatrixContentProps) {
  const canonicalPath = getAreaNicheCanonicalPath(niche.slug, area.slug)
  const pageUrl = getAreaNicheCanonicalUrl(niche.slug, area.slug)
  const serviceName = `${niche.label} in ${area.label}, ${cityConfig.stateCode}`
  const modifiers = getModifiersForNiche(niche.slug)

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "@id": `${pageUrl}#service`,
        name: serviceName,
        description: content.metaDescription ?? niche.description,
        areaServed: {
          "@type": "City",
          name: area.label,
          containedInPlace: { "@type": "State", name: cityConfig.state },
        },
        provider: {
          "@type": "Organization",
          name: cityConfig.domain,
          url: `https://${cityConfig.domain}`,
        },
        ...(aggregate
          ? {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: aggregate.ratingValue,
                reviewCount: aggregate.reviewCount,
                bestRating: 5,
                worstRating: 1,
              },
            }
          : {}),
      },
    ],
  }

  return (
    <main>
      <section className="border-b bg-muted/30">
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
                  <Link href={`/${niche.slug}`}>{niche.label}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/areas">Areas</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{area.label}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </section>

      <section className="border-b bg-muted/30 pb-12 pt-10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <Badge variant="secondary" className="mb-4">
            <MapPin className="mr-1.5 h-3 w-3" />
            {area.label}, {cityConfig.stateCode}
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {niche.label} in {area.label}, {cityConfig.stateCode}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            {content.serviceLabel} for homes and businesses in {area.label}. Get matched with one
            vetted Erie County pro — no bidding wars, free for homeowners.
          </p>
          {aggregate ? (
            <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
              <span>
                {aggregate.ratingValue} average from {aggregate.reviewCount.toLocaleString()}{" "}
                reviews across {aggregate.listingCount} local listings
              </span>
            </p>
          ) : null}
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href={`/get-matched?niche=${niche.slug}`}>
                Get matched in {area.label}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href={`/${niche.slug}/directory`}>Browse directory</Link>
            </Button>
          </div>
        </div>
      </section>

      {listings.length > 0 ? (
        <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
          <h2 className="mb-6 text-xl font-semibold">
            Top {content.pluralLabel.toLowerCase()} in {area.label}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {listings.map((listing) => (
              <Card key={listing.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{listing.businessName}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {listing.rating && listing.reviewCount > 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {listing.rating}/5 · {listing.reviewCount} reviews
                    </p>
                  ) : null}
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/${niche.slug}/${listing.slug}`}>View profile</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      <section className="border-t bg-muted/30 py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="mb-4 text-xl font-semibold">Popular {niche.label} searches</h2>
          <div className="flex flex-wrap gap-2">
            {modifiers.map((modifier) => (
              <Button key={modifier.slug} asChild variant="outline" size="sm">
                <Link href={`/${niche.slug}/modifiers/${modifier.slug}`}>
                  {modifier.headlineSuffix}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </section>

      <InternalLinks niche={niche.slug} currentPage={canonicalPath.replace(/^\//, "")} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </main>
  )
}
