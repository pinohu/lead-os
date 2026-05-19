# Erie.pro persona architecture

## Zones

| Zone | Routes (examples) | Audience | Primary goal |
|------|-------------------|----------|--------------|
| **Consumer discovery** | `/`, `/services`, `/directory`, `/areas`, `/[niche]` | consumer | Choose a service and get help |
| **Consumer profiles** | `/[niche]/[provider]` | consumer | Evaluate one business and contact them |
| **Provider acquisition** | `/pros`, `/for-business`, `/for-business/claim` | provider | Claim listing, understand plans |
| **Provider product** | `/dashboard/*` | provider | Leads, profile, billing |
| **Admin** | `/admin/*` | admin | Directory, revenue, ops |

## Audience × CTA matrix

| Page type | Consumer CTA | Provider CTA |
|-----------|--------------|--------------|
| Homepage / niche hub | Primary (get matched, browse) | Footer utility → `/pros` |
| Provider profile | Primary (quote, call) | Footer utility only if unclaimed listing |
| `/pros`, `/for-business` | Small “Find services” escape hatch | Primary |
| `/dashboard` | None | Primary |
| `/admin` | None | None |

## Trust labels (copy rules)

| Label | Meaning | Consumer copy |
|-------|---------|---------------|
| **Claimed** | Business owner controls listing | “Listing claimed by the business” |
| **Verified** | Passed Erie.pro verification | “Verified provider” — do not imply government license |
| **Featured** | Editorial/paid placement in directory | “Featured in Erie.pro directory” |
| **Sponsored** | Paid placement / ad | Must say “Sponsored” where shown |

Never use “#1”, “guaranteed”, or “exclusive monopoly” on consumer pages.

## Code map

```
src/lib/audience-context.ts          — types, assertConsumerPage, CTA helpers
src/lib/page-audience-registry.ts    — pathname → audience config
src/lib/audience-content-prompts.ts  — AI generation locks
src/components/audience/             — AudienceProvider, SiteHeaderNav, OwnBusinessFooterLink
```

## Homepage recommendation

Keep **consumer-first**:

1. Hero: one vetted pro / get matched (not provider signup).
2. Service categories and social proof for homeowners.
3. Single subdued line: “Are you a local pro? See provider options” → `/pros`.

Provider pricing and territory language belong on `/pros` and `/for-business` only.

## Pages still needing manual split

- **Site footer** — “For Pros” column on all pages (acceptable as utility; consider hiding on `/dashboard` via layout split).
- **Mobile nav** — still consumer-weighted on all routes; wire to `usePageAudience()`.
- **`/pricing`** — confirm consumer “pricing guides” vs provider tiers (rename or split if ambiguous).
- **Homepage (`app/page.tsx`)** — audit hero for any provider-first blocks.
