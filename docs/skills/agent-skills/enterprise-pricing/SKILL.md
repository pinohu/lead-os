---
name: enterprise-pricing
description: Maintain consistent enterprise pricing across kernel ($299-$2999/mo across 4 tiers) and erie-pro ($300-$1500/mo across 44 niches x 3 provider tiers) ensuring all 6 price-display locations stay synchronized
---

# Enterprise Pricing

**Tier:** METHODOLOGY (Tier 2)
**Category:** Business Logic & Data Integrity
**Domain:** Pricing models, payment integration, cross-codebase consistency

## When to Use

Trigger this skill when:
- Adding or modifying pricing for any tier or niche
- Launching a new niche that needs pricing assigned
- Updating Stripe product/price IDs
- Investigating pricing discrepancies reported by users
- Auditing that all 6 price-display locations are in sync

## Kernel Pricing Model (4 Tiers)

The kernel (SaaS platform) uses a fixed 4-tier model for agency subscriptions:

| Tier       | Monthly | Annual (per mo) | Target Customer          |
|------------|---------|-----------------|--------------------------|
| Starter    | $299    | $249            | Solo operators, 1 site   |
| Growth     | $599    | $499            | Small agencies, 3 sites  |
| Pro        | $1,499  | $1,249          | Mid agencies, 10 sites   |
| Enterprise | $2,999  | $2,499          | Large agencies, unlimited |

Each tier includes: `maxSites`, `maxUsers`, `maxLeadsPerMonth`, `supportLevel` (email/priority/dedicated/white-glove), `customBranding` (boolean), `apiAccess` (boolean).

## Erie-Pro Pricing Model (44 Niches x 3 Provider Tiers)

Each niche has demand-based base pricing. Providers within a niche choose from 3 tiers:

**Provider Tiers:**
| Tier     | Multiplier | Features                                   |
|----------|------------|--------------------------------------------|
| Standard | 1.0x base  | Listing, basic profile, lead notifications |
| Premium  | 1.5x base  | Priority placement, review highlights, badge |
| Elite    | 2.5x base  | Exclusive territory, featured spot, analytics |

**Base Pricing Bands (from niches.ts `monthlyFee`):**
- Low demand ($300-$500): demandScore 1-3
- Mid demand ($500-$800): demandScore 4-6
- High demand ($800-$1500): demandScore 7-10

**Example calculation:** HVAC (base $1,200, demandScore 9)
- Standard: $1,200/mo
- Premium: $1,800/mo
- Elite: $3,000/mo

## 6 Price-Display Locations

Prices appear in these 6 locations across the codebase. ALL must match when any price changes.

### 1. niches.ts -- `monthlyFee` field
Source of truth for erie-pro niche base pricing.
Path: `erie-pro/src/data/niches.ts`

### 2. stripe-integration.ts -- `NICHE_PRICING` map
Stripe price IDs mapped to niche slugs and tiers.
Path: `erie-pro/src/lib/stripe-integration.ts`

### 3. pricing-page.tsx -- Display component
User-facing pricing cards on the marketing site.
Path: `erie-pro/src/app/pricing/page.tsx`

### 4. provider-signup.tsx -- Claim flow pricing display
Pricing shown during territory claim checkout.
Path: `erie-pro/src/app/providers/signup/page.tsx`

### 5. kernel pricing config -- `PLATFORM_TIERS`
Source of truth for kernel SaaS tier pricing.
Path: `lead-os-hosted-runtime-wt-hybrid/src/config/pricing.ts`

### 6. kernel billing dashboard -- Display component
Pricing shown in the agency admin billing page.
Path: `lead-os-hosted-runtime-wt-hybrid/src/app/dashboard/billing/page.tsx`

## Synchronization Workflow

When ANY price changes:

1. **Identify scope**: Is this a kernel tier change or erie-pro niche change?
2. **Update source of truth first**: `niches.ts` for erie-pro, `pricing.ts` for kernel
3. **Cascade to all display locations**: Update remaining 5 (or 3) locations
4. **Update Stripe**: Create new Stripe prices (never modify existing -- Stripe prices are immutable). Update price IDs in `stripe-integration.ts`
5. **Verify**: Run the pricing audit command below

## Pricing Audit Command

```bash
# Erie-pro: Extract all monthlyFee values and compare to stripe config
node -e "
const n = require('./erie-pro/src/data/niches.ts');
const s = require('./erie-pro/src/lib/stripe-integration.ts');
Object.entries(n.NICHES).forEach(([slug, data]) => {
  const stripePrice = s.NICHE_PRICING[slug]?.standard;
  const match = stripePrice === data.monthlyFee;
  if (!match) console.log('MISMATCH:', slug, 'niches:', data.monthlyFee, 'stripe:', stripePrice);
});
console.log('Audit complete');
"
```

## Edge Cases

- **stripe-integration.ts `NICHE_PRICING` must match niches.ts `monthlyFee`**: These are the two most common drift points. When adding a niche, always update both in the same commit.
- **Annual pricing**: Erie-pro does not currently offer annual discounts. Kernel annual pricing is exactly `monthly * 10 / 12` rounded to nearest dollar.
- **Grandfathered prices**: Existing subscribers keep their price until they change tiers. New Stripe price IDs are created; old ones are not archived until all subscribers migrate.
- **Free trial**: Kernel offers 14-day free trial on Starter and Growth only. Erie-pro has no free trial -- providers pay from day one.
- **Currency**: All prices are USD only. No multi-currency support currently.

## Output Format

When reporting pricing changes:
1. Table showing old price vs. new price per affected tier/niche
2. List of all 6 locations updated with file paths
3. Stripe price ID changes (old ID archived, new ID created)
4. Pricing audit command output confirming zero mismatches
5. Note on grandfathered subscriber impact
