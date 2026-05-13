# Erie.Pro Monitoring

Production monitoring now covers the revenue spine:

- ThriveCart webhook processing failures.
- Fulfillment job failures.
- Boost.space purchase sync failures.
- SuiteDash purchase sync failures.
- Failed revenue actions.
- Planned revenue actions older than 24 hours.
- Recent 24-hour revenue-action activity.

## Endpoints

Protected revenue monitoring:

```text
GET /api/monitoring/revenue
Authorization: Bearer $CRON_SECRET
```

Authorized health details:

```text
GET /api/health
Authorization: Bearer $CRON_SECRET
```

Daily digest cron:

```text
GET /api/cron/revenue-digest
Authorization: Bearer $CRON_SECRET
```

## Vercel Cron

`vercel.json` schedules the revenue digest daily at 10:00 UTC:

```json
{ "path": "/api/cron/revenue-digest", "schedule": "0 10 * * *" }
```

## Environment Variables

- `CRON_SECRET` - required for protected monitoring endpoints.
- `REVENUE_MONITORING_EMAIL` - optional digest recipient; falls back to `ADMIN_EMAIL`.
- `REVENUE_MONITORING_TOKEN` - optional alternate bearer token for `/api/monitoring/revenue`.
- `EMAILIT_API_KEY` - required for production email delivery.

## Response Rules

- Monitoring status is `healthy` when no critical alerts exist.
- Monitoring status is `degraded` when any critical alert exists.
- Stale planned revenue actions are warnings because external tools may intentionally hold work until dashboards are configured.
- Failed webhook, fulfillment, or revenue action records are critical.

## Operational Runbook

1. If `/api/health` is degraded, call `/api/monitoring/revenue`.
2. For `failed_thrivecart_events`, inspect `/admin/revenue-stack` and the `thrivecart_events` rows.
3. For `failed_fulfillment_jobs`, inspect `/admin/offers` and rerun or repair the failed fulfillment job.
4. For `failed_boostspace_purchase_sync`, verify Boost.space API/webhook credentials and scenario status.
5. For `failed_suitedash_purchase_sync`, verify SuiteDash credentials and contact/project setup.
6. For `failed_revenue_actions`, inspect `/api/revenue-actions?status=failed`.
7. For `stale_planned_revenue_actions`, confirm whether the external dashboard task is still blocked; if handled manually, mark the action completed through the revenue-action status endpoint.
