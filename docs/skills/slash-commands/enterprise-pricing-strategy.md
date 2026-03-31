# Enterprise Pricing Strategy

## Kernel (Lead OS SaaS) — $299-$2,999/mo
The kernel replaces 15-20 separate SaaS tools. Pricing reflects enterprise value:

| Tier | Price | Leads/mo | Key Features |
|------|-------|----------|-------------|
| Starter | $299/mo | 250 | 4D scoring, email nurture, 10 integrations |
| Growth | $599/mo | 1,500 | AI content, A/B testing, prospect scout, 25 integrations |
| Professional | $1,299/mo | 10,000 | All 137+ integrations, marketplace, Joy Layer, multi-tenant |
| Enterprise | $2,999/mo | Unlimited | SSO, 2FA, SOC 2, dedicated infra, SLA |

**Where prices appear (keep in sync):**
- `src/app/pricing/page.tsx` — main pricing page
- `src/app/onboard/page.tsx` — PLANS array (priceValue in cents)
- `src/app/help/page.tsx` — FAQ answer about plans
- `src/lib/email-templates.ts` — "Plans start at $299/month"

## Erie-Pro (Territory Model) — $300-$1,500/mo
Demand-based pricing per niche. One exclusive provider per niche per territory.

**Pricing tiers:**
- Standard: 1.0× base fee (listed in niches.ts)
- Premium: 1.5× base fee (featured badge, national directory, review automation)
- Elite: 2.5× base fee (Elite badge, GBP optimization, account manager)

**Price bands by demand:**
- Low demand ($300-$400): cleaning, handyman, pet-grooming, painting, locksmith
- Medium demand ($400-$600): plumbing*, hvac*, electrical*, roofing, fencing, etc.
- High demand ($700-$1,000): dental, foundation, home-security, flooring, chiropractic
- Premium demand ($900-$1,500): legal, solar, accounting

*Note: plumbing/hvac/electrical were raised from $500 to $700-$750 based on demand analysis.

**Where prices appear (keep in sync):**
- `src/lib/niches.ts` — monthlyFee field (source of truth)
- `src/lib/stripe-integration.ts` — NICHE_PRICING record (must match niches.ts)
- `src/components/for-business-content.tsx` — tier pricing display
- `src/app/for-business/claim/page.tsx` — form shows selected niche price
