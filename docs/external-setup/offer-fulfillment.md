# Erie.Pro Offer Fulfillment Setup

Erie.Pro now treats offer fulfillment as a channel plan attached to each offer. The code reads the offer's declared channels and produces one outcome per channel:

- `erie-pro` - generate the protected Erie.Pro asset and email it.
- `boostspace` - sync the fulfilled purchase into the integration bus.
- `suitedash` - attach the customer/provider context to operations.
- `taskade` - create an internal review or monthly follow-up task when configured.
- `productdyno` - grant protected access to template kits or member-style libraries when configured.
- `documents` - send printable PDF/checklist generation payloads when configured.

## Code-Side Assets

- Channel planner: `erie-pro/src/lib/offer-fulfillment-automation.ts`
- Fulfillment worker: `erie-pro/src/lib/offer-fulfillment.ts`
- Cron endpoint: `GET /api/cron/offer-fulfillment`
- Setup export script: `npm run fulfillment:setup`
- Setup manifest: `docs/external-setup/offer-fulfillment/fulfillment-channel-map.json`

## Environment Variables

```text
PRODUCTDYNO_API_KEY=
PRODUCTDYNO_WEBHOOK_URL=
PRODUCTDYNO_PRODUCT_MAP_JSON=
DOCUMENT_DELIVERY_WEBHOOK_URL=
DOCUMENT_DELIVERY_TOKEN=
TASKADE_WEBHOOK_URL=
TASKADE_API_KEY=
CRON_SECRET=
```

`PRODUCTDYNO_PRODUCT_MAP_JSON` maps Erie.Pro offer slugs to ProductDyno product IDs or keys:

```json
{
  "provider-launch-kit": "productdyno-provider-launch-kit",
  "convertbox-funnel-in-a-box": "productdyno-convertbox-kit",
  "client-portal-starter-pack": "productdyno-client-portal-pack"
}
```

## ProductDyno Checklist

1. Create one ProductDyno product for every offer that declares `productdyno`.
2. Add the Erie.Pro asset URL field as a custom/member metadata field.
3. Configure access as lifetime for one-time kits and recurring for subscription reports.
4. Connect the ProductDyno webhook or API destination to `PRODUCTDYNO_WEBHOOK_URL`.
5. Confirm the webhook accepts `idempotencyKey`, `offerSlug`, `productKey`, `customer.email`, and `assetUrl`.
6. Test with one provider launch kit purchase and confirm member access is created only once on retries.

## Taskade Checklist

1. Create a workspace project named `Erie.Pro Fulfillment`.
2. Create queues named `offer-fulfillment` and `monthly-review`.
3. Connect a Taskade webhook or API bridge to `TASKADE_WEBHOOK_URL`.
4. Confirm each payload creates one task with `idempotencyKey`, `taskTitle`, `offerSlug`, `serviceLabel`, `customer.email`, and `assetUrl`.
5. Test with a monthly intelligence purchase and confirm the task lands in `monthly-review`.

## Document Delivery Checklist

1. Choose the document generator for this phase: Documentero, Crove, or an internal webhook.
2. Create templates for `pdf_blueprint` and `printable_kit`.
3. Connect the generation webhook to `DOCUMENT_DELIVERY_WEBHOOK_URL`.
4. Confirm each payload accepts `templateKey`, `documentType`, `offerSlug`, `serviceFamily`, and `assetUrl`.
5. Confirm generated documents either return a `documentId` or are attached back to the customer's SuiteDash/ProductDyno workspace.

## Success Criteria

- A paid purchase creates or reuses a fulfillment job.
- Erie.Pro generates and emails the primary protected asset.
- Optional ProductDyno, Taskade, and document actions are recorded in `fulfillment_jobs.output.automationResults`.
- Missing external credentials skip optional channels without failing the customer delivery.
- Required Boost.space and SuiteDash syncs still run through their dedicated code paths.
- The cron endpoint can safely retry pending fulfillment jobs.
