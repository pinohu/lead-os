import { getPool } from "./db.ts";
import { STORE_MAX_ARRAY_SIZE } from "./constants.ts";
import type {
  IngestedBusinessProfile,
  GMBAttribute,
  GMBQandA,
} from "./gmb-ingestor.ts";
import { INDUSTRY_TEMPLATES } from "./niche-templates.ts";
import type { IndustryCategory } from "./niche-templates.ts";

// Re-export so consumers can import these types from this module.
export type { GMBAttribute, GMBQandA };

// ---------------------------------------------------------------------------
// Exported types
// ---------------------------------------------------------------------------

export type LandingPageSectionType =
  | "hero"
  | "trust-bar"
  | "services"
  | "social-proof"
  | "about"
  | "hours"
  | "attributes"
  | "faq"
  | "lead-magnet"
  | "cta-banner";

export interface LandingPageSection {
  id: string;
  type: LandingPageSectionType;
  content: Record<string, unknown>;
  order: number;
}

export interface GeneratedLandingPage {
  slug: string;
  businessName: string;
  tenantId?: string;
  niche: string;
  industry: IndustryCategory;
  geo: { city: string; state: string; country: string };
  sections: LandingPageSection[];
  leadMagnetSlug?: string;
  intakeSource: string;
  accentColor: string;
  metaTitle: string;
  metaDescription: string;
  ogImage?: string;
  canonicalUrl?: string;
  /** schema.org LocalBusiness JSON-LD */
  jsonLd: Record<string, unknown>;
  version: number;
  status: "draft" | "published" | "archived";
  createdAt: string;
  updatedAt: string;
}

export interface GenerateLandingPageOptions {
  tenantId?: string;
  accentColor?: string;
  leadMagnetSlug?: string;
  /** Base path for canonical URL generation. Defaults to "/lp". */
  baseUrl?: string;
}

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

const landingPageStore = new Map<string, GeneratedLandingPage>();

// ---------------------------------------------------------------------------
// Schema management
// ---------------------------------------------------------------------------

let schemaReady: Promise<void> | null = null;

async function ensureSchema(): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  if (schemaReady) return schemaReady;

  schemaReady = (async () => {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS lead_os_landing_pages (
          slug       TEXT PRIMARY KEY,
          tenant_id  TEXT,
          payload    JSONB NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);
    } catch {
      schemaReady = null;
    }
  })();

  return schemaReady;
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/** Capitalise the first character of a string. */
function capitalize(s: string): string {
  if (s.length === 0) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Truncate a string to at most `max` characters. */
function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max);
}

/**
 * Remove keys whose value is `undefined` from a plain object.
 * Returns a new shallow object; does not recurse.
 */
