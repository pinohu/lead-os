---
name: local-seo-strategy
description: Implement Erie PA local SEO across 44 niches with unique meta descriptions, Schema.org LocalBusiness markup, BreadcrumbList navigation, 15 neighborhoods, 11 zip codes, and category-aware contextual content via getLocalContext()
---

# Local SEO Strategy

**Tier:** METHODOLOGY (Tier 2)
**Category:** Search Engine Optimization
**Domain:** Local search, structured data, meta tags, geographic targeting

## When to Use

Trigger this skill when:
- Adding SEO metadata to new or existing niche pages
- Implementing or fixing Schema.org structured data
- Auditing meta description uniqueness across niches
- Optimizing pages for Erie PA local search ranking
- Configuring `getLocalContext()` for category-specific content

## 15 Page Types Per Niche

Each of the 44 niches generates up to 15 page types, all requiring unique SEO treatment:

1. `/services/[slug]` -- Main niche landing page
2. `/services/[slug]/providers` -- Provider directory listing
3. `/services/[slug]/glossary` -- Industry terminology
4. `/services/[slug]/seasonal-guide` -- Seasonal tips
5. `/services/[slug]/pricing` -- Cost guide for consumers
6. `/services/[slug]/[neighborhood]` -- 1 per neighborhood (x10 neighborhoods served)

Total potential pages: 44 niches x 15 types = 660 unique pages, each needing unique meta.

## getLocalContext() Categories

The `getLocalContext(category)` function returns category-specific local data for content generation. Categories and their returned context:

**home** (HVAC, plumbing, roofing, electrical, etc.):
- Housing stock references (Erie's 1920s-1960s housing predominance)
- Common home issues (ice dams, basement flooding, old wiring)
- Neighborhood housing profiles

**auto** (mechanics, detailing, towing, body shops):
- Road salt damage references (Erie's heavy winter salting)
- Commute patterns (I-90, Peach Street corridor)
- Fleet service opportunities (commercial district references)

**health** (dentists, chiropractors, therapists, veterinarians):
- Healthcare access context (UPMC Hamot, Saint Vincent references)
- Insurance network awareness (common Erie-area plans)
- Accessibility requirements emphasis

**professional** (lawyers, accountants, consultants, realtors):
- Business district references (downtown Erie, Peach Street)
- Local industry context (manufacturing, education, healthcare sectors)
- Professional licensing body references (PA state boards)

## Erie Geographic Data

### 15 Neighborhoods
Millcreek, Harborcreek, Fairview, Edinboro, Girard, North East, Wesleyville, Lawrence Park, McKean, Waterford, Summit Township, Greene Township, Union City, Corry, Lake City

### 11 Zip Codes
16501, 16502, 16503, 16504, 16505, 16506, 16507, 16508, 16509, 16510, 16511

Use these in structured data `areaServed` and in content body for geographic relevance signals.

## Schema.org Markup Requirements

### LocalBusiness (every provider page)
```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "[Provider Name]",
  "description": "[Unique description]",
  "areaServed": [
    { "@type": "City", "name": "Erie", "sameAs": "https://en.wikipedia.org/wiki/Erie,_Pennsylvania" }
  ],
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Erie",
    "addressRegion": "PA",
    "postalCode": "[specific zip]"
  }
}
```

### BreadcrumbList (every page)
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://erie.pro" },
    { "@type": "ListItem", "position": 2, "name": "[Category]", "item": "https://erie.pro/services" },
    { "@type": "ListItem", "position": 3, "name": "[Niche Name]", "item": "https://erie.pro/services/[slug]" }
  ]
}
```

### FAQPage (niche pages with FAQ sections)
Each FAQ must use `FAQPage` schema with `Question` and `AcceptedAnswer` types. Answers must be Erie-specific.

## Meta Description Requirements

**Uniqueness is mandatory.** No two pages across the entire site may share the same meta description.

**Format rules:**
- Length: 150-160 characters (Google truncates at ~160)
- Must contain: niche keyword + "Erie PA" or "Erie, Pennsylvania"
- Must contain: a differentiator (price range, number of providers, or seasonal relevance)
- Must NOT contain: generic phrases like "best services in your area"

**Template by page type:**
- Landing: "Find trusted [niche] in Erie PA. [X] verified providers, transparent pricing from $[low]-$[high]/mo. [Unique selling point]."
- Provider listing: "Compare [X] licensed [niche] providers serving [neighborhood], Erie PA. Read reviews, check availability, request quotes."
- Seasonal: "[Season] [niche] tips for Erie PA homeowners. Prepare for [weather condition] with local expert advice."

## Edge Cases

- **Never use generic boilerplate across different niche categories.** A plumber meta description template must differ structurally from a dentist template, not just swap the service noun. Different categories have different trust signals and user intents.
- **Neighborhood pages with zero providers**: Still generate the page with "Be the first [niche] provider in [neighborhood]" CTA. Do not 404 or noindex these -- they capture long-tail searches.
- **Zip code overlap**: Some neighborhoods span multiple zip codes. Use the primary zip in Schema but list all served zips in page content.
- **Schema validation**: Test all markup at https://validator.schema.org before deploy. Invalid Schema is worse than no Schema.

## Verification Workflow

1. Run `npm run build` to generate all static pages
2. Grep all meta descriptions for duplicates: `grep -r "metaDescription" src/data/ | sort | uniq -d`
3. Validate Schema.org output on 3 sample pages (one per category)
4. Check BreadcrumbList renders in Google Rich Results Test
5. Verify `getLocalContext()` returns category-appropriate content for each niche

## Output Format

When reporting SEO work:
1. Count of pages created/modified with unique meta descriptions
2. Schema types implemented per page type
3. Any duplicate meta descriptions found and resolved
4. getLocalContext() category assignments for new niches
5. Validation results from Schema.org checker
