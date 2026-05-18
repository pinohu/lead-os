// erie-pro/src/app/[niche]/modifiers/[modifier]/page.tsx
import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { ArrowRight } from "lucide-react"
import { cityConfig } from "@/lib/city-config"
import { getNicheBySlug } from "@/lib/niches"
import { getNicheContent } from "@/lib/niche-content"
import { getServiceAreaSlugForLabel } from "@/lib/area-registry"
import { getServiceModifier } from "@/lib/service-modifiers"
import { getModifierStaticParams } from "@/lib/seo-matrix"
import { shouldNoindexModifierPage } from "@/lib/seo-publish-gate"
import { getDirectoryListingsByNiche } from "@/lib/directory-store"
import { computeAggregateRating } from "@/lib/listing-aggregate-rating"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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

type Props = { params: Promise<{ niche: string; modifier: string }> }

export function generateStaticParams() {
  return getModifierStaticParams()
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { niche: nicheSlug, modifier: modifierSlug } = await params
  const niche = getNicheBySlug(nicheSlug)
  const modifier = getServiceModifier(modifierSlug)
  if (!niche || !modifier) return { title: "Not Found" }

  const title = `${modifier.primaryKeyword(niche.label)} | ${cityConfig.domain}`
  const description = modifier.metaDescription(niche.label)

  const metadata: Metadata = {
    title,
    description,
    alternates: {
      canonical: `https://${cityConfig.domain}/${niche.slug}/modifiers/${modifier.slug}`,
    },
  }

  if (shouldNoindexModifierPage(niche.slug)) {
    return { ...metadata, robots: { index: false, follow: true } }
  }

  return metadata
}

export default async function ServiceModifierPage({ params }: Props) {
  const { niche: nicheSlug, modifier: modifierSlug } = await params
  const niche = getNicheBySlug(nicheSlug)
  const content = getNicheContent(nicheSlug)
  const modifier = getServiceModifier(modifierSlug)
  if (!niche || !content || !modifier) notFound()

  let listings: Awaited<ReturnType<typeof getDirectoryListingsByNiche>> = []
  try {
    listings = await getDirectoryListingsByNiche(niche.slug, { limit: 24 })
  } catch {
    listings = []
  }

  const aggregate = computeAggregateRating(
    listings.map((listing) => ({
      rating: listing.rating,
      reviewCount: listing.reviewCount,
    })),
  )

  const pageUrl = `https://${cityConfig.domain}/${niche.slug}/modifiers/${modifier.slug}`
  const headline = `${niche.label} — ${modifier.headlineSuffix}`

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${pageUrl}#service`,
    name: modifier.primaryKeyword(niche.label),
    description: modifier.metaDescription(niche.label),
    areaServed: cityConfig.serviceArea.map((area) => ({
      "@type": "City",
      name: area,
    })),
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
                <BreadcrumbPage>{modifier.headlineSuffix}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </section>

      <section className="border-b bg-muted/30 pb-12 pt-10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <Badge variant="secondary" className="mb-4">
            {cityConfig.name}, {cityConfig.stateCode}
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{headline}</h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            {modifier.metaDescription(niche.label)}
          </p>
          {aggregate ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Erie County directory average: {aggregate.ratingValue}/5 from{" "}
              {aggregate.reviewCount.toLocaleString()} reviews
            </p>
          ) : null}
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href={modifier.ctaHref(niche.slug)}>
                Get started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            {modifier.relatedHref ? (
              <Button asChild size="lg" variant="outline">
                <Link href={modifier.relatedHref(niche.slug)}>
                  {modifier.relatedLabel ?? "Learn more"}
                </Link>
              </Button>
            ) : null}
            <Button asChild variant="outline" size="lg">
              <Link href={`/${niche.slug}`}>Back to {niche.label}</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <h2 className="mb-4 text-lg font-semibold">Also serving {cityConfig.metroArea}</h2>
        <div className="flex flex-wrap gap-2">
          {cityConfig.serviceArea.slice(0, 8).map((areaLabel) => {
            const areaSlug = getServiceAreaSlugForLabel(areaLabel)
            if (!areaSlug) return null
            return (
              <Button key={areaLabel} asChild variant="outline" size="sm">
                <Link href={`/${niche.slug}/areas/${areaSlug}`}>
                  {niche.label} in {areaLabel}
                </Link>
              </Button>
            )
          })}
        </div>
      </section>

      <SeoLaunchEnhancement nicheSlug={niche.slug} nicheLabel={niche.label} pageType="core" />
      <InternalLinks niche={niche.slug} currentPage={`modifiers/${modifier.slug}`} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </main>
  )
}
