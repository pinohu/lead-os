import type { MetadataRoute } from "next"
import { niches } from "@/lib/niches"
import { cityConfig } from "@/lib/city-config"

const BASE = `https://${cityConfig.domain}`

const NICHE_PAGES = [
  "", "/blog", "/guides", "/faq", "/pricing", "/costs", "/compare",
  "/emergency", "/glossary", "/seasonal", "/checklist", "/directory",
  "/reviews", "/tips", "/certifications",
]

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/services`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/areas`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/for-business`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/for-business/claim`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ]

  const nichePages: MetadataRoute.Sitemap = niches.flatMap((niche) =>
    NICHE_PAGES.map((page) => ({
      url: `${BASE}/${niche.slug}${page}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: page === "" ? 0.9 : 0.7,
    }))
  )

  return [...staticPages, ...nichePages]
}