function stripUndefined(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

/** Replace every `{{niche}}` placeholder in a template string. */
function applyNichePlaceholder(template: string, niche: string): string {
  return template.replace(/\{\{niche\}\}/g, niche);
}

/** Return the profile's IndustryCategory, falling back to "general" for unknown values. */
function resolveIndustry(profile: IngestedBusinessProfile): IndustryCategory {
  return profile.industry;
}

/** Build a section id from type and order index. */
function sectionId(type: LandingPageSectionType, order: number): string {
  return `${type}-${order}`;
}

// ---------------------------------------------------------------------------
// Section builders
// ---------------------------------------------------------------------------

function buildHeroSection(
  profile: IngestedBusinessProfile,
  industry: IndustryCategory,
  order: number,
): LandingPageSection {
  const coldTemplate = INDUSTRY_TEMPLATES[industry].headlineTemplates.cold;

  const headline = coldTemplate.headline.includes("{{niche}}")
    ? applyNichePlaceholder(coldTemplate.headline, profile.primaryCategory)
    : `${profile.businessName} — Trusted ${profile.primaryCategory} in ${profile.city}`;

  const coverPhoto =
    profile.photos.find((p) => p.category === "cover" || p.category === "exterior") ??
    profile.photos[0];

  return {
    id: sectionId("hero", order),
    type: "hero",
    order,
    content: {
      headline,
      subheadline: truncate(profile.description, 200),
      ctaText: applyNichePlaceholder(coldTemplate.ctaText, profile.primaryCategory),
      ctaUrl: "#lead-capture",
      backgroundImage: coverPhoto?.url ?? undefined,
      rating: profile.rating,
      reviewCount: profile.reviewCount,
    },
  };
}

function buildTrustBarSection(
  profile: IngestedBusinessProfile,
  order: number,
): LandingPageSection | null {
  if (!profile.rating) return null;

  const defaultBadges = ["Licensed & Insured", "Locally Owned", "Free Estimates"];
  const attributeBadges = profile.attributes
    .filter((a) => a.value)
    .map((a) => a.label);

  return {
    id: sectionId("trust-bar", order),
    type: "trust-bar",
    order,
    content: {
      rating: profile.rating,
      reviewCount: profile.reviewCount,
      badges: attributeBadges.length > 0 ? attributeBadges : defaultBadges,
    },
  };
}

function buildServicesSection(
  profile: IngestedBusinessProfile,
  order: number,
): LandingPageSection | null {
  if (profile.additionalCategories.length === 0) return null;

  return {
    id: sectionId("services", order),
    type: "services",
    order,
    content: {
      heading: "Our Services",
      services: profile.additionalCategories.map((cat) => ({ name: cat, description: "" })),
      primaryService: profile.primaryCategory,
    },
  };
}

function buildSocialProofSection(
  profile: IngestedBusinessProfile,
  order: number,
): LandingPageSection | null {
  if (profile.topReviews.length === 0) return null;

  return {
    id: sectionId("social-proof", order),
    type: "social-proof",
    order,
    content: {
      heading: "What Our Customers Say",
      reviews: profile.topReviews.map((r) => ({
        author: r.author ?? "Valued Customer",
        rating: r.rating,
        text: r.text ?? "",
        relativeTime: r.relativeTime,
      })),
      attribution: "Reviews sourced from Google",
    },
  };
}

function buildAboutSection(
  profile: IngestedBusinessProfile,
  order: number,
): LandingPageSection {
  return {
    id: sectionId("about", order),
    type: "about",
    order,
    content: {
      heading: `About ${profile.businessName}`,
      description: profile.description,
      phone: profile.phone,
      address: profile.address,
      website: profile.website,
      geo: profile.geo,
    },
  };
}

function buildHoursSection(
  profile: IngestedBusinessProfile,
  order: number,
): LandingPageSection | null {
  if (profile.hours.length === 0) return null;

  return {
    id: sectionId("hours", order),
    type: "hours",
    order,
    content: {
      heading: "Hours of Operation",
      hours: profile.hours,
    },
  };
}

function buildAttributesSection(
  profile: IngestedBusinessProfile,
  order: number,
): LandingPageSection | null {
  const positiveAttributes = profile.attributes.filter((a) => a.value);
  if (positiveAttributes.length === 0) return null;

  return {
    id: sectionId("attributes", order),
    type: "attributes",
    order,
    content: {
      heading: "Why Choose Us",
      attributes: positiveAttributes.map((a) => ({ key: a.key, label: a.label })),
    },
  };
}

function buildFaqSection(
  profile: IngestedBusinessProfile,
  order: number,
): LandingPageSection | null {
  if (profile.faq.length === 0) return null;

  return {
    id: sectionId("faq", order),
    type: "faq",
    order,
    content: {
      heading: "Frequently Asked Questions",
      items: profile.faq.map((q) => ({ question: q.question, answer: q.answer ?? "" })),
    },
  };
}

function buildLeadMagnetSection(
  profile: IngestedBusinessProfile,
  order: number,
): LandingPageSection {
  return {
    id: sectionId("lead-magnet", order),
    type: "lead-magnet",
    order,
    content: {
      heading: "Get Started Today",
      subheading: "Fill out the form below and we'll get back to you within 24 hours.",
      formFields: ["firstName", "lastName", "email", "phone", "service"],
      submitLabel: "Request Free Quote",
      source: `lp-${profile.slug}`,
      niche: profile.niche,
    },
  };
}

function buildCtaBannerSection(
  profile: IngestedBusinessProfile,
  order: number,
): LandingPageSection {
  const ctaUrl = profile.phone
    ? `tel:${profile.phone.replace(/\D/g, "")}`
    : "#lead-capture";

  return {
    id: sectionId("cta-banner", order),
    type: "cta-banner",
    order,
    content: {
      heading: "Ready to Get Started?",
      subheading: `Contact ${profile.businessName} today`,
      ctaText: "Call Now",
      ctaUrl,
      phone: profile.phone,
    },
  };
}

// ---------------------------------------------------------------------------
// JSON-LD builder
// ---------------------------------------------------------------------------

function buildJsonLd(profile: IngestedBusinessProfile): Record<string, unknown> {
  const openingHours = profile.hours
    .filter((h) => !h.closed)
    .map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: capitalize(h.day),
      opens: h.open,
      closes: h.close,
    }));

  const raw: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: profile.businessName,
    description: profile.description || undefined,
    address: stripUndefined({
      "@type": "PostalAddress",
      streetAddress: profile.address || undefined,
      addressLocality: profile.city || undefined,
      addressRegion: profile.state || undefined,
      postalCode: profile.postalCode || undefined,
      addressCountry: profile.country || undefined,
    }),
    telephone: profile.phone || undefined,
    url: profile.website || undefined,
    geo: profile.geo
      ? {
          "@type": "GeoCoordinates",
          latitude: profile.geo.lat,
          longitude: profile.geo.lng,
        }
      : undefined,
    aggregateRating: profile.rating
      ? {
          "@type": "AggregateRating",
          ratingValue: profile.rating,
          reviewCount: profile.reviewCount,
        }
      : undefined,
    openingHoursSpecification: openingHours.length > 0 ? openingHours : undefined,
    image: profile.photos[0]?.url || undefined,
  };

  return stripUndefined(raw);
}

