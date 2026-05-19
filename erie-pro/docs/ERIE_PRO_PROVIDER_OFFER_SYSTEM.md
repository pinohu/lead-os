# Erie.Pro Provider Offer System (MVP)

## Purpose

Commercial operating system for **Local Authority Microsites**: ThriveCart billing, ConvertBox capture, Erie.Pro provisioning and dashboard. This document encodes risk controls from the blindspot analysis — not marketing promises.

## Source of truth hierarchy

1. **ThriveCart** — paid orders, subscriptions, refunds (billing truth).
2. **Neon (Prisma)** — provider subscriptions, provisioning jobs, microsites, reconciliation queue.
3. **ConvertBox / Erie.Pro events** — interest and attribution (not billing).
4. **Directory / Google-sourced data** — inputs only; never auto-trusted for publish.

Public microsites expose `publicProfile` JSON only. Scores, blockers, and internal notes live in `privateIntel` (never rendered on public routes).

## Payment architecture

- **Primary billing:** ThriveCart (not Stripe) for setup + monthly.
- **Capture:** ConvertBox → `/api/webhooks/convertbox` (alias of `/api/events/convertbox`).
- **Fulfillment:** Erie.Pro `processProviderOfferCheckout` → `ProvisioningJob` → `Microsite` with publish gate.

**Payment ≠ trust.** `ProviderEligibilityTier` starts at `paid_unverified` after checkout.

## Plans and founding phases

| Slug | Setup | Monthly | Founding phase |
|------|-------|---------|----------------|
| starter | $1,500 | $199 | maturity_1 |
| professional | $3,500 | $499 | maturity_2 |
| premium | $7,500 | $1,250 | maturity_3 |
| elite | $15,000+ | $2,500+ | maturity_4 |

Phase discounts are configured in code (`resolveFoundingPriceCents`). Closing a phase does not retroactively change active subscriptions.

**Value stack:** `replacement_value` fields are **comparable pricing references**, not guaranteed outcomes or refunds.

## Compliance (copy and product)

- No guaranteed revenue, rankings, leads, ROI, or AI citations.
- Lead routing disclaimer on provider APIs and dashboard.
- Reviews: only sourced/attributed data; no fabricated social proof.
- Marketing copy lint: `containsBannedClaim()` in `provider-offer-compliance.ts`.

## Data quality gate (trust-but-verify)

`evaluateMicrositePublish()` in `microsite-publish-gate.ts`:

| Score / condition | `MicrositePublishMode` |
|-------------------|------------------------|
| Low data | `draft` |
| Medium + blockers | `review_required` |
| High + verified + no blockers | `auto_eligible` → may go `live` |

Minimum auto-publish score: **0.72**. Unverified ownership always blocks auto-publish.

## Unmatched ThriveCart reconciliation (critical)

When a paid webhook cannot map to a provider plan or provision:

1. Event stored in `thrivecart_events` with `reconciliationStatus: unmatched`.
2. Row created in `thrivecart_reconciliation_items`.
3. Admin resolves via `POST /api/admin/reconcile-thrivecart-event`.

**Do not** drop unmatched paid events silently.

## Claim verification and exclusivity

- Reuse `Provider.verificationStatus` and `ClaimRequest` with `exclusivity` JSON schema:
  - `territoryNiche`, `territoryCity`, `exclusive: boolean`, `notes`, `verifiedAt`.
- Territory table unique `(niche, city)` remains the mechanical exclusivity lock for lead routing.
- Exclusivity in copy is **not** a monopoly guarantee.

## Maintenance limits (per plan)

Encoded in `ProviderPlan.maintenanceLimits`:

- `contentUpdatesPerMonth`
- `seoTuneUpsPerQuarter` (operational tune-ups, not ranking guarantees)
- `reportRegenerationsPerMonth`
- `supportResponseHoursSla`

Excess work requires upgrade or custom SOW.

## Key routes (MVP)

| Route | Status |
|-------|--------|
| `/providers/grow` | Live — safe copy |
| `/providers/offers` | Live — plan grid |
| `/providers/offers/[plan]` | Live — ThriveCart checkout CTA |
| `/providers/checkout/success` | Live |
| `/providers/checkout/cancelled` | Stub |
| `/providers/onboarding` | Stub checklist |
| `/providers/claim/[providerId]` | Redirect to existing claim flow |
| `/provider/dashboard` | Redirect to `/dashboard` + subscription API |
| `/admin/thrivecart-events` | Admin list + reconcile link |
| Microsite public URL | Phase 2 — template routes |

## APIs

| Method | Path | Notes |
|--------|------|-------|
| POST | `/api/webhooks/thrivecart` | Provider offer branch before automated offers |
| POST | `/api/webhooks/convertbox` | Alias |
| POST | `/api/provider-interest` | ConvertBox / landing capture |
| GET | `/api/offers/checkout-url` | ThriveCart URL + passthrough |
| POST | `/api/offers/start-checkout` | Returns checkout URL |
| GET | `/api/provider/subscription-status` | Auth required |
| GET | `/api/provider/leads` | Microsite quote leads |
| GET | `/api/provider/metrics` | No outcome guarantees in response |
| POST | `/api/admin/reconcile-thrivecart-event` | Admin only |

## Environment variables

```env
THRIVECART_WEBHOOK_SECRET=
THRIVECART_WEBHOOK_TOKEN=
THRIVECART_API_KEY=
THRIVECART_ACCOUNT_SLUG=relgard
NEXT_PUBLIC_CONVERTBOX_UUID=
FEATURE_PROVIDER_OFFERS=1
FEATURE_MICROSITE_AUTO_PUBLISH=0
```

Set `FEATURE_MICROSITE_AUTO_PUBLISH=0` in production until QA signs off on publish gate false-positive rate.

## Local webhook testing

```bash
# ThriveCart (signature or token)
curl -X POST "http://localhost:3002/api/webhooks/thrivecart?token=$THRIVECART_WEBHOOK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"event":"order.success","email":"test@example.com","product_id":"YOUR_MAPPED_ID","plan_slug":"starter","name":"Test Co","phone":"8145550100","service_slug":"plumbing"}'
```

Map `product_id` in `thrivecart_product_mappings` or set `plan_slug` passthrough.

## Terms outline (not legal advice)

1. Services are operational (hosting, templates, routing tools), not performance guarantees.
2. Founding pricing is phase-limited; renewals per plan agreement.
3. Provider warrants accuracy of submitted business data.
4. Erie.Pro may suspend publish for trust, legal, or data-quality reasons.
5. Lead routing is best-effort matching, not exclusive demand generation unless territory contract applies.
6. Chargebacks/refunds governed by ThriveCart; access may be suspended on failed payment.

## Known risks (MVP)

| Risk | Mitigation |
|------|------------|
| Unmapped ThriveCart product | Reconciliation queue + admin UI |
| Auto-publish with bad data | Publish gate + default `FEATURE_MICROSITE_AUTO_PUBLISH=0` |
| Duplicate webhooks | Existing `payloadHash` idempotency |
| Payment without provider match | `paid_unverified` tier; manual reconcile |
| Overpromising in sales | Compliance linter + disclaimer components |

## Phase 2

- Full microsite template routes (`/[category]/[city-state]/[slug]`, `profile.json`, `profile.md`)
- Admin UI for product mapping and reconciliation queue
- ConvertBox → `provider_interests` automation
- Drag-and-drop task reorder API
- Cron retry for failed `provisioning_jobs`
