# Lead OS Deployment

## Platform

The app is Vercel-ready through `vercel.json` and `next.config.mjs` with `output: "standalone"`. A separate long-running worker should run `npm run worker` anywhere Redis is reachable.

## Required Production Environment

- `LEAD_OS_AUTH_SECRET`
- `LEAD_OS_TENANT_ID`
- `LEAD_OS_OPERATOR_EMAILS`
- `DATABASE_URL` or `LEAD_OS_DATABASE_URL`
- `REDIS_URL` for BullMQ worker/queues
- `CRON_SECRET`
- `NEXT_PUBLIC_SITE_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `CREDENTIALS_ENCRYPTION_KEY`

## Recommended Controls

- `LEAD_OS_SINGLE_TENANT_ENFORCE=true`
- `LEAD_OS_BILLING_ENFORCE=true`
- `LEAD_OS_ENFORCE_PRODUCTION_CONFIG=true` to fail startup when required production dependencies are absent
- `LEAD_OS_REQUIRE_WORKER_URL=true` plus `LEAD_OS_WORKER_URL` when the queue worker is deployed separately
- `LEAD_OS_ENABLE_LIVE_SENDS=false` until provider credentials are verified
- `DB_SSL_REJECT_UNAUTHORIZED=true` unless using a known self-signed database certificate

## Readiness Contract

- `/api/health` returns `503` when the database or required production dependencies are missing.
- `/api/health/deep` includes the full production readiness matrix, Redis status, database status, pricing queue state, DLQ count, and build id.
- Stripe checkout and portal creation may dry-run only outside production. In production, missing Stripe configuration is a hard error.
- Package provisioning persists a launch record in Postgres. Production package provisioning fails with `503` if Postgres is not configured.
- Operator authentication requires `LEAD_OS_AUTH_SECRET`; cron secrets are no longer accepted for operator token signing.
- `npm run verify:env:production` loads local env files when present, checks required production groups, prints no secret values, and exits non-zero if the vault is incomplete.
- `npm run smoke:postdeploy -- --url https://your-production-domain.example` verifies health, readiness, packages, onboarding, and build-id surfaces after deploy.
- `npm run smoke:postdeploy:plan -- --url https://your-production-domain.example` lists those checks without touching the network.

## Release Procedure

1. Install dependencies with `npm install`.
2. Run `npm run verify:env:production`. This is strict and fails when required production env groups are missing.
3. Run `npm run assess:production`. This is strict and fails when required production dependencies are missing.
4. Run `npm audit --omit=dev`.
5. Run `npm run verify:migrations`.
6. Run `npm test`.
7. Run `npm run build`.
8. Deploy web app.
9. Deploy worker using the same commit/build id.
10. Run `npm run smoke:postdeploy -- --url https://your-production-domain.example`.
11. Confirm `/api/health/deep`, `/api/queue`, and `/dashboard/control-plane`.

For terminal or CI integrations that need machine-readable output, run:

```bash
npm run assess:production:json
npm run verify:env:production:json
npm run smoke:postdeploy:json -- --url https://your-production-domain.example
```

## Rollback

Rollback the Vercel deployment to the previous successful deployment and restart the worker with the matching commit. Migrations are forward-only; rollback should restore code compatibility, not mutate database history.
