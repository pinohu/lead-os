# Erie.pro directory flow (local → lead routing → billing)

**All GTM plays (1–10)** are mapped in [GO-TO-MARKET-USE-CASES.md](./GO-TO-MARKET-USE-CASES.md) and in `src/config/gtm-use-cases.ts`.

## What this does

1. **Intake** — `POST /api/intake` with `x-tenant-id: erie` (or `?tenant=erie`) and body fields below.
2. **Persist** — Lead stored via existing `persistLead` / runtime store with tenant from resolved config.
3. **Directory routing** — When `LEAD_OS_DIRECTORY_TENANTS` includes the resolved tenant (default `erie`), and `category` is set, the system resolves an **active** `nodes` row by `metadata.category`, checks **billing** if `LEAD_OS_BILLING_ENFORCE=true`, writes **`lead_os_directory_routes`**, emits canonical events, and calls **`sendLead()`** (SuiteDash → Activepieces → generic webhook → simulated log).
4. **Control plane** — Operator actions unchanged; use `/dashboard/control-plane` with operator cookie/JWT.
5. **GTM tracking** — Use **`/dashboard/gtm`** (or `npm run gtm:print -- --slug=erie-plumbing`) to record Erie-first rollout status against the canonical GTM config; see [GO-TO-MARKET-USE-CASES.md](./GO-TO-MARKET-USE-CASES.md#operator-tooling-execution).

## Database seed

Migration **`010_erie_directory_seed.sql`** inserts:

- Tenant row **`erie`** in `lead_os_tenants`
- Nodes **`plumber_erie_test_1`** (plumbing) and **`hvac_erie_test_1`** (hvac)
- **`billing_subscriptions`** for `erie` on plan **`enterprise`** (active)
- Table **`lead_os_directory_routes`** for routing audit

Run `npm run verify:migrations` after applying SQL.

## Environment

See **`.env.erie.example`**. Minimum for a full local demo:

- `LEAD_OS_TENANT_ID=erie`
- `LEAD_OS_DATABASE_URL` / `DATABASE_URL`
- `LEAD_OS_AUTH_SECRET`, `CRON_SECRET`
- `LEAD_OS_DIRECTORY_TENANTS=erie` (optional; defaults to `erie`)
- `LEAD_OS_BILLING_ENFORCE=true` to prove subscription gating on intake

Integration URLs (optional):

- `SUITEDASH_*` — CRM contact create
- `ACTIVEPIECES_WEBHOOK_URL` — automation JSON POST
- `PABBLY_WEBHOOK_URL` or `LEAD_OS_AUTOMATION_WEBHOOK_URL` — secondary webhook

## Detect configured keys (no secret values)

```bash
node scripts/detect-env-presence.mjs
```

## Test requests (PowerShell)

Submit a plumbing lead (replace origin if needed):

```powershell
$body = @{
  source = "contact_form"
  tenantId = "erie"
  category = "plumbing"
  email = "test.plumber@example.com"
  firstName = "Test"
  lastName = "Lead"
  message = "Need emergency drain service"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/intake" -Method POST -Headers @{
  "Content-Type" = "application/json"
  "x-tenant-id" = "erie"
  "Idempotency-Key" = "erie-demo-1"
} -Body $body
```

Wrong tenant (422):

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/intake?tenant=erie" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"source":"contact_form","tenantId":"other","category":"plumbing","email":"a@b.com"}'
```

Billing blocked (402) — set `LEAD_OS_BILLING_ENFORCE=true` and remove or cancel `erie` row in `billing_subscriptions`, then retry.

## Docker

```bash
docker compose up --build
```

Set `LEAD_OS_TENANT_ID=erie` and `LEAD_OS_DIRECTORY_TENANTS=erie` in `.env` before `docker compose up`. Worker service runs when `REDIS_URL` is set.

## Operator smoke (curl)

Requires operator session cookie or documented operator auth — use the dashboard UI for pause/resume node and DLQ actions after signing in.

## Limitations

- **Idempotency cache** for intake is **in-memory** (single instance); use a shared store in multi-replica production.
- **Directory routing** requires **Postgres** for node lookup and route row; without DB, fallback node map is minimal.
- **SuiteDash** throws if keys are partial; hub skips CRM when keys or email missing.
