# ThriveCart Product and Funnel Setup

Status: BLOCKED-EXTERNAL until the ThriveCart dashboard pages, bumps, upsells, downsells, coupons, affiliates, and split tests are confirmed in the `relgard` account.

Generated setup package:

- `docs/external-setup/thrivecart/master-setup.json`

Primary Erie.Pro endpoints:

- Webhook: `https://erie.pro/api/webhooks/thrivecart`
- Success pages: `https://erie.pro/offers/success/<offer-slug>`
- Revenue actions: `https://erie.pro/api/revenue-actions?ownerTool=thrivecart`

Official implementation notes used:

- ThriveCart supports API-created event subscriptions at `https://thrivecart.com/api/external/subscribe`.
- ThriveCart event subscriptions receive JSON.
- ThriveCart checkout passthrough variables can be added with `passthrough[key]=value` and are included in success pages, webhook data, Zapier, and API data.
- ThriveCart API keys are account-level secrets and must be stored only in environment variables.

Sources:

- https://developers.thrivecart.com/documentation/event_subscription/intro/
- https://developers.thrivecart.com/documentation/intro/authentication-via-api-key/
- https://support.thrivecart.com/help/passing-custom-variables-through-the-checkout/

## Products To Configure

Every paid Erie.Pro offer must have a full ThriveCart funnel, not a bare checkout:

1. Service Page Conversion Blueprint - Product `157`
2. Provider Launch Kit - Product `158`
3. ConvertBox Funnel-in-a-Box - Product `159`
4. Growth Intelligence Subscription - Product `160`
5. Government Opportunity Scanner - Product `161`
6. Client Portal Starter Pack - Product `162`
7. Missed-Call Recovery Kit - Product `163`
8. Seasonal Booking Campaign Pack - Product `164`
9. Review & Reputation Growth Kit - Product `165`

## Required Page Setup For Each Product

1. Open ThriveCart.
2. Open Products.
3. Create or edit the product from `master-setup.json`.
4. Confirm product ID, checkout URL, title, and price match the setup file.
5. Use a two-column desktop checkout and single-column mobile checkout.
6. Put customer-facing outcome copy above payment.
7. Remove any language that exposes internal funnel strategy.
8. Add the order bump from `orderBump`.
9. Add the one-click upsell from `upsell`.
10. Add the downsell from `downsell`.
11. Set success URL to `successUrl`.
12. Enable abandoned cart behavior using `abandonedCartTag`.
13. Enable affiliate eligibility when `affiliateEligible` is true.
14. Add coupon families from `couponFamilies`.
15. Configure A/B tests from `splitTests`.
16. Save and preview desktop/mobile.

## Required Passthrough Fields

Every checkout URL or embedded checkout should preserve these fields:

- `serviceSlug`
- `serviceLabel`
- `serviceFamily`
- `sourcePage`
- `sourcePageType`
- `convertBoxId`
- `offerSlug`
- `funnelSlug`
- `utm_source`
- `utm_medium`
- `utm_campaign`
- `gclid`
- `affiliate`
- `coupon`

Example URL format:

```text
https://relgard.thrivecart.com/erie-provider-launch-kit/?passthrough[serviceSlug]=plumbing&passthrough[offerSlug]=provider-launch-kit&passthrough[sourcePage]=https%3A%2F%2Ferie.pro%2Fplumbing%2Fpricing
```

## Webhook/Event Subscription Setup

Preferred API path:

1. Set `THRIVECART_API_KEY` in the environment.
2. Run `npx tsx src/scripts/setup-thrivecart.ts`.
3. Review `docs/external-setup/thrivecart/event-subscription-results.json`.

Manual dashboard fallback:

1. Open ThriveCart Settings.
2. Open API & Webhooks.
3. Add a webhook/event subscription for `https://erie.pro/api/webhooks/thrivecart`.
4. Enable JSON payloads where available.
5. Include all purchase, bump, upsell, downsell, subscription, refund, abandoned cart, and affiliate events listed in `master-setup.json`.
6. Set `THRIVECART_WEBHOOK_TOKEN` in Vercel and append it as `?token=<token>` only if dashboard validation requires a tokenized URL.
7. Send a test event.
8. Confirm `/api/webhooks/thrivecart` returns success and Neon records a `thriveCartEvent`.

## Product Funnel Map

| Main offer | Bump | Upsell | Downsell |
| --- | --- | --- | --- |
| Service Page Conversion Blueprint | Review & Reputation Growth Kit | Provider Launch Kit | Missed-Call Recovery Kit |
| Provider Launch Kit | Growth Intelligence Subscription | Client Portal Starter Pack | Service Page Conversion Blueprint |
| ConvertBox Funnel-in-a-Box | Missed-Call Recovery Kit | Provider Launch Kit | Review & Reputation Growth Kit |
| Growth Intelligence Subscription | Seasonal Booking Campaign Pack | Provider Launch Kit | Review & Reputation Growth Kit |
| Government Opportunity Scanner | Client Portal Starter Pack | Growth Intelligence Subscription | Seasonal Booking Campaign Pack |
| Client Portal Starter Pack | Review & Reputation Growth Kit | Provider Launch Kit | Service Page Conversion Blueprint |
| Missed-Call Recovery Kit | Review & Reputation Growth Kit | ConvertBox Funnel-in-a-Box | Service Page Conversion Blueprint |
| Seasonal Booking Campaign Pack | Growth Intelligence Subscription | Provider Launch Kit | Review & Reputation Growth Kit |
| Review & Reputation Growth Kit | Missed-Call Recovery Kit | Service Page Conversion Blueprint | Seasonal Booking Campaign Pack |

## Success Criteria

- All paid pricing CTAs point to ThriveCart checkout URLs.
- All checkouts preserve service, source, funnel, coupon, affiliate, and attribution passthrough.
- Purchase, bump, upsell, downsell, rebill, failed rebill, cancellation, refund, abandoned cart, and affiliate events hit Erie.Pro.
- Erie.Pro records the event in Neon and creates revenue actions.
- Paid events produce deliver and route actions.
- Abandoned/refund/cancel/failed events produce recover and learn actions.
- No paid Erie.Pro path goes directly to Stripe checkout unless explicitly marked as legacy/fallback.
