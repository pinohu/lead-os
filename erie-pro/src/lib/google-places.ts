// ── Google Places API Client (DEPRECATED for scraping) ────────────
// Use outscraper.ts instead for scraping directory listings.
// Retained for: photo proxy route (/api/places-photo), utility
// functions (normalizePhone, distanceKm, delay).

import { logger } from "@/lib/logger";

const API_KEY = process.env.GOOGLE_PLACES_API_KEY ?? "";
const BASE_URL = "https://places.googleapis.com/v1";

// ── Types ─────────────────────────────────────────────────────────

export interface GooglePlace {
  id: string;
  displayName: { text: string; languageCode?: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string; // "PRICE_LEVEL_INEXPENSIVE" etc.
  editorialSummary?: { text: string; languageCode?: string };
  regularOpeningHours?: {
    openNow?: boolean;
    periods?: Array<{
      open: { day: number; hour: number; minute: number };
      close?: { day: number; hour: number; minute: number };
    }>;
    weekdayDescriptions?: string[];
  };
  location?: { latitude: number; longitude: number };
  addressComponents?: Array<{
    longText: string;
    shortText: string;
    types: string[];
  }>;
  types?: string[];
  photos?: Array<{
    name: string;
    widthPx: number;
    heightPx: number;
    authorAttributions?: Array<{ displayName: string; uri: string }>;
  }>;
  reviews?: Array<{
    name: string;
    relativePublishTimeDescription: string;
    rating: number;
    text?: { text: string; languageCode?: string };
    originalText?: { text: string; languageCode?: string };
    authorAttribution: {
      displayName: string;
      uri?: string;
      photoUri?: string;
    };
    publishTime: string;
  }>;
}

interface TextSearchResponse {
  places?: GooglePlace[];
  nextPageToken?: string;
}

// ── Field Masks ───────────────────────────────────────────────────

const SEARCH_FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.rating",
  "places.userRatingCount",
  "places.types",
].join(",");

const DETAIL_FIELD_MASK = [
  "id",
  "displayName",
  "formattedAddress",
  "nationalPhoneNumber",
  "internationalPhoneNumber",
  "websiteUri",
  "rating",
  "userRatingCount",
  "priceLevel",
  "editorialSummary",
  "regularOpeningHours",
  "location",
  "addressComponents",
  "types",
  "photos",
  "reviews",
].join(",");

// ── Rate Limiting ─────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Retry Logic ───────────────────────────────────────────────────

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3
): Promise<Response> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (response.ok || response.status === 404) return response;

      // Rate limited — wait and retry
      if (response.status === 429) {
        const waitMs = Math.min(1000 * 2 ** attempt, 10000);
        logger.warn("google-places", `Rate limited, waiting ${waitMs}ms...`);
        await delay(waitMs);
        continue;
      }

      // Server error — retry with backoff
      if (response.status >= 500) {
        const waitMs = Math.min(500 * 2 ** attempt, 5000);
        await delay(waitMs);
        continue;
      }

      // Client error (400, 403, etc.) — don't retry
      return response;
    } catch (err) {
      if (attempt === maxRetries - 1) throw err;
      await delay(500 * 2 ** attempt);
    }
  }
  throw new Error("Max retries exceeded");
}

// ── API Functions ─────────────────────────────────────────────────

/**
 * Search for places using text query with location bias.
 * Returns up to 20 results per call.
 */
export async function searchPlaces(
  query: string,
  lat: number,
  lng: number,
  radiusMeters: number = 30000
): Promise<GooglePlace[]> {
  if (!API_KEY) {
    logger.error("google-places", "GOOGLE_PLACES_API_KEY is not set");
    return [];
  }

  const response = await fetchWithRetry(
    `${BASE_URL}/places:searchText`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": API_KEY,
        "X-Goog-FieldMask": SEARCH_FIELD_MASK,
      },
      body: JSON.stringify({
        textQuery: query,
        locationBias: {
          circle: {
            center: { latitude: lat, longitude: lng },
            radius: radiusMeters,
          },
        },
        maxResultCount: 20,
        languageCode: "en",
      }),
    }
  );

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    logger.error("google-places", `Text Search failed (${response.status}):`, text);
    return [];
  }

  const data = (await response.json()) as TextSearchResponse;
  return data.places ?? [];
}

