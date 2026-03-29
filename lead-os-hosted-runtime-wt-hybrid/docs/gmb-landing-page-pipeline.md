# GMB-to-Landing-Page Pipeline

Automated pipeline that ingests Google Business Profile (GMB) listing data and generates SEO-optimized, accessible landing pages with lead capture.

## Flow

```text
GMB listing data (JSON)
  -> POST /api/gmb/ingest
  -> ingestGMBListing()          # Normalize, score, detect niche
  -> generateLandingPage()       # Build sections, JSON-LD, meta
  -> saveLandingPage()           # Memory + PostgreSQL
  -> GET /lp/[slug]              # Public SSG page with lead capture
```

## API Endpoints

### `POST /api/gmb/ingest`

Ingest a GMB listing and generate a landing page.

**Request body** (Zod-validated):

```json
{
  "name": "Joe's Plumbing & Heating",
  "address": "123 Main St",
  "city": "Seattle",
  "state": "WA",
  "postalCode": "98101",
  "country": "US",
  "phone": "+1-206-555-0100",
  "website": "https://joesplumbing.com",
  "primaryCategory": "Plumber",
  "additionalCategories": ["Water Heater Installation"],
  "description": "Family-owned plumbing company...",
  "rating": 4.8,
  "reviewCount": 127,
  "reviews": [
    { "author": "John Smith", "rating": 5, "text": "Amazing!", "relativeTime": "2 months ago" }
  ],
  "photos": [
    { "url": "https://...", "category": "exterior" }
  ],
  "hours": [
    { "day": "monday", "open": "08:00", "close": "18:00" }
  ],
  "attributes": [
    { "key": "wheelchair_accessible", "label": "Wheelchair Accessible", "value": true }
  ],
  "qAndA": [
    { "question": "Do you do emergency calls?", "answer": "Yes, 24/7." }
  ],
  "geo": { "lat": 47.6062, "lng": -122.3321 },
  "placeId": "ChIJ_...",
  "serviceArea": "Greater Seattle"
}
```

Only `name` and `address` are required. All other fields are optional.

**Response** (201):

```json
{
  "data": {
    "profile": {
      "slug": "joes-plumbing-heating-seattle",
      "businessName": "Joe's Plumbing & Heating",
      "niche": "plumbing",
      "industry": "construction",
      "listingCompleteness": 92,
      "reviewQuality": 85
    },
    "landingPage": {
      "slug": "joes-plumbing-heating-seattle",
      "sectionCount": 10,
      "status": "draft",
      "version": 1
    }
  },
  "error": null,
  "meta": { "ingestedAt": "2026-03-29T..." }
}
```

### `GET /api/gmb/ingest`

List all landing pages. Optional `?tenantId=` filter.

### `GET /api/gmb/ingest/[slug]`

Retrieve a specific landing page by slug.

### `PATCH /api/gmb/ingest/[slug]`

Update landing page fields: `status`, `metaTitle`, `metaDescription`, `accentColor`, `leadMagnetSlug`.

### `DELETE /api/gmb/ingest/[slug]`

Delete a landing page. Returns 204 on success.

## Landing Page Sections

Generated pages include up to 10 section types, conditionally included based on available data:

| Section | Condition | Content |
|---------|-----------|---------|
| `hero` | Always | Headline, CTA, background image, rating badge |
| `trust-bar` | Has rating | Star rating, review count, attribute badges |
| `services` | Has additional categories | Service list from GMB categories |
| `social-proof` | Has reviews | Top 5 reviews with Google attribution |
| `about` | Always | Description, phone, address, website, map |
| `hours` | Has hours data | Business hours table |
| `attributes` | Has positive attributes | "Why Choose Us" badge grid |
| `faq` | Always (fallback generated) | Q&A from GMB or auto-generated per industry |
| `lead-magnet` | Always | Lead capture form (name, email, phone, service) |
| `cta-banner` | Always | Final CTA with phone link |

## Niche Detection

The ingestor maps 70+ Google Business categories to 13 industry categories:

`service`, `legal`, `health`, `tech`, `construction`, `real-estate`, `education`, `finance`, `franchise`, `staffing`, `faith`, `creative`, `general`

Matching is case-insensitive with exact match priority, then substring fallback.

## Quality Scores

Three computed metrics on every ingested profile:

- **Listing Completeness** (0-100): Weighted score across name, address, phone, website, description, photos, reviews, hours, attributes
- **Review Quality** (0-100): Composite of avg rating (40%), review volume (30%), text depth (30%)
- **Digital Presence Gap** (0-100): From `discovery-scout.ts` — higher = more opportunity

## SEO Features

- **JSON-LD**: schema.org `LocalBusiness` with `PostalAddress`, `GeoCoordinates`, `AggregateRating`, `OpeningHoursSpecification`
- **Meta tags**: Auto-generated `<title>` (max 60 chars) and `<meta description>`
- **Open Graph**: Title, description, image for social sharing
- **Canonical URL**: `/lp/{slug}`
- **Static generation**: `generateStaticParams()` pre-renders all published pages at build time

