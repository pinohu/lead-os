# Erie-Pro Niche Expansion Guide

When adding new niches to erie-pro, follow this exact process. No new page files are needed — `generateStaticParams()` auto-generates all 15 page types per niche.

## Files to Modify (5 files per niche)

### 1. `src/lib/niches.ts`
Add entry to the `niches` array:
```typescript
{ slug: "new-niche", label: "New Niche", icon: "emoji", description: "...", searchTerms: [...], avgProjectValue: "$X-$Y", monthlyFee: NNN, exclusiveAvailable: true, subscriberSlug: null, subscriberName: null },
```
Use demand-based pricing: $300-$500 low-demand, $500-$800 medium, $800-$1,500 high-demand.

### 2. `src/lib/niche-content.ts`
Add full content block (use UNQUOTED keys for non-hyphenated slugs, QUOTED for hyphenated):
- slug, label, pluralLabel, serviceLabel
- heroHeadline, heroSubheadline (Erie-specific)
- metaTitle, metaDescription (MUST be unique, mention Erie PA)
- primaryKeywords[], secondaryKeywords[]
- aboutDescription (reference Erie neighborhoods, climate, PA regulations)
- commonServices[] (6-8 items)
- faqItems[] (6-8 Q&A pairs, Erie-specific answers)
- blogTopics[], guideTopics[]
- comparisonPoints[], certifications[], trustSignals[]
- pricingRanges[] (each: { service, low, high, unit })
- emergencyServices: { available: boolean, description: string }
- seasonalTips (string)
- ctaPrimary, ctaSecondary, quoteFormTitle, quoteFormDescription

### 3. `src/lib/glossary-data.ts`
Add 12-16 terms: `{ term: "Term", definition: "Erie-localized definition" }`

### 4. `src/lib/seasonal-data.ts`
Add 4 seasons, each with 4-5 tasks:
```typescript
spring: [{ task: "...", details: "...", urgency: "essential" | "recommended" | "optional" }],
summer: [...], fall: [...], winter: [...]
```
Reference Erie's lake-effect snow, freeze-thaw cycles, summer humidity.

### 5. `src/lib/internal-linking.ts`
Add to `nicheRelationships`: 3-5 related niche slugs.
Add to `nicheLabels`: display label.

### 6. `src/lib/stripe-integration.ts`
Add explicit pricing to `NICHE_PRICING` record (must match niches.ts monthlyFee).

## Content Quality Standards
- Every entry MUST reference Erie, PA specifically
- Mention neighborhoods: Millcreek, Harborcreek, Fairview, Summit Township
- Reference PA regulations, licensing, building codes
- Use `getLocalContext(slug)` for category-appropriate boilerplate:
  - Home services → lake-effect climate, older housing stock
  - Auto → road salt, potholes, harsh winters
  - Health → community healthcare access
  - Professional → PA regulations, regional economy

## Verification
```bash
# Count entries (matches both quoted and unquoted keys)
node -e "const c=require('fs').readFileSync('src/lib/niche-content.ts','utf8');console.log(c.match(/^\s+[\"']?([a-z][-a-z]*)[\"']?\s*:\s*\{/gm)?.length)"
# Build
npm run build  # Check page count increased
```
