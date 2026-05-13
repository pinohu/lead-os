# Boost.space Revenue Action Setup

Status: BLOCKED-EXTERNAL until the scenarios are created inside the Boost.space dashboard.

## Goal

Boost.space consumes Erie.Pro revenue actions from Neon, then marks each action as queued, completed, failed, or skipped. Neon remains the source of truth.

## Required Environment

- `REVENUE_ACTIONS_API_TOKEN` or `BOOST_SPACE_REVENUE_ACTION_TOKEN`
- `NEXT_PUBLIC_APP_URL=https://erie.pro`

Use `BOOST_SPACE_REVENUE_ACTION_TOKEN` if Boost.space should have a dedicated token. If it is blank, the endpoint accepts `REVENUE_ACTIONS_API_TOKEN`.

## Code-Side Endpoints

- Poll queue: `GET https://erie.pro/api/integrations/boostspace/revenue-actions?status=planned&outcome=route&limit=50`
- Status callback: `POST https://erie.pro/api/integrations/boostspace/revenue-actions`
- Generic queue: `GET https://erie.pro/api/revenue-actions?status=planned`
- Generic status update: `PATCH https://erie.pro/api/revenue-actions`

Authentication header:

```http
Authorization: Bearer {{BOOST_SPACE_REVENUE_ACTION_TOKEN_OR_REVENUE_ACTIONS_API_TOKEN}}
```

## Scenario 1: Erie.Pro Revenue Action Router

1. Create a scheduled scenario in Boost.space.
2. Add HTTP GET module.
3. URL: `https://erie.pro/api/integrations/boostspace/revenue-actions?status=planned&outcome=route&limit=50`
4. Add `Authorization` header.
5. Iterate `actions[]`.
6. Create/update the matching downstream record based on `automationPayload.routing.preferredTool`.
7. Use `idempotencyKey` as the dedupe key.
8. POST status callback:

```json
{
  "id": "{{action.id}}",
  "status": "queued",
  "externalSystem": "boostspace",
  "externalRecordId": "{{boostspace.record.id}}",
  "ownerNote": "Boost.space accepted route action."
}
```

Success criterion: planned route actions move to queued and include the Boost.space external record ID.

## Scenario 2: Erie.Pro Delivery Dispatch

Poll:

`https://erie.pro/api/integrations/boostspace/revenue-actions?status=planned&outcome=deliver&limit=50`

For each action:

1. Read `automationPayload.context.offerSlug`, `customerEmail`, `serviceSlug`, `orderId`, and `eventMetadata`.
2. Create the appropriate SuiteDash/Taskade/ProductDyno handoff.
3. POST status callback with `status=queued`.

Success criterion: every paid offer gets a fulfillment handoff with service and checkout context attached.

## Scenario 3: Erie.Pro Recovery Dispatch

Poll:

`https://erie.pro/api/integrations/boostspace/revenue-actions?status=planned&outcome=recover&limit=50`

For each action:

1. Preserve original `coupon`, `affiliate`, `utm*`, `offerSlug`, and `sourceEventType`.
2. Trigger the right abandoned-cart, refund-save, failed-payment, or cancellation sequence.
3. POST status callback with `status=queued`.

Success criterion: recovery actions route without showing the same cold checkout prompt again.

## Scenario 4: Erie.Pro Learning Sync

Poll:

`https://erie.pro/api/integrations/boostspace/revenue-actions?status=planned&outcome=learn&limit=50`

For each action:

1. Sync attribution dimensions into reporting.
2. POST status callback with `status=completed`.

Success criterion: attribution actions close as completed and remain queryable in Neon.

## Scenario Export

Run:

```bash
npx tsx src/scripts/setup-boostspace.ts
```

This writes:

`docs/external-setup/boostspace/revenue-action-scenarios.json`

Use the JSON as the scenario import/build reference in Boost.space.

## Failure Handling

- If downstream creation fails, POST `status=failed` with `ownerNote`.
- If an action is intentionally ignored, POST `status=skipped` with a reason.
- Never delete the Neon action record.
- Never use Boost.space as the source of truth.
