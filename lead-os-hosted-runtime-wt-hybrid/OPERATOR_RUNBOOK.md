# Lead OS Operator Runbook

## Daily Health

1. Open `/dashboard/control-plane`.
2. Check API health, DB, Redis, pricing runtime, BullMQ queue counts, and persisted DLQ count.
3. Check `/api/health/deep` with operator auth for machine-readable health.
4. Check `/api/queue` with an operator session or `x-cron-secret`.
5. Run `npm run assess:local` from the shell for a fast production-readiness cell.

## Queue And DLQ

- Pricing queue names:
  - `leados-pricing-main`
  - `leados-pricing-measure`
  - `leados-pricing-dlq`
- Worker entrypoint: `npm run worker`.
- Replay/delete actions are exposed through `/dashboard/control-plane` and `/api/operator/actions`.
- All operator actions are validated by `OperatorActionSchema` and written to `operator_audit_log`.

## Billing Incidents

1. Confirm `LEAD_OS_BILLING_ENFORCE`.
2. Check `billing_subscriptions` for entitlement gate state.
3. Check `lead_os_subscriptions` for customer-facing subscription state.
4. Replay Stripe webhook only if the event was not claimed in `stripe_webhook_events`.
5. Use Stripe portal/checkout APIs only through operator-authenticated routes.

## Security Incidents

- Rotate `LEAD_OS_AUTH_SECRET` if middleware signature integrity is suspected.
- Rotate `CRON_SECRET` if cron endpoint access is suspected.
- Confirm operator emails in `LEAD_OS_OPERATOR_EMAILS`.
- Review `operator_audit_log` for high-risk actions: `dlq_replay`, `dlq_delete`, `node_pause`, `node_resume`, `pricing_override`.

## Deployment Checks

Before promoting:

```bash
npm run assess:production
npm audit --omit=dev
npm run verify:migrations
npm test
npm run build
```

Known deploy warning: Next.js 16 reports that `middleware` convention is deprecated in favor of `proxy`; this is a warning, not a failing build condition.
