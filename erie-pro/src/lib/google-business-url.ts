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

  if (place.place_id?.trim()) {
    return `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(place.place_id.trim())}`
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
