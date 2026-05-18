// erie-pro/src/lib/seo-metadata.ts
import type { Metadata } from "next"
import { cityConfig } from "@/lib/city-config"
import { shouldNoindexNichePage, type SeoPlanPageType } from "@/lib/seo-publish-gate"

export function withSeoPublishGate(
  metadata: Metadata,
  nicheSlug: string,
  pageType: SeoPlanPageType,
): Metadata {
  if (!shouldNoindexNichePage(nicheSlug, pageType)) return metadata
  return {
    ...metadata,
    robots: { index: false, follow: true },
  }
}

export function homeOpenGraphImage() {
  return {
    url: `https://${cityConfig.domain}/api/og/home`,
    width: 1200,
    height: 630,
    alt: `One vetted local pro in ${cityConfig.name}, ${cityConfig.stateCode} — ${cityConfig.domain}`,
  }
}

export function nicheOpenGraphImage(nicheSlug: string, alt: string) {
  return {
    url: `https://${cityConfig.domain}/api/og/${nicheSlug}`,
    width: 1200,
    height: 630,
    alt,
  }
}