/**
 * Get full details for a single place by its ID.
 */
export async function getPlaceDetails(
  placeId: string
): Promise<GooglePlace | null> {
  if (!API_KEY) {
    logger.error("google-places", "GOOGLE_PLACES_API_KEY is not set");
    return null;
  }

  const response = await fetchWithRetry(
    `${BASE_URL}/places/${placeId}`,
    {
      method: "GET",
      headers: {
        "X-Goog-Api-Key": API_KEY,
        "X-Goog-FieldMask": DETAIL_FIELD_MASK,
      },
    }
  );

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    logger.error("google-places", `Place Details failed for ${placeId} (${response.status}):`, text);
    return null;
  }

  return (await response.json()) as GooglePlace;
}

/**
 * Construct a photo URL for a Google Places photo reference.
 * Use this server-side only — the API key must not leak to the client.
 */
export function getPhotoUrl(photoName: string, maxWidthPx: number = 800): string {
  return `${BASE_URL}/${photoName}/media?maxWidthPx=${maxWidthPx}&key=${API_KEY}`;
}

// ── Parsing Helpers ───────────────────────────────────────────────

/**
 * Parse Google addressComponents into structured address fields.
 */
export function parseAddress(components?: GooglePlace["addressComponents"]): {
  street: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
} {
  if (!components) return { street: null, city: null, state: null, zip: null };

  let streetNumber = "";
  let route = "";
  let city: string | null = null;
  let state: string | null = null;
  let zip: string | null = null;

  for (const comp of components) {
    if (comp.types.includes("street_number")) streetNumber = comp.longText;
    if (comp.types.includes("route")) route = comp.longText;
    if (comp.types.includes("locality")) city = comp.longText;
    if (comp.types.includes("administrative_area_level_1")) state = comp.shortText;
    if (comp.types.includes("postal_code")) zip = comp.longText;
  }

  const street = [streetNumber, route].filter(Boolean).join(" ") || null;
  return { street, city, state, zip };
}

/**
 * Normalize a phone number to (XXX) XXX-XXXX format.
 */
export function normalizePhone(phone?: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  // Handle US numbers: 10 digits or 11 with leading 1
  const ten = digits.length === 11 && digits.startsWith("1")
    ? digits.slice(1)
    : digits;
  if (ten.length !== 10) return phone; // Return as-is if not standard US
  return `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}`;
}

/**
 * Map Google priceLevel string to a 1-4 number.
 */
export function parsePriceLevel(level?: string): number | null {
  const map: Record<string, number> = {
    PRICE_LEVEL_FREE: 0,
    PRICE_LEVEL_INEXPENSIVE: 1,
    PRICE_LEVEL_MODERATE: 2,
    PRICE_LEVEL_EXPENSIVE: 3,
    PRICE_LEVEL_VERY_EXPENSIVE: 4,
  };
  return level ? (map[level] ?? null) : null;
}

/**
 * Extract review data into a clean JSON-serializable array.
 */
export function extractReviews(
  reviews?: GooglePlace["reviews"]
): Array<{
  author: string;
  rating: number;
  text: string;
  relativeTime: string;
  publishTime: string;
}> {
  if (!reviews) return [];
  return reviews
    .filter((r) => r.text?.text || r.originalText?.text)
    .slice(0, 5)
    .map((r) => ({
      author: r.authorAttribution.displayName,
      rating: r.rating,
      text: r.text?.text ?? r.originalText?.text ?? "",
      relativeTime: r.relativePublishTimeDescription,
      publishTime: r.publishTime,
    }));
}

/**
 * Extract opening hours into a clean JSON-serializable structure.
 */
export function extractHours(
  hours?: GooglePlace["regularOpeningHours"]
): { weekdayDescriptions: string[]; openNow?: boolean } | null {
  if (!hours?.weekdayDescriptions) return null;
  return {
    weekdayDescriptions: hours.weekdayDescriptions,
    openNow: hours.openNow,
  };
}

/**
 * Calculate distance in km between two lat/lng points (Haversine).
 */
export function distanceKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Re-export delay for use in scraper
export { delay };
