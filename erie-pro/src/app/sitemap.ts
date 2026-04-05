import type { MetadataRoute } from "next"
import { niches } from "@/lib/niches"
import { cityConfig } from "@/lib/city-config"
import { getAllDirectoryListingSlugs } from "@/lib/directory-store"
import { prisma, isDatabaseAvailable } from "@/lib/db"

const BASE = `https://${cityConfig.domain}`

// ── Every public sub-page under /[niche]/ ────────────────────────────
const NICHE_PAGES = [
  "", "/blog", "/guides", "/faq", "/pricing", "/costs", "/compare",
  "/emergency", "/glossary", "/seasonal", "/checklist", "/directory",
  "/reviews", "/tips", "/certifications",
]

// ── Lastmod timestamps ───────────────────────────────────────────────
// Staggered per page type so crawlers see meaningful freshness signals.
const STATIC_DATE   = new Date("2025-12-01")
const BUSINESS_DATE = new Date("2026-01-15")
const NICHE_MAIN    = new Date("2026-03-15")
const GROWTH_DATE   = new Date("2026-04-01")
const CURRENT_DATE  = new Date("2026-04-02")

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

  // ── 1. Static / marketing pages ────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE,                          lastModified: CURRENT_DATE,  changeFrequency: "weekly",   priority: 1.0 },
    { url: `${BASE}/services`,            lastModified: BUSINESS_DATE, changeFrequency: "monthly",  priority: 0.8 },
    { url: `${BASE}/directory`,           lastModified: CURRENT_DATE,  changeFrequency: "weekly",   priority: 0.9 },
    { url: `${BASE}/areas`,               lastModified: BUSINESS_DATE, changeFrequency: "monthly",  priority: 0.7 },
    { url: `${BASE}/about`,               lastModified: STATIC_DATE,   changeFrequency: "monthly",  priority: 0.6 },
    { url: `${BASE}/contact`,             lastModified: STATIC_DATE,   changeFrequency: "monthly",  priority: 0.7 },
    { url: `${BASE}/for-business`,        lastModified: GROWTH_DATE,   changeFrequency: "monthly",  priority: 0.8 },
    { url: `${BASE}/for-business/claim`,  lastModified: GROWTH_DATE,   changeFrequency: "monthly",  priority: 0.7 },
    { url: `${BASE}/privacy`,             lastModified: GROWTH_DATE,   changeFrequency: "yearly",   priority: 0.3 },
    { url: `${BASE}/terms`,               lastModified: STATIC_DATE,   changeFrequency: "yearly",   priority: 0.3 },
  ]

  // ── 2. Niche hub + sub-pages (46 niches × 15 types = 690 URLs) ────
  const nichePages: MetadataRoute.Sitemap = niches.flatMap((niche) =>
    NICHE_PAGES.map((page) => ({
      url: `${BASE}/${niche.slug}${page}`,
      lastModified: page === "" ? NICHE_MAIN : (NICHE_SUB_DATES[page] ?? NICHE_MAIN),
      changeFrequency: "weekly" as const,
      priority: page === "" ? 0.9 : 0.7,
    }))
  )

  // ── 3. Individual business pages (listings + claimed providers) ────
  // Fetch both sources in parallel so we cover every resolvable
  // /[niche]/[provider] URL. De-duplicate by slug to avoid double-
  // indexing when a provider claims an existing listing.
  let businessPages: MetadataRoute.Sitemap = []
  if (isDatabaseAvailable()) {
    try {
      const [listings, providers] = await Promise.all([
        getAllDirectoryListingSlugs(),
        prisma.provider.findMany({
          where: { subscriptionStatus: { in: ["active", "trial"] } },
          select: { slug: true, niche: true, updatedAt: true },
        }),
      ])

    const seen = new Set<string>()

    // Claimed providers first — higher priority (they're paying customers)
    for (const p of providers) {
      const key = `${p.niche}/${p.slug}`
      if (seen.has(key)) continue
      seen.add(key)
      businessPages.push({
        url: `${BASE}/${p.niche}/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "weekly",
        priority: 0.8,
      })
    }

    // Directory listings (scraped / unclaimed)
    for (const l of listings) {
      const key = `${l.niche}/${l.slug}`
      if (seen.has(key)) continue
      seen.add(key)
      businessPages.push({
        url: `${BASE}/${l.niche}/${l.slug}`,
        lastModified: l.updatedAt,
        changeFrequency: "monthly",
        priority: 0.6,
      })
    }
    } catch {
      // DB unavailable at runtime — skip dynamic URLs
    }
  }

  // ── Excluded intentionally ─────────────────────────────────────────
  // /admin/*, /dashboard/*, /login, /api/*, /setup-admin,
  // /forgot-password, /reset-password, /verify-email,
  // /for-business/claim/success, /for-business/leads/success
  // All blocked in robots.txt — not useful for search engines.

  return [...staticPages, ...nichePages, ...businessPages]
}
