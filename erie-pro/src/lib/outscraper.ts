// ── Outscraper API Client ──────────────────────────────────────────
// Wraps the Outscraper SDK to scrape Google Maps business data.
// Replaces Google Places API for scraping — $0 cost with lifetime access.
//
// Used by: src/scripts/scrape-google-places.ts (script-only, not Next.js runtime)

import Outscraper from "outscraper"
import { normalizePhone, distanceKm } from "./google-places"

// Re-export utilities used by the scraper script
export { normalizePhone, distanceKm }

// ── Types ─────────────────────────────────────────────────────────
// Field names match actual Outscraper V3 response (verified empirically)

export interface OutscraperPlace {
  name: string
  place_id: string
  google_id: string
  address: string | null          // full formatted address
  street: string | null
  city: string | null
  state: string | null            // full state name ("Pennsylvania")
  state_code: string | null       // "PA"
  postal_code: string | null
  latitude: number | null
  longitude: number | null
  phone: string | null            // "+1 814-459-0004" format
  website: string | null
  rating: number | null
  reviews: number | null          // review count
  category: string | null         // primary category
  subtypes: string | null         // comma-separated string, NOT array
  working_hours: Record<string, string[]> | null  // {"Monday": ["8 AM - 5 PM"], ...}
  range: string | null            // price range
  description: string | null
  logo: string | null
  street_view: string | null
  photo: string | null            // main photo URL
  photos_count: number | null
  business_status: string | null
  // Reviews data (when fetched via googleMapsReviews)
  reviews_data?: OutscraperReview[] | null
}

export interface OutscraperReview {
  author_title: string
  review_rating: number
  review_text: string | null
  review_datetime_utc: string | null
  review_likes: number | null
}

// ── Client ────────────────────────────────────────────────────────

let _client: InstanceType<typeof Outscraper> | null = null

function getClient(): InstanceType<typeof Outscraper> {
  if (!_client) {
    const key = process.env.OUTSCRAPER_API_KEY
    if (!key) throw new Error("OUTSCRAPER_API_KEY is not set")
    _client = new Outscraper(key)
  }
  return _client
}

// ── Search ────────────────────────────────────────────────────────

/**
 * Search Google Maps for businesses matching the given queries.
 * Returns full business details in a single call (no separate detail fetch needed).
 *
 * @param queries - Search queries (e.g., ["plumbers in Erie, PA"])
 * @param limit - Max results per query (default 20)
 */
export async function searchPlaces(
  queries: string[],
  limit: number = 20
): Promise<OutscraperPlace[]> {
  const client = getClient()

  // asyncRequest=false for synchronous response
  const response = await client.googleMapsSearchV3(
    queries,
    limit,
    "en",    // language
    "US",    // region
    0,       // skip
    true,    // dropDuplicates
    null,    // enrichment
    false    // asyncRequest — MUST be false for sync
  )

  // Response is a FLAT array of place objects (not nested arrays)
  const results: OutscraperPlace[] = []
  const seenIds = new Set<string>()

  if (Array.isArray(response)) {
    for (const item of response) {
      // Handle both flat array and nested array formats
      const places = Array.isArray(item) ? item : [item]
      for (const place of places) {
        if (place?.place_id && !seenIds.has(place.place_id)) {
          seenIds.add(place.place_id)
          results.push(place as OutscraperPlace)
        }
      }
    }
  }

  return results
}

// ── Reviews ───────────────────────────────────────────────────────

/**
 * Fetch reviews for places by their place_ids or search queries.
 * Returns a map keyed by place_id.
 */
export async function getReviews(
  placeIds: string[],
  reviewsLimit: number = 5
): Promise<Map<string, OutscraperReview[]>> {
  const client = getClient()
  const map = new Map<string, OutscraperReview[]>()

  if (placeIds.length === 0) return map

  const response = await client.googleMapsReviews(
    placeIds,
    reviewsLimit,
    null,    // reviewsQuery
    1,       // limit (1 place per query)
    "most_relevant", // sort
    null,    // lastPaginationId
    null,    // start
    null,    // cutoff
    null,    // cutoffRating
    true,    // ignoreEmpty
    "google",// source
    "en",    // language
    "US",    // region
    undefined, // fields
    false    // asyncRequest
  )

  if (Array.isArray(response)) {
    for (const item of response) {
      // Handle both flat and nested formats
      const places = Array.isArray(item) ? item : [item]
      for (const place of places) {
        if (place?.place_id && Array.isArray(place.reviews_data)) {
          map.set(place.place_id, place.reviews_data)
        }
      }
    }
  }

  return map
}

