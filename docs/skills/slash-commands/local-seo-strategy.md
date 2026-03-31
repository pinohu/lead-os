# Local SEO Strategy (Erie-Pro)

## Geographic Territory Model
Erie-pro is a "distributed local lead monopoly" — one exclusive provider per niche per city. SEO is the primary acquisition channel.

## Local SEO Data (`src/lib/local-seo.ts`)
- **15 neighborhoods**: Downtown Erie, Glenwood, Frontier, Academy, Lakeside, Little Italy, East/West/South Erie, Bayfront, Presque Isle, Millcreek, Harborcreek, Fairview, Summit Township
- **10 landmarks**: Presque Isle State Park, Erie Maritime Museum, Bayfront Convention Center, Waldameer Park, Tom Ridge Environmental Center, Erie Art Museum, Bicentennial Tower, Perry Square, UPMC Hamot, Erie International Airport
- **11 zip codes**: 16501-16511
- **Climate**: Lake effect snow (100+ inches/year), freeze-thaw cycles, summer humidity, spring flooding
- **Demographics**: Population 95,000, median home $125,000, homeownership 52%

## Per-Niche SEO Elements
Every niche page includes:
1. **Title**: "{Niche Services} in Erie, PA — Free Quotes"
2. **Meta description**: UNIQUE per niche (fixed — was duplicate across all niches)
3. **Schema.org**: LocalBusiness + Service markup with geo coordinates (42.1292, -80.0851)
4. **Breadcrumbs**: Home / Services / {Niche}
5. **Local context**: Category-aware via `getLocalContext(slug)`:
   - Home services → lake-effect climate, older housing stock
   - Auto → road salt, potholes, harsh winters
   - Health → community healthcare access
   - Professional → PA regulations, regional economy

## Content Depth Per Niche (15 page types)
1. Main landing page (hero, services, quote form, provider listings)
2. Blog (topic titles with "Learn More" links)
3. Guides (topic titles with "Get Expert Help" links)
4. FAQ (6-8 Q&As, Erie-specific answers)
5. Pricing (quick reference)
6. Costs (detailed breakdown with DIY vs Pro)
7. Compare (hiring guide framework)
8. Emergency (24/7 info + directory link)
9. Glossary (12-16 Erie-localized terms)
10. Seasonal (4-season maintenance, urgency levels)
11. Checklist (interactive, 10-12 items)
12. Directory (provider listings + claim CTAs)
13. Reviews (customer review display + submission)
14. Tips (14+ actionable tips, Erie-specific)
15. Certifications (5-6 real credentials with verification)

## Sitemap
`src/app/sitemap.ts` generates: 44 niches × 15 pages + 9 static = 669 URLs
All with proper lastModified, changeFrequency, and priority values.

## Internal Linking
`src/lib/internal-linking.ts` maps 3-5 related niches per niche.
Cross-niche links appear on every niche page for SEO juice distribution.
