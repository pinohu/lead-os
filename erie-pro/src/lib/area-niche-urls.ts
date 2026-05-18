// erie-pro/src/lib/area-niche-urls.ts
import { cityConfig } from "@/lib/city-config"

export function getAreaNicheCanonicalPath(nicheSlug: string, areaSlug: string) {
  return `/${nicheSlug}/areas/${areaSlug}`
}

export function getAreaNicheLegacyPath(nicheSlug: string, areaSlug: string) {
  return `/areas/${areaSlug}/${nicheSlug}`
}

export function getAreaNicheCanonicalUrl(nicheSlug: string, areaSlug: string) {
  return `https://${cityConfig.domain}${getAreaNicheCanonicalPath(nicheSlug, areaSlug)}`
}
