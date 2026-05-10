const LOW_QUALITY_PHOTO_PATTERNS = [
  "streetview",
  "street_view",
  "maps.googleapis.com/maps/api/streetview",
  "googleapis.com/streetview",
  "staticmap",
  "logo",
  "profile_photo",
  "avatar",
  "icon",
]

const PREFERRED_PHOTO_PATTERNS = [
  "lh3.googleusercontent.com",
  "googleusercontent.com",
  "gstatic.com",
  "googleapis.com",
]

export function cleanProviderPhotoRefs(refs: Array<string | null | undefined>) {
  const seen = new Set<string>()
  return refs
    .map((ref) => (typeof ref === "string" ? ref.trim() : ""))
    .filter(Boolean)
    .filter((ref) => {
      const key = ref.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return isAllowedPhotoRef(ref)
    })
    .sort((a, b) => photoQualityScore(b) - photoQualityScore(a))
}

export function getBestProviderPhoto(refs: string[]) {
  return cleanProviderPhotoRefs(refs)[0] ?? null
}

export function getProviderPhotoSrc(ref: string, width = 800) {
  if (isRemotePhotoUrl(ref)) {
    const size = Math.min(Math.max(width, 120), 1600)
    return `/api/provider-image?url=${encodeURIComponent(ref)}&w=${size}`
  }

  return `/api/places-photo?ref=${encodeURIComponent(ref)}&w=${width}`
}

function isAllowedPhotoRef(ref: string) {
  if (!ref) return false
  if (!isRemotePhotoUrl(ref)) return true

  try {
    const url = new URL(ref)
    return url.protocol === "https:" && !LOW_QUALITY_PHOTO_PATTERNS.some((pattern) => ref.toLowerCase().includes(pattern))
  } catch {
    return false
  }
}

function isRemotePhotoUrl(ref: string) {
  return ref.startsWith("https://") || ref.startsWith("http://")
}

function photoQualityScore(ref: string) {
  const value = ref.toLowerCase()
  let score = 0

  if (PREFERRED_PHOTO_PATTERNS.some((pattern) => value.includes(pattern))) score += 30
  if (value.includes("photo")) score += 10
  if (value.includes("=w") || value.includes("maxwidth") || value.includes("max_width")) score += 8
  if (LOW_QUALITY_PHOTO_PATTERNS.some((pattern) => value.includes(pattern))) score -= 100
  if (value.startsWith("https://")) score += 5

  return score
}
