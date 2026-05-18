// erie-pro/src/lib/__tests__/listing-aggregate-rating.test.ts
import { describe, expect, it } from "vitest"
import { computeAggregateRating } from "@/lib/listing-aggregate-rating"

describe("listing-aggregate-rating", () => {
  it("returns null when no rated listings", () => {
    expect(computeAggregateRating([])).toBeNull()
    expect(computeAggregateRating([{ rating: null, reviewCount: 0 }])).toBeNull()
  })

  it("computes weighted average by review count", () => {
    const summary = computeAggregateRating([
      { rating: 5, reviewCount: 10 },
      { rating: 4, reviewCount: 30 },
    ])
    expect(summary).toEqual({
      ratingValue: 4.3,
      reviewCount: 40,
      listingCount: 2,
    })
  })
})