## Privacy & Legal

- Review authors stripped to first name only (privacy sanitization)
- Review text truncated at 280 characters
- Google attribution footer: "Reviews sourced from Google"
- No PII stored beyond what the business publicly lists

## Accessibility (WCAG 2.2 AA)

- Single `<h1>` per page, sequential heading hierarchy
- Skip-to-content link
- All form inputs have visible `<label>` with `htmlFor`/`id` via `useId()`
- `aria-required`, `aria-invalid`, `aria-describedby` on form fields
- `aria-live="polite"` for form status announcements
- Star ratings with `aria-label`; decorative elements `aria-hidden`
- FAQ uses native `<details>/<summary>` (no JS accordion)
- Hours table with proper `<th scope>` headers

## Database

Table: `lead_os_landing_pages`

```sql
CREATE TABLE IF NOT EXISTS lead_os_landing_pages (
  slug       TEXT PRIMARY KEY,
  tenant_id  TEXT,
  payload    JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

Dual-write: in-memory `Map` + PostgreSQL JSONB. Memory store capped at 10,000 entries with LRU eviction. DB failures are silently handled (memory-only fallback).

## Files

| File | Purpose |
|------|---------|
| `src/lib/gmb-ingestor.ts` | GMB data ingestion, niche detection, scoring |
| `src/lib/landing-page-generator.ts` | Page generation, JSON-LD, CRUD operations |
| `src/app/api/gmb/ingest/route.ts` | POST ingest, GET list |
| `src/app/api/gmb/ingest/[slug]/route.ts` | GET/PATCH/DELETE single page |
| `src/app/lp/[slug]/page.tsx` | Public landing page renderer (SSG) |
| `src/components/LPLeadCaptureForm.tsx` | Client-side lead capture form |
| `src/lib/content-quality-scorer.ts` | Per-section quality scoring, SEO scoring |
| `src/lib/ai-content-enricher.ts` | LLM-powered content improvement |
| `src/lib/gbp-sync-scheduler.ts` | Scheduled GBP re-ingestion with change detection |
| `src/app/api/gmb/ingest/[slug]/quality/route.ts` | GET quality score for a landing page |
| `src/app/api/gmb/ingest/[slug]/enrich/route.ts` | POST AI enrichment for a landing page |
| `src/app/api/gbp-sync/route.ts` | POST/GET sync job management |
| `src/app/api/gbp-sync/[jobId]/route.ts` | GET/PATCH/DELETE/POST single sync job |
| `src/app/api/gbp-sync/due/route.ts` | GET due jobs (cron-secret auth) |
| `tests/gmb-ingestor.test.ts` | 51 tests |
| `tests/landing-page-generator.test.ts` | 44 tests |
| `tests/content-quality-scorer.test.ts` | 57 tests |
| `tests/ai-content-enricher.test.ts` | 16 tests |
| `tests/gbp-sync-scheduler.test.ts` | 29 tests |

## Content Quality Scoring

`GET /api/gmb/ingest/[slug]/quality` returns a `ContentQualityReport` with:

- **Per-section scores** (0-100): hero, trust-bar, services, social-proof, about, hours, FAQ, lead-magnet, cta-banner
- **SEO score** (0-100): meta title length, meta description, JSON-LD, canonical URL, OG image
- **Overall grade**: excellent (85+), good (70+), fair (50+), poor (<50)
- **Recommendations**: prioritized suggestions for sections scoring below 60

## AI Content Enrichment

`POST /api/gmb/ingest/[slug]/enrich` improves content using LLM:

- Hero headlines rewritten for SEO and conversion
- Short about descriptions expanded to 2-3 sentences
- FAQ answers under 50 chars improved with niche-relevant detail
- Safe JSON parsing from LLM output with markdown code block fallback
- Graceful dry-run when AI is not configured (returns originals unchanged)
- Token usage tracking and confidence scoring per section

## Scheduled GBP Sync

Automated re-ingestion via `/api/gbp-sync/`:

- Create sync jobs with cron expressions (e.g. `0 */6 * * *` for every 6 hours)
- `GET /api/gbp-sync/due` returns jobs ready to execute (cron-secret auth)
- Change detection: compares new vs existing landing page to flag updates
- Consecutive failure tracking with automatic status management
- External cron (e.g. Railway cron, n8n) polls due endpoint and triggers execution

## Tenant Provisioning (Phase 3)

The tenant provisioner now runs 13 steps:

1. create-tenant
2. generate-niche
3. register-niche
4. configure-funnels
5. setup-creative-jobs
6. provision-workflows (optional)
7. configure-crm (optional)
8. generate-embed
9. **provision-subdomain** (new) — auto-provisions `{slug}.leados.io` with SSL
10. **deploy-landing-page** (new, optional) — deploys generated LP to subdomain
11. **send-welcome-email** (new, optional) — LLM-generated or template welcome email
12. create-operator
13. send-welcome
