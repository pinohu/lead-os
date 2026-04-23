# Go-to-market use cases → Lead OS (applied now)

This document ties each revenue play to **what already runs in this repo** after the Erie / directory / billing / integration work. Keep **`src/config/gtm-use-cases.ts`** in sync when you change flows.

| # | Play | Applied via (runtime) | This week (concrete) |
|---|------|-------------------------|----------------------|
| **1** | Erie.pro exclusive niche (plumbing first) | `POST /api/intake` + `x-tenant-id: erie` + `category` → `directory-lead-flow` → nodes `010` seed → `lead-delivery-hub` | Plumbing page → form → `npm run verify:migrations` → test lead → 20 plumber calls |
| **2** | Exclusive category ownership (city × niche) | Same stack; **one active node per `(tenant_id, metadata.category)`** as ops rule; separate `lead_os_tenants` + `billing_subscriptions` per sold territory | Package “only plumber for {city}” → one deal → seed tenant/node → enable in control plane |
| **3** | Managed lead ops | `sendLead()` / `triggerWorkflow()` / `notifyClient()` + SuiteDash + Activepieces URLs | One vertical tenant → webhooks → `LEAD_OS_ENABLE_LIVE_SENDS` staged → 3 demos |
| **4** | National directory territories | Clone **#1** per city: new tenant id + nodes migration; `LEAD_OS_DIRECTORY_TENANTS=erie,buffalo,...` or one deploy per city | Second city seed + smoke intake |
| **5** | White-label agencies | `billing_*` tables + operator actions + per-customer `LEAD_OS_TENANT_ID` deploy | Agency plan row + control plane demo |
| **6** | Home services concierge | Multiple `nodes` rows keyed by `metadata.category`; same intake | “Request anything” UI sends `category` → 1–2 nodes |
| **7** | Legal / immigration intake | `category` = practice area slug; `message` = case summary; billing enforce for seat | One attorney node + pilot intake JSON |
| **8** | Internal ops (YourDeputy) | All internal forms → `/api/intake` + `/dashboard/control-plane` + `Idempotency-Key` | Wire forms; watch DLQ / pricing |
| **9** | Integration hub | `lead-delivery-hub.ts` + env webhooks; events in `lead_os_events` | One Activepieces flow; retire duplicate Zaps |
| **10** | Platform resale | **Defer** — docs + billing exist; no new SKU until case studies | 3–5 wins from rows 1–9 first |

## Technical pointers (all plays)

- **Intake:** `src/app/api/intake/route.ts` — tenant match, billing (402), idempotency, `persistLead(body, tenantConfig)`, directory block.
- **Routing:** `src/lib/erie/directory-lead-flow.ts` — `LEAD_OS_DIRECTORY_TENANTS`, node lookup, `lead_os_directory_routes`, events `directory_*`.
- **Delivery:** `src/lib/integrations/lead-delivery-hub.ts` — `sendLead`, `triggerWorkflow`, `notifyClient`.
- **Seed reference:** `db/migrations/010_erie_directory_seed.sql`.
- **Env templates:** `.env.erie.example`, `.env.example` (`LEAD_OS_DIRECTORY_TENANTS`, `PABBLY_WEBHOOK_URL`, …).
- **Operator:** `POST /api/operator/actions`, `/dashboard/control-plane`.

## Exclusivity (practical rule)

“Exclusive plumber for Erie” = **business + data**: only **one** `nodes` row with `status = 'active'` and `metadata.category = 'plumbing'` for that `tenant_id`. Additional providers stay **`paused`** until you sell the slot. The router already picks the first active match; enforce exclusivity in ops, not magic auto-pricing.

## Code import (optional UI / admin)

```ts
import { GTM_USE_CASES, getGtmUseCaseById } from "@/config/gtm-use-cases";
```

Use for internal dashboards or onboarding wizards.

## Operator tooling (execution)

1. **Terminal —** `npm run gtm:print` (optional `--json`, `--id=<n>`, `--slug=<slug>`). Use case **#1** answers to both `erie-exclusive-niche` and the alias `erie-plumbing`.
2. **Dashboard —** sign in as an operator, open **`/dashboard/gtm`**. Each card shows anchors, env keys, checklist, and derived links to dashboard routes, APIs, and repo files. Change **status** (`not_started` → `live`, etc.) or **notes**; values persist per `LEAD_OS_TENANT_ID` in **`gtm_use_case_statuses`** (migration `011`).
3. **API —** `GET /api/operator/gtm` for JSON automation; `PATCH` / `POST` same path with `{ "slug": "...", "status": "in_progress", "notes": "..." }` (at least one of `status` or `notes`). Unknown slugs → `404`. Tenant header must match the deployment when `x-authenticated-tenant-id` is sent.
4. **Workflow —** keep this markdown and `src/config/gtm-use-cases.ts` in sync; use the dashboard to track which play is **live** for the current tenant, then drive technical work from the linked control plane, intake, and migrations already referenced in-column.
