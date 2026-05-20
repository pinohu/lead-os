# YourDeputy Integration

YourDeputy is productized through the factory as a tenant with its own
catalog of video packs.

## Supported video templates

| Pack | Video type id | Notes |
|---|---|---|
| YourDeputy overview | `product-explainer` | 90-120s, 16:9 |
| Core plan explainer | `product-explainer` | Variant tag in metadata |
| Lead Capture Pack | `product-explainer` | Sales-focused |
| Scheduling Pack | `product-explainer` | Operational focus |
| Reviews Pack | `product-explainer` | Reputation focus |
| Billing Pack | `product-explainer` | Money flows |
| Retention Pack | `product-explainer` | Churn reduction |
| Suite comparison | `case-study` + custom | Side-by-side comparison |
| Client portal walkthrough | `client-portal` | Onboarding |
| Onboarding video | `onboarding` | 3-5 minute |
| Automation explainer | `product-explainer` | Workflow focus |
| Sales funnel video | `sales-funnel` | Stage-tagged |

## How to start a YourDeputy job

```bash
curl -X POST http://localhost:3000/api/video-jobs \
  -H 'Content-Type: application/json' \
  -d '{
    "tenantSlug": "yourdeputy",
    "videoTypeId": "product-explainer",
    "title": "YourDeputy Lead Capture Pack explainer",
    "intake": {
      "audience": "Local service business owners",
      "goal": "Sell Lead Capture Pack",
      "cta": "Start free trial",
      "durationSec": 90,
      "aspectRatio": "16:9"
    },
    "metadata": { "pack": "lead-capture" }
  }'
```

The seed script creates one such demo job by default.

## Delivery

In MVP, deliveries go to the client portal via `delivery-agent`. To wire
live delivery into a YourDeputy customer portal:

1. Set `YOURDEPUTY_ENABLED=true`.
2. Set `SAFE_PUBLIC_PUBLISHING_ENABLED=true`.
3. Implement `packages/connectors/src/yourdeputy/yourDeputyAdapter.ts`
   against the YourDeputy customer-portal API.

Until then, every YourDeputy delivery is `mocked`.

## Billing

YourDeputy billing is **not** wired in MVP. Plans can be defined in
`packages/billing/src/plans.ts` and `PricingPlan` rows created; charges
require `SAFE_LIVE_BILLING_ENABLED=true`.
