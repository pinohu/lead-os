# SuiteDash Operational Sync Setup

Status: BLOCKED-EXTERNAL until the SuiteDash dashboard/API objects below are created or confirmed.

Erie.Pro now exposes a SuiteDash operations queue at:

- Poll: `https://erie.pro/api/integrations/suitedash/revenue-actions`
- Status callback: `POST https://erie.pro/api/integrations/suitedash/revenue-actions`
- Auth: `Authorization: Bearer $SUITEDASH_REVENUE_ACTION_TOKEN` when that env var is set.

## What Erie.Pro Sends

Each revenue event becomes a SuiteDash operational package with six idempotent operations:

1. `customer_contact` - buyer/requester/provider contact with service, offer, purchase, attribution, and source context.
2. `provider_contact` - business/provider context so fulfillment can be managed by company and service family.
3. `project` - operations workspace for fulfillment, routing, onboarding, or recovery.
4. `portal` - client/provider portal preparation for delivered assets and onboarding files.
5. `support_record` - support or revenue recovery record for abandoned, cancelled, failed, refunded, or urgent events.
6. `fulfillment_task` - concrete task queue item with owner, fallback tools, due timing, and Neon action ID.

Every operation includes an `idempotencyKey`. Use it as the unique external reference so repeated polling does not create duplicates.

## Click-By-Click Dashboard Checklist

1. Open SuiteDash and confirm the YOURDEPUTY workspace/account is selected.
2. Go to CRM settings and create or confirm custom fields:
   - Erie Action ID
   - Erie Automation Key
   - Erie Outcome
   - Erie Service
   - Erie Service Slug
   - Erie Service Family
   - Erie Offer
   - Erie Offer Slug
   - Erie Purchase ID
   - Erie Order ID
   - Erie Product ID
   - Erie Source URL
   - Erie UTM Source
   - Erie UTM Medium
   - Erie UTM Campaign
   - Erie GCLID
   - Erie Idempotency Key
3. Create tags:
   - `erie-pro`
   - `outcome:deliver`
   - `outcome:recover`
   - `outcome:route`
   - `provider-context`
   - `automated-offer`
4. Create project templates:
   - Erie.Pro Paid Offer Fulfillment
   - Erie.Pro Provider Routing
   - Erie.Pro Revenue Recovery
   - Erie.Pro Client Portal Setup
5. Create task templates:
   - Deliver purchased asset
   - Route provider/client context
   - Start recovery follow-up
   - Prepare portal assets
   - Review failed sync
6. Create support categories:
   - Revenue recovery
   - Fulfillment watch
   - Portal access
   - Provider operations
7. Confirm Secure API credentials are present in Vercel:
   - `SUITEDASH_YOURDEPUTY_PUBLIC_ID`
   - `SUITEDASH_YOURDEPUTY_SECRET_KEY`
   - optional `SUITEDASH_REVENUE_ACTION_TOKEN`
8. Use the generated package at `docs/external-setup/suitedash/operational-sync-package.json` to configure any SuiteDash automation, middleware, or manual import.

## Polling Rules

Use these views:

- Deliver: `GET /api/integrations/suitedash/revenue-actions?status=planned&outcome=deliver`
- Route: `GET /api/integrations/suitedash/revenue-actions?status=planned&outcome=route`
- Recover: `GET /api/integrations/suitedash/revenue-actions?status=planned&outcome=recover`
- All SuiteDash work: `GET /api/integrations/suitedash/revenue-actions?status=all`

For each returned package:

1. Read `operations`.
2. Skip operations where `required` is false unless the dashboard flow needs the optional context.
3. Create or update the matching SuiteDash object.
4. Store the `idempotencyKey` in the object notes/custom field.
5. Call the status callback when all required operations are handled.

## Status Callback

```json
{
  "id": "revenue-action-id",
  "status": "completed",
  "externalSystem": "suitedash",
  "externalRecordId": "suitedash-contact-or-project-id",
  "completedOperations": [
    "customer_contact",
    "project",
    "portal",
    "fulfillment_task"
  ],
  "ownerNote": "SuiteDash package created from Erie.Pro operation payload."
}
```

Valid statuses: `planned`, `queued`, `in_progress`, `completed`, `failed`, `skipped`.

## Success Criteria

- Every SuiteDash contact/project/task/support record can be traced back to an Erie.Pro revenue action ID.
- Re-running the poll does not create duplicates because each object stores an idempotency key.
- Paid events create contact, project, portal, and fulfillment task records.
- Recovery events create contact, support record, and recovery task records.
- Route events preserve service, offer, coupon, affiliate, funnel, and UTM context.
- No operational data is trapped only inside SuiteDash; Neon remains canonical.
