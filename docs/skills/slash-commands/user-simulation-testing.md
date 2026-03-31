# User Simulation Testing Strategy

Spawn 3 parallel agents to simulate real users visiting the site. Each agent tests a different persona with specific journeys.

## Agent 1: Consumer/Homeowner
Simulates a real Erie, PA resident looking for local services.

**Journeys to test:**
1. Emergency service seeker (plumber at 2am) → /plumbing/emergency
2. Comparison shopper (HVAC companies) → /hvac/compare, /hvac/costs
3. New homeowner exploring → /, /services, /areas, /about
4. Specific newer niche user → /veterinary, /accounting, /solar

**What to check per page:**
- First impression (1-10): Would a real person trust this?
- Content quality (1-10): Genuinely helpful or generic?
- Erie specificity (1-10): Written FOR Erie or could-be-anywhere?
- CTA clarity (1-10): Is the next action obvious?
- Issues: Anything placeholder-ish, broken, or unprofessional

## Agent 2: Service Provider
Simulates a local business owner evaluating the platform.

**Journeys to test:**
1. Plumber considering territory claim → /, /for-business, /for-business/claim
2. Dentist evaluating premium tiers → pricing, /dental/certifications
3. New niche provider (solar) → /solar, pricing justification
4. Provider comparing to competitors → /about, /terms, /admin access

**What to check:**
- Business credibility (1-10): Would a real owner take this seriously?
- Value clarity (1-10): Is the ROI obvious?
- Pricing perception (1-10): Justified for what you get?
- Professionalism (1-10): Real platform or side project?

## Agent 3: Content Quality Auditor
Performs cross-niche consistency and accuracy checks.

**Tasks:**
1. Cross-niche consistency: Compare 6 niche pages for quality parity
2. FAQ quality: Check 4 niches for depth, Erie specificity
3. Pricing accuracy: Verify prices are realistic for Erie PA market
4. Glossary quality: Check definitions, local relevance
5. Seasonal content: Verify lake-effect snow, freeze-thaw references
6. SEO meta: Check titles, descriptions, Schema.org, breadcrumbs
7. Homepage + key pages: World-class feel check

## Common Issues Found (patterns to watch for)
- Boilerplate text used on wrong niche categories
- Sample/placeholder disclaimers visible to users
- Missing phone numbers on emergency pages
- Duplicate meta descriptions across niche pages
- Admin dashboard publicly accessible
- "Services Services" double-word when niche label includes "Service"
- About page with no human identity
- Price ranges too broad to be useful ($50-$5,000)