// ── Field Mapping ─────────────────────────────────────────────────

import type { UpsertDirectoryListingInput } from "./directory-store"

/**
 * Map an Outscraper place result to the DirectoryListing upsert format.
 */
export function mapToDirectoryListing(
  place: OutscraperPlace,
  niche: string
): UpsertDirectoryListingInput {
  const photoRefs: string[] = []
  if (place.photo) photoRefs.push(place.photo)
  if (place.logo) photoRefs.push(place.logo)
  if (place.street_view) photoRefs.push(place.street_view)

  // Parse subtypes: Outscraper returns comma-separated string
  const categories = place.subtypes
    ? place.subtypes.split(",").map((s) => s.trim()).filter(Boolean)
    : place.category
    ? [place.category]
    : []

  return {
    googlePlaceId: place.place_id,
    businessName: place.name,
    niche,
    phone: normalizePhone(place.phone),
    email: null,
    website: place.website ?? null,
    addressStreet: place.street ?? null,
    addressCity: place.city ?? null,
    addressState: place.state_code ?? place.state ?? null,
    addressZip: place.postal_code ?? null,
    addressFormatted: place.address ?? null,
    latitude: place.latitude ?? null,
    longitude: place.longitude ?? null,
    description: place.description ?? null,
    rating: place.rating ?? null,
    reviewCount: place.reviews ?? 0,
    priceLevel: parseOutscraperPriceLevel(place.range),
    hoursJson: parseOutscraperHours(place.working_hours),
    categories,
    photoRefs,
    reviewsJson: place.reviews_data
      ? extractOutscraperReviews(place.reviews_data)
      : undefined,
    source: "outscraper",
  }
}

// ── Parsing Helpers ───────────────────────────────────────────────

/**
 * Convert Outscraper working_hours object to the same format used by directory listings.
 * Input:  {"Monday": ["8 AM - 5 PM"], ...}  (values are arrays of strings)
 * Output: {weekdayDescriptions: ["Monday: 8 AM - 5 PM", ...]}
 */
export function parseOutscraperHours(
  hours: Record<string, string[]> | null | undefined
): { weekdayDescriptions: string[] } | null {
  if (!hours || typeof hours !== "object") return null

  const dayOrder = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ]

  const descriptions: string[] = []
  for (const day of dayOrder) {
    if (hours[day] !== undefined) {
      const value = Array.isArray(hours[day])
        ? hours[day].join(", ")
        : String(hours[day])
      descriptions.push(`${day}: ${value}`)
    }
  }

  // Also pick up any keys not in dayOrder (edge cases)
  for (const [key, value] of Object.entries(hours)) {
    if (!dayOrder.includes(key)) {
      const str = Array.isArray(value) ? value.join(", ") : String(value)
      descriptions.push(`${key}: ${str}`)
    }
  }

  return descriptions.length > 0 ? { weekdayDescriptions: descriptions } : null
}

/**
 * Convert Outscraper price range string to a 1-4 number.
 * "$" → 1, "$$" → 2, "$$$" → 3, "$$$$" → 4
 */
export function parseOutscraperPriceLevel(
  range: string | null | undefined
): number | null {
  if (!range) return null
  const dollars = (range.match(/\$/g) ?? []).length
  return dollars >= 1 && dollars <= 4 ? dollars : null
}

/**
 * Extract review data into a clean JSON-serializable array.
 * Compatible with the format used by google-places.ts extractReviews().
 */
export function extractOutscraperReviews(
  reviews: OutscraperReview[]
): Array<{
  author: string
  rating: number
  text: string
  relativeTime: string
  publishTime: string
}> {
  return reviews
    .filter((r) => r.review_text)
    .slice(0, 5)
    .map((r) => ({
      author: r.author_title ?? "Anonymous",
      rating: r.review_rating ?? 0,
      text: r.review_text ?? "",
      relativeTime: "",
      publishTime: r.review_datetime_utc ?? "",
    }))
}
