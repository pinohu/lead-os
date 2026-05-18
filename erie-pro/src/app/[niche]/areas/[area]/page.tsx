// erie-pro/src/app/[niche]/areas/[area]/page.tsx
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { cityConfig } from "@/lib/city-config"
import { getNicheBySlug } from "@/lib/niches"
import { getNicheContent } from "@/lib/niche-content"
import { getServiceAreaBySlug } from "@/lib/area-registry"
import { getDirectoryListingsByNicheAndArea } from "@/lib/directory-store"
import { getNicheAreaStaticParams } from "@/lib/seo-matrix"
import { shouldNoindexAreaMatrixPage } from "@/lib/seo-publish-gate"
import { computeAggregateRating } from "@/lib/listing-aggregate-rating"
import { getAreaNicheCanonicalUrl } from "@/lib/area-niche-urls"
import { AreaNicheMatrixContent } from "@/components/seo/area-niche-matrix-content"

type Props = { params: Promise<{ niche: string; area: string }> }

export function generateStaticParams() {
  return getNicheAreaStaticParams()
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { niche: nicheSlug, area: areaSlug } = await params
  const area = getServiceAreaBySlug(areaSlug)
  const niche = getNicheBySlug(nicheSlug)
  const content = getNicheContent(nicheSlug)
  if (!area || !niche || !content) return { title: "Not Found" }

  const title = `${niche.label} in ${area.label}, ${cityConfig.stateCode}`
  const description = `Find vetted ${content.pluralLabel.toLowerCase()} serving ${area.label}, ${cityConfig.stateCode}. One matched local pro — free for homeowners on ${cityConfig.domain}.`

  const metadata: Metadata = {
    title,
    description,
    alternates: {
      canonical: getAreaNicheCanonicalUrl(niche.slug, area.slug),
    },
  }

  if (shouldNoindexAreaMatrixPage(niche.slug, area.slug)) {
    return { ...metadata, robots: { index: false, follow: true } }
  }

  return metadata
}

export default async function NicheAreaMatrixPage({ params }: Props) {
  const { niche: nicheSlug, area: areaSlug } = await params
  const area = getServiceAreaBySlug(areaSlug)
  const niche = getNicheBySlug(nicheSlug)
  const content = getNicheContent(nicheSlug)
  if (!area || !niche || !content) notFound()

  let listings: Awaited<ReturnType<typeof getDirectoryListingsByNicheAndArea>> = []
  try {
    listings = await getDirectoryListingsByNicheAndArea(niche.slug, area.label, {
      limit: 12,
    })
  } catch {
    listings = []
  }

  const aggregate = computeAggregateRating(
    listings.map((listing) => ({
      rating: listing.rating,
      reviewCount: listing.reviewCount,
    })),
  )

  return (
    <AreaNicheMatrixContent
      niche={niche}
      area={area}
      content={content}
      listings={listings}
      aggregate={aggregate}
    />
  )
}
