// erie-pro/src/lib/listing-aggregate-rating.ts

export interface RatedListing {
  rating: number | null
  reviewCount: number
}

export interface AggregateRatingSummary {
  ratingValue: number
  reviewCount: number
  listingCount: number
}

export function computeAggregateRating(listings: RatedListing[]): AggregateRatingSummary | null {
  const rated = listings.filter(
    (listing) => listing.reviewCount > 0 && listing.rating != null && listing.rating > 0,
  )
  if (rated.length === 0) return null

  const reviewCount = rated.reduce((sum, listing) => sum + listing.reviewCount, 0)
  if (reviewCount === 0) return null

  const weighted =
    rated.reduce((sum, listing) => sum + listing.rating! * listing.reviewCount, 0) / reviewCount

  return {
    ratingValue: Math.round(weighted * 10) / 10,
    reviewCount,
    listingCount: rated.length,
  }
}

export function buildAggregateRatingSchema(
  summary: AggregateRatingSummary,
  itemReviewedName: string,
) {
  return {
    "@type": "AggregateRating",
    itemReviewed: { "@type": "Service", name: itemReviewedName },
    ratingValue: summary.ratingValue,
    reviewCount: summary.reviewCount,
    bestRating: 5,
    worstRating: 1,
  }
}
