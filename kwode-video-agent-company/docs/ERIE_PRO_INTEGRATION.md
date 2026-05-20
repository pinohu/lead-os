# Erie.pro Integration

Erie.pro is a strategic tenant of the Kwode Video Factory. Two flavors of
video flow through the factory for Erie.pro:

1. **Consumer-facing** — niche / category / service-area videos that
   anchor the public directory pages.
2. **Provider-facing** — provider profile videos and monthly content
   delivered as part of provider plans.

The flows MUST stay separate so consumer messaging never leaks into
provider portals, and vice versa.

## Provider entitlements

Config-only in MVP. Live wiring requires `ERIE_PRO_ENABLED=true` and
`SAFE_PUBLIC_PUBLISHING_ENABLED=true` *plus* a real HTTP implementation
in `packages/connectors/src/erie-pro/erieProAdapter.ts`.

| Plan | Includes |
|---|---|
| Free Provider | Basic listing only — no video |
| Premium Provider | 1 provider profile video + 1 monthly short |
| Elite Provider | Provider profile + 4 monthly videos + GBP/social captions + lead tracking support |
| Exclusive Territory | 8-12 monthly videos + landing page video + ad creatives + call tracking + ROI dashboard support |

These map to `PricingPlan` rows
(see `packages/billing/src/plans.ts::erie-pro-directory-elite-bundle`).

## Consumer-facing video types

Pulled via `GET /api/video-types?niche=<slug>`. Reference niches in
`packages/video-catalog/catalog/niche-overrides.yaml`:

- plumbing → business-intro, service-explainer, local-service-provider,
  gbp-post, video-ad
- hvac → service-explainer, local-service-provider, gbp-post
- roofing → service-explainer, before-after, local-service-provider
- pest-control, landscaping, cleaning → before-after + service-explainer

A typical consumer flow for the `/plumbing` page:

1. A directory-listing-video-agent produces a 45s 16:9 intro.
2. A local-seo-video-agent batches 3-5 neighborhood/service-area
   variations.
3. A gbp-video-agent produces a 30s short for the niche GBP listing.
4. Videos publish to the Erie.pro niche page once
   `SAFE_PUBLIC_PUBLISHING_ENABLED=true` is set.

## Provider-facing video types

A typical provider flow for "Erie HVAC Demo":

1. `erie-pro-provider-video-agent` reads the provider record + monthly
   content calendar, and creates a batch of `VideoJob` rows for the
   month.
2. Each job runs the default chain.
3. `delivery-agent` delivers to the provider's SuiteDash portal
   (or, when wired, to the Erie.pro provider dashboard via
   `erieProAdapter`).
4. Provider monthly report rolls up via `analytics-agent`.

## How to keep consumer and provider messaging separate

- Consumer-facing brand profile lives on the **Erie.pro tenant**'s own
  brand profile (default voice tone: helpful, neutral, neighborly).
- Provider-facing brand profile lives on the **provider's Client**
  brand profile (their own voice tone, palette, forbidden phrases).
- `VideoJob.providerId` is set only for provider-facing jobs;
  consumer-facing jobs leave it null.
- Audit queries can filter by `tenant=erie-pro` and
  `provider IS NULL` to inspect consumer pipeline separately.

## What's wired vs. mocked

| Capability | Status |
|---|---|
| Provider plan entitlements (config) | ✅ |
| Provider video templates (catalog) | ✅ |
| Provider intake → brief → script → storyboard → prompts → QA | ✅ (via mocks) |
| Real ViMax / ComfyUI dispatch | ⏳ mocked until runtimes are wired |
| Erie.pro provider dashboard delivery | ⏳ mocked — gated behind flags |
| Erie.pro niche page publish | ⏳ mocked — gated behind flags |
