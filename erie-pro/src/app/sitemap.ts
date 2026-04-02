import type { MetadataRoute } from "next"
import { niches } from "@/lib/niches"
import { cityConfig } from "@/lib/city-config"
import { getAllDirectoryListingSlugs } from "@/lib/directory-store"

const BASE = `https://${cityConfig.domain}`

const NICHE_PAGES = [
  "", "/blog", "/guides", "/faq", "/pricing", "/costs", "/compare",
  "/emergency", "/glossary", "/seasonal", "/checklist", "/directory",
  "/reviews", "/tips", "/certifications",
]

/** Per-page-type lastmod dates give search engines meaningful crawl signals */
const STATIC_DATE = new Date("2025-12-01")
const BUSINESS_DATE = new Date("2026-01-15")
const NICHE_MAIN_DATE = new Date("2026-03-15")
const GROWTH_DATE = new Date("2026-04-01")

/** Staggered dates for niche sub-pages so each type has a distinct lastmod */
const NICHE_SUB_DATES: Record<string, Date> = {
  "/blog":           new Date("2026-03-10"),
  "/guides":         new Date("2026-03-08"),
  "/faq":            new Date("2026-02-20"),
  "/pricing":        new Date("2026-03-01"),
  "/costs":          new Date("2026-02-25"),
  "/compare":        new Date("2026-02-15"),
  "/emergency":      new Date("2026-01-20"),
  "/glossary":       new Date("2026-01-10"),
  "/seasonal":       new Date("2026-02-28"),
  "/checklist":      new Date("2026-02-10"),
  "/directory":      new Date("2026-03-05"),
  "/reviews":        new Date("2026-03-12"),
  "/tips":           new Date("2026-02-18"),
  "/certifications": new Date("2026-01-25"),
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ── Static pages ─────────────────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: GROWTH_DATE, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/services`, lastModified: BUSINESS_DATE, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/areas`, lastModified: BUSINESS_DATE, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/about`, lastModified: STATIC_DATE, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/contact`, lastModified: STATIC_DATE, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/for-business`, lastModified: GROWTH_DATE, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/for-business/claim`, lastModified: GROWTH_DATE, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/privacy`, lastModified: GROWTH_DATE, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/terms`, lastModified: STATIC_DATE, changeFrequency: "yearly", priority: 0.3 },
  ]

  // ── Niche pages (44 niches × 15 types = 660 URLs) ──────────────
  const nichePages: MetadataRoute.Sitemap = niches.flatMap((niche) =>
    NICHE_PAGES.map((page) => ({
      url: `${BASE}/${niche.slug}${page}`,
      lastModified: page === "" ? NICHE_MAIN_DATE : (NICHE_SUB_DATES[page] ?? NICHE_MAIN_DATE),
      changeFrequency: "weekly" as const,
      priority: page === "" ? 0.9 : 0.7,
    }))
  )

  // ── Directory listing pages (scraped providers) ────────────────
  let listingPages: MetadataRoute.Sitemap = []
  try {
    const listings = await getAllDirectoryListingSlugs()
    listingPages = listings.map((l) => ({
      url: `${BASE}/${l.niche}/${l.slug}`,
      lastModified: l.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }))
  } catch {
    // DB unavailable during build — skip listing URLs
  }

  // Note: /admin, /dashboard, /login, /api are intentionally excluded
  // (blocked in robots.txt and not useful for search engines)

  return [...staticPages, ...nichePages, ...listingPages]
}