// ---------------------------------------------------------------------------
// Meta helpers
// ---------------------------------------------------------------------------

function buildMetaTitle(profile: IngestedBusinessProfile): string {
  const locationPart = profile.state
    ? `${profile.city}, ${profile.state}`
    : profile.city;
  const suffix = ` — ${profile.primaryCategory} in ${locationPart}`;
  const maxNameLength = Math.max(0, 60 - suffix.length);
  return truncate(`${truncate(profile.businessName, maxNameLength)}${suffix}`, 60);
}

function buildMetaDescription(profile: IngestedBusinessProfile): string {
  const base = truncate(profile.description, 155);
  return `${base} Contact us today for a free quote.`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate a full landing page from an ingested business profile.
 *
 * Section inclusion is conditional: sections that require data (e.g. reviews,
 * hours, attributes) are only added when the profile contains that data.
 * The hero, about, lead-magnet, and cta-banner sections are always included.
 *
 * @param profile - The business profile produced by the GMB ingestor.
 * @param options - Optional overrides for tenant, accent colour, lead magnet slug, and base URL.
 * @returns A fully populated `GeneratedLandingPage` in `"draft"` status at version 1.
 */
export function generateLandingPage(
  profile: IngestedBusinessProfile,
  options: GenerateLandingPageOptions = {},
): GeneratedLandingPage {
  const industry = resolveIndustry(profile);
  const baseUrl = options.baseUrl ?? "/lp";
  const now = new Date().toISOString();

  // Build all candidate sections in prescribed order.
  // Conditional builders return null when the profile lacks relevant data.
  let orderCounter = 0;
  const candidateSections: (LandingPageSection | null)[] = [
    buildHeroSection(profile, industry, orderCounter++),
    buildTrustBarSection(profile, orderCounter++),
    buildServicesSection(profile, orderCounter++),
    buildSocialProofSection(profile, orderCounter++),
    buildAboutSection(profile, orderCounter++),
    buildHoursSection(profile, orderCounter++),
    buildAttributesSection(profile, orderCounter++),
    buildFaqSection(profile, orderCounter++),
    buildLeadMagnetSection(profile, orderCounter++),
    buildCtaBannerSection(profile, orderCounter++),
  ];

  // Drop nulls and re-number order to produce a contiguous 0-based sequence.
  const sections: LandingPageSection[] = candidateSections
    .filter((s): s is LandingPageSection => s !== null)
    .map((s, idx) => ({ ...s, order: idx }));

  return {
    slug: profile.slug,
    businessName: profile.businessName,
    tenantId: options.tenantId,
    niche: profile.niche,
    industry,
    geo: {
      city: profile.city,
      state: profile.state,
      country: profile.country,
    },
    sections,
    leadMagnetSlug: options.leadMagnetSlug,
    intakeSource: `lp-${profile.slug}`,
    accentColor: options.accentColor ?? "#225f54",
    metaTitle: buildMetaTitle(profile),
    metaDescription: buildMetaDescription(profile),
    ogImage: profile.photos[0]?.url,
    canonicalUrl: `${baseUrl}/${profile.slug}`,
    jsonLd: buildJsonLd(profile),
    version: 1,
    status: "draft",
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Persist a landing page to both the in-memory store and PostgreSQL.
 *
 * The in-memory store is capped at `STORE_MAX_ARRAY_SIZE` entries. When at
 * capacity the oldest entry (by insertion order) is evicted before inserting
 * the new one.
 *
 * PostgreSQL failures are silently swallowed — memory-only operation is
 * acceptable when the database is unavailable.
 *
 * @param page - The landing page to save.
 */
export async function saveLandingPage(page: GeneratedLandingPage): Promise<void> {
  if (landingPageStore.size >= STORE_MAX_ARRAY_SIZE && !landingPageStore.has(page.slug)) {
    const firstKey = landingPageStore.keys().next().value;
    if (firstKey !== undefined) {
      landingPageStore.delete(firstKey);
    }
  }
  landingPageStore.set(page.slug, page);

  try {
    await ensureSchema();
    const pool = getPool();
    if (!pool) return;

    await pool.query(
      `INSERT INTO lead_os_landing_pages (slug, tenant_id, payload, created_at, updated_at)
       VALUES ($1, $2, $3::jsonb, $4, $5)
       ON CONFLICT (slug) DO UPDATE
         SET tenant_id  = EXCLUDED.tenant_id,
             payload    = EXCLUDED.payload,
             updated_at = EXCLUDED.updated_at`,
      [page.slug, page.tenantId ?? null, JSON.stringify(page), page.createdAt, page.updatedAt],
    );
  } catch {
    // DB unavailable — memory-only is acceptable.
  }
}

/**
 * Retrieve a landing page by slug.
 *
 * Checks the in-memory store first; falls back to PostgreSQL on a cache miss.
 * A successful PostgreSQL lookup populates the in-memory cache.
 *
 * @param slug - The URL slug of the landing page.
 * @returns The landing page or `null` if not found in either store.
 */
export async function getLandingPage(slug: string): Promise<GeneratedLandingPage | null> {
  const cached = landingPageStore.get(slug);
  if (cached) return cached;

  try {
    await ensureSchema();
    const pool = getPool();
    if (!pool) return null;

    const result = await pool.query<{ payload: GeneratedLandingPage }>(
      `SELECT payload FROM lead_os_landing_pages WHERE slug = $1 LIMIT 1`,
      [slug],
    );

    if (result.rows.length === 0) return null;

    const page = result.rows[0].payload;
    landingPageStore.set(slug, page);
    return page;
  } catch {
    return null;
  }
}

/**
 * List all landing pages, optionally scoped to a tenant.
 *
 * Merges in-memory and PostgreSQL results, deduplicating by slug and
 * preferring the record with the more recent `updatedAt` timestamp.
 * Results are sorted by `updatedAt` descending.
 *
 * @param tenantId - When provided, only pages belonging to this tenant are returned.
 */
export async function listLandingPages(
  tenantId?: string,
): Promise<GeneratedLandingPage[]> {
  const memoryPages = Array.from(landingPageStore.values()).filter(
    (p) => !tenantId || p.tenantId === tenantId,
  );

  const merged = new Map<string, GeneratedLandingPage>(
    memoryPages.map((p) => [p.slug, p]),
  );

  try {
    await ensureSchema();
    const pool = getPool();
    if (pool) {
      const result = tenantId
        ? await pool.query<{ payload: GeneratedLandingPage }>(
            `SELECT payload FROM lead_os_landing_pages WHERE tenant_id = $1`,
            [tenantId],
          )
        : await pool.query<{ payload: GeneratedLandingPage }>(
            `SELECT payload FROM lead_os_landing_pages`,
          );

      for (const row of result.rows) {
        const page = row.payload;
        const existing = merged.get(page.slug);
        if (!existing || page.updatedAt > existing.updatedAt) {
          merged.set(page.slug, page);
        }
      }
    }
  } catch {
    // DB unavailable — return memory results only.
  }

  return Array.from(merged.values()).sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
}

type LandingPageMutableFields = Pick<
  GeneratedLandingPage,
  "status" | "sections" | "metaTitle" | "metaDescription" | "accentColor" | "leadMagnetSlug"
>;

/**
 * Apply a partial update to an existing landing page.
 *
 * Increments `version` and refreshes `updatedAt`. The updated record is
 * persisted to both stores.
 *
 * @param slug    - The slug of the page to update.
 * @param updates - Fields to overwrite.
 * @returns The updated landing page, or `null` if the slug was not found.
 */
export async function updateLandingPage(
  slug: string,
  updates: Partial<LandingPageMutableFields>,
): Promise<GeneratedLandingPage | null> {
  const existing = await getLandingPage(slug);
  if (!existing) return null;

  const updated: GeneratedLandingPage = {
    ...existing,
    ...updates,
    version: existing.version + 1,
    updatedAt: new Date().toISOString(),
  };

  await saveLandingPage(updated);
  return updated;
}

/**
 * Delete a landing page from both the in-memory store and PostgreSQL.
 *
 * @param slug - The slug of the page to remove.
 * @returns `true` if the page existed and was deleted; `false` otherwise.
 */
export async function deleteLandingPage(slug: string): Promise<boolean> {
  const hadMemory = landingPageStore.delete(slug);

  try {
    await ensureSchema();
    const pool = getPool();
    if (pool) {
      const result = await pool.query(
        `DELETE FROM lead_os_landing_pages WHERE slug = $1`,
        [slug],
      );
      return hadMemory || (result.rowCount ?? 0) > 0;
    }
  } catch {
    // DB unavailable — rely on memory result.
  }

  return hadMemory;
}

/**
 * Clear the in-memory landing page store.
 *
 * For use in tests only. Does not affect PostgreSQL data.
 */
export function resetLandingPageStore(): void {
  landingPageStore.clear();
}
