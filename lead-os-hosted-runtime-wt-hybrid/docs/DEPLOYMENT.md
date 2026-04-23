# Deployment guide

## Prerequisites

- **Node.js 20+**
- **PostgreSQL** with migrations from `db/migrations/` applied in order (through **`010_erie_directory_seed.sql`** for Erie.pro directory demo + **`009_stripe_webhook_idempotency_billing_cols.sql`** for Stripe webhook idempotency + `billing_subscriptions` Stripe linkage; **`007_billing_entitlements_audit.sql`** for billing gates + operator audit log).
- **LEAD_OS_AUTH_SECRET** (required for API middleware signature and operator JWTs).
- **CRON_SECRET** (or **LEAD_OS_AUTH_SECRET** as fallback for cron Bearer / `x-cron-secret`) if you call cron routes; cron POST/GET handlers validate this in-route as well as in middleware.
- **STRIPE_WEBHOOK_SECRET** / **STRIPE_SECRET_KEY** for `/api/billing/webhook` and **`/api/billing/stripe/webhook`** (public; configure both URLs in Stripe if you use the new path).
- **Optional:** `REDIS_URL` for BullMQ pricing queues and distributed scheduling.

## Local development

```bash
cd lead-os-hosted-runtime-wt-hybrid
npm install
cp .env.example .env.local   # edit values
npm run dev
```

In another terminal (when `REDIS_URL` is set):

```bash
npm run worker
```

Use `.env.example` as the authoritative list of variables. For a minimal local stack with Postgres and Redis:

```bash
docker compose up -d
```

## Docker image

```bash
docker build -t lead-os-hosted-runtime .
docker run --env-file .env -p 3000:3000 lead-os-hosted-runtime
```

Ensure `DATABASE_URL` (or `LEAD_OS_DATABASE_URL`) points at your Postgres instance and that migrations have run.

### Worker image (BullMQ)

```bash
docker build --target worker -t lead-os-worker .
docker run --env-file .env lead-os-worker
```

The worker stage runs `node --experimental-strip-types src/runtime/worker-entry.ts`. It needs **`REDIS_URL`**, database credentials, and the same pricing env vars as the web app. Use `docker compose up` to start `app`, `db`, `redis`, and `worker` together.

## Vercel

- Configure all secrets from `.env.example` in the Vercel project settings.
- Cron entries are defined in `vercel.json` (e.g. pricing tick). Verify `CRON_SECRET` matches what Vercel sends if you validate cron requests.
- **`/api/cron/*` POST/GET handlers** (discovery, optimize, experiments, pricing-tick, nurture) require **`CRON_SECRET`** (or `LEAD_OS_AUTH_SECRET` as fallback) in the handler itself — session/API-key access alone is **not** enough to invoke those mutation endpoints. Use **`/api/operator/actions`** (authenticated) for operator-triggered equivalents where applicable.
- Redis: use a managed Redis URL for production if you rely on BullMQ; otherwise pricing runs in degraded/no-queue mode.

## Boot order

1. Next.js starts; `src/instrumentation.ts` calls `startPricingRuntimeWeb()` — **no BullMQ workers** when `REDIS_URL` is set (use `npm run worker`).
2. Database pool connects when `DATABASE_URL` is set; migrations can run via `initializeDatabase()` where wired.
3. Pricing jobs require schema from migrations **005**–**007** (billing optional until `LEAD_OS_BILLING_ENFORCE=true`).

## Rollback

- Disable side effects: set `SYSTEM_ENABLED=false` and `ENABLE_LIVE_PRICING=false`, redeploy.
- Restore database from snapshot if schema or data migrations require reversal.

## Migration verification

```bash
npm run verify:migrations
```

With `DATABASE_URL` set, the script compares files in `db/migrations/` to rows in `lead_os_migrations` and exits non-zero if migrations are missing from the database.

## Backups

- Use your provider’s **continuous backup / PITR** for Postgres (recommended).
- **Automated dump (timestamped):** from `lead-os-hosted-runtime-wt-hybrid`, with `LEAD_OS_DATABASE_URL` or `DATABASE_URL` set:
  - `bash scripts/backup-db.sh` — writes `./backups/lead-os-<UTC>.sql.gz` (override directory with `LEAD_OS_BACKUP_DIR`).
- **Restore (destructive):** set `LEAD_OS_RESTORE_TARGET_URL` to a **dedicated** database (e.g. staging or a disposable instance), then:
  - `bash scripts/restore-db.sh ./backups/lead-os-<timestamp>.sql.gz`
- **Archive sanity check:** `npm run verify:backup-archive -- ./backups/lead-os-<timestamp>.sql.gz` (gzip magic + minimum size).
- **Integrity after restore:** run `npm run verify:migrations` against the restored URL, then smoke-test critical flows (auth, intake, operator, pricing tick).
- **Scheduled backups:** run `scripts/backup-db.sh` on a scheduler (cron, Kubernetes CronJob, CI artifact upload). Store artifacts off-instance with retention and encryption.
- **Temp verification DB:** restore into a fresh database name on the same host or a branch instance; run migrations if needed, then drop the temp DB after checks.

## Hardening reference

See [SYSTEM-HARDENING.md](./SYSTEM-HARDENING.md) for middleware tenant/billing gates, idempotency, rate limits, and phased security work.
