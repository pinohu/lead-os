---
name: erie-pro-niche-expansion
description: Add new service niches to erie-pro by updating 5 data files (niches.ts, niche-content.ts, glossary-data.ts, seasonal-data.ts, internal-linking.ts) with Erie PA-specific content, demand-based pricing, and automatic page generation via generateStaticParams
---

# Erie-Pro Niche Expansion

**Tier:** METHODOLOGY (Tier 2)
**Category:** Content & Data Architecture
**Domain:** erie-pro niche onboarding, static generation, local content

## When to Use

Trigger this skill when:
- Adding a new service niche to erie-pro (e.g., "add pool cleaning")
- Expanding an existing niche with missing data files
- Bulk-adding multiple niches in one pass
- Fixing incomplete niche data that causes build errors

## 5-File Checklist

Every niche MUST have entries in all 5 files. A missing entry in any file will cause build failures or empty pages.

### 1. niches.ts -- Primary niche registry
Required fields per entry:
- `slug` (string) -- URL-safe identifier, lowercase, hyphens allowed
- `name` (string) -- Display name
- `category` (enum: home | auto | health | professional | outdoor | specialty)
- `description` (string, 150-300 chars) -- Erie-specific, not generic
- `monthlyFee` (number) -- Based on pricing band below
- `demandScore` (number 1-10) -- Erie market demand
- `seasonality` (enum: year-round | seasonal | peak-summer | peak-winter)
- `icon` (string) -- Lucide icon name

### 2. niche-content.ts -- Page copy and SEO content
Required fields per entry:
- `slug` (must match niches.ts)
- `heroTitle` (string) -- Include "Erie" or "Erie PA"
- `heroSubtitle` (string)
- `benefits` (array of 4-6 strings)
- `howItWorks` (array of 3-4 step objects)
- `faq` (array of 5+ question/answer pairs, Erie-specific)
- `metaDescription` (string, 150-160 chars, unique per niche)

### 3. glossary-data.ts -- Industry terms for the niche
Required: 8-15 terms per niche with `term`, `definition`, `relatedNiches[]`

### 4. seasonal-data.ts -- Seasonal demand patterns
Required: `peakMonths[]`, `offPeakMonths[]`, `seasonalTips[]` (3+ tips), `erieWeatherNote` (string referencing Lake Erie climate)

### 5. internal-linking.ts -- Cross-niche link map
Required: `relatedNiches[]` (3-5 slugs), `parentCategory`, `crossLinks[]` with anchor text

## Pricing Bands

Assign `monthlyFee` based on Erie market demand and competition:
- **Low demand** ($300-$500/mo): Niche services, low search volume (e.g., chimney sweep)
- **Mid demand** ($500-$800/mo): Moderate competition, steady year-round (e.g., landscaping)
- **High demand** ($800-$1500/mo): High competition, essential services (e.g., HVAC, plumbing)

The `demandScore` field (1-10) should correlate: scores 1-3 map to low, 4-6 to mid, 7-10 to high.

## Content Quality Standards

Every piece of content MUST include Erie-specific references. Reject generic copy.

**Required localizations:**
- Reference Erie PA neighborhoods (e.g., Millcreek, Harborcreek, Fairview, West Erie)
- Mention Lake Erie climate impacts where relevant (lake-effect snow, humidity)
- Include at least one Erie zip code or area reference per FAQ answer
- Seasonal data must account for Erie's 100+ inches annual snowfall for winter niches

**Prohibited patterns:**
- Generic "your city" or "your area" placeholder text
- Copy-pasted content from other niches without adaptation
- Fake review quotes or fabricated statistics

## Page Generation

Pages auto-generate via `generateStaticParams` in the app router. Adding data to all 5 files triggers:
- `/services/[slug]` -- Main niche page
- `/services/[slug]/providers` -- Provider listing
- `/services/[slug]/glossary` -- Industry terms
- `/services/[slug]/seasonal-guide` -- Seasonal tips

No manual route creation is needed. Verify pages build with `npm run build`.

## Edge Cases

- **Hyphenated slugs** require quoted keys in TypeScript objects: `"pressure-washing": { ... }` not `pressure-washing: { ... }`
- **Non-hyphenated slugs** can use unquoted keys: `landscaping: { ... }`
- **Category mismatch**: The `category` in niches.ts must match `parentCategory` in internal-linking.ts
- **Duplicate slugs**: Build will fail silently. Always grep existing slugs before adding.

## Verification Commands

After adding a niche, run these to confirm completeness:

```bash
# Count entries per file (all counts should match)
node -e "const n=require('./src/data/niches.ts');console.log('niches:',Object.keys(n.NICHES).length)"
node -e "const c=require('./src/data/niche-content.ts');console.log('content:',Object.keys(c.NICHE_CONTENT).length)"
node -e "const g=require('./src/data/glossary-data.ts');console.log('glossary:',Object.keys(g.GLOSSARY).length)"
node -e "const s=require('./src/data/seasonal-data.ts');console.log('seasonal:',Object.keys(s.SEASONAL).length)"
node -e "const l=require('./src/data/internal-linking.ts');console.log('linking:',Object.keys(l.LINKS).length)"
```

## Output Format

When reporting niche addition results:
1. List each file modified with the slug added
2. Confirm pricing band assignment with rationale
3. Report verification command outputs (all 5 counts)
4. Flag any content that needs Erie-specific enrichment
