// erie-pro/src/lib/google-business-url.ts

const MAPS_HOST_PATTERN = /^https?:\/\/(www\.)?(google\.[a-z.]+\/maps|maps\.google\.[a-z.]+)/i

export function isGoogleMapsUrl(url: string | null | undefined) {
  if (!url?.trim()) return false
  try {
    return MAPS_HOST_PATTERN.test(new URL(url).href)
  } catch {
    return false
  }
}

/** Prefer Outscraper `location_link`, then stable place_id URL. */
export function buildGoogleBusinessUrlFromPlace(place: {
  place_id?: string | null
  location_link?: string | null
  link?: string | null
  google_id?: string | null
  cid?: string | number | null
}) {
  for (const candidate of [place.location_link, place.link]) {
    if (isGoogleMapsUrl(candidate)) return candidate!.trim()
  }

  const placeId = place.place_id?.trim()
  if (placeId && placeId !== "__NO_PLACE_FOUND__") {
    return `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(placeId)}`
  }

  if (place.cid != null && String(place.cid).trim()) {
    return `https://www.google.com/maps?cid=${encodeURIComponent(String(place.cid).trim())}`
  }

  return null
}

export function buildGoogleBusinessUrlFromPlaceId(placeId: string | null | undefined) {
  if (!placeId?.trim()) return null
  return buildGoogleBusinessUrlFromPlace({ place_id: placeId })
}

const PLACE_ID_ONLY_URL_PATTERN = /\/maps\/place\/\?q=place_id:/i
const MAPS_SEARCH_URL_PATTERN = /\/maps\/search/i

export function isGoogleMapsSearchUrl(url: string | null | undefined) {
  if (!url?.trim()) return false
  try {
    return MAPS_SEARCH_URL_PATTERN.test(new URL(url).pathname)
  } catch {
    return false
  }
}

/** True when safe to use in Organization `sameAs` (verified place/profile, not a search results page). */
export function isOrganizationGoogleBusinessProfileUrl(url: string | null | undefined) {
  if (!isGoogleMapsUrl(url)) return false
  return !isGoogleMapsSearchUrl(url)
}

/** True when the URL is only the place_id fallback, not Outscraper's canonical location_link. */
export function isPlaceIdOnlyGoogleBusinessUrl(url: string | null | undefined) {
  if (!url?.trim()) return false
  if (!isGoogleMapsUrl(url)) return false
  return PLACE_ID_ONLY_URL_PATTERN.test(url.trim())
}
