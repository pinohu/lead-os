# Operator runbook

This document describes how to operate the hosted runtime safely: health checks, pricing modes, queues, and incident triage.

## Daily checks

1. Open `/dashboard/control-plane` after signing in with an allowed operator email (`LEAD_OS_OPERATOR_EMAILS`).
2. Confirm **SYSTEM_ENABLED** matches the intended posture (off during maintenance).
3. Confirm **ENABLE_LIVE_PRICING** is **false** unless you are deliberately applying real price mutations.
4. Review **persisted dead-letter count** and the recent dead-letter list for recurring failures.

## HTTP endpoints (read-only diagnostics)

| Endpoint | Auth | Purpose |
|----------|------|---------|
| `GET /api/health` | Public | Liveness; includes pricing worker tick summary when available. |
| `GET /api/health/deep` | Public | Postgres, Redis, DLQ row count, pricing runtime snapshot. |
| `GET /api/system` | Public | High-level flags and integration hints (no secrets). |
| `GET /docs` | Public | In-app documentation hub (links to OpenAPI JSON, SLA summary, repo Markdown). |
| `GET /docs/api` | Public | Human-readable API entry + link to `/api/docs/openapi.json`. |
| `GET /api/queue` | `CRON_SECRET` / `LEAD_OS_AUTH_SECRET` **or** operator session / API identity | BullMQ counts + persisted DLQ row count. |
| `GET /api/operator/control-plane` | Operator session / middleware identity | JSON snapshot aligned with the dashboard control plane. |
| `GET /api/operator/gtm` | Operator session | Merged go-to-market use cases from `src/config/gtm-use-cases.ts` plus persisted rollout status (`gtm_use_case_statuses`, migration `011`). |
| `PATCH` / `POST /api/operator/gtm` | Operator session | Update `{ slug, status?, notes? }` for a canonical use-case slug (aliases such as `erie-plumbing` resolve to Erie #1). Writes `operator_audit_log`. |
| `POST /api/operator/actions` | Operator session | Control-plane mutations (DLQ, nodes, pricing). Optional **`Idempotency-Key`** header dedupes identical retries (migration `008`). |

## Shadow vs live pricing

- **Shadow (default):** Recommendations are written; structural simulation runs; **live** SKU mutations require `ENABLE_LIVE_PRICING=true` plus other safety checks in `src/lib/pricing/safety-policy.ts`.
- **Live:** Only enable after migrations `005`–`006` are applied, Postgres and optional Redis are healthy, and you accept the risk of writing real prices.
- **Billing:** Migration `007` adds `billing_plans`, `billing_subscriptions`, and `operator_audit_log`. Set `LEAD_OS_BILLING_ENFORCE=true` only after seeding subscription rows for each tenant; otherwise pricing ticks will stop.

## Redis and workers

- With **REDIS_URL** set, the **Next.js web process no longer starts BullMQ workers**. Run `npm run worker` (or the Docker Compose `worker` service) so consumers and the distributed scheduler are not duplicated inside the web server.
- Without Redis, the **web** app may start the **memory fallback** scheduler in **non-production** only; production web without Redis will not simulate pricing ticks.
- Worker-only escape hatch: `LEAD_OS_WORKER_ALLOW_MEMORY=true` (development) allows a memory fallback inside the worker if Redis is absent — avoid in production.

## Control plane actions

Authenticated operators may `POST /api/operator/actions` with a JSON body (discriminated on `type`). All successful mutations append a row to `operator_audit_log` when the table exists.

| `type` | Payload | Effect |
|--------|---------|--------|
| `dlq_replay` | `deadLetterId` | Re-enqueue persisted BullMQ payload to main or measure queue. |
| `dlq_delete` | `deadLetterId` | Remove persisted DLQ row. |
| `node_pause` / `node_resume` | `nodeKey` | Toggle `nodes.status`. |
| `pricing_force_tick` | optional `tenantId` (must match deployment tenant) | Run `runPricingTickJob` once (billing + live gates apply). |
| `pricing_override` | `recommendationId`, `decision`: `reject` \| `expire` \| `force_apply` | Update recommendation; `force_apply` uses the same live safety stack as autopilot. |

The dashboard `/dashboard/control-plane` surfaces the same actions with browser confirmation prompts.

## Go-to-market execution

- **UI:** `/dashboard/gtm` lists all revenue plays with **launch checklist** items, env keys, and links derived from `technicalAnchors` (intake, control plane, repo paths). Erie play **#1** is highlighted as the recommended first path.
- **CLI:** `npm run gtm:print` for a terminal-friendly dump or `--json` for automation.
- **Persistence:** Status and notes are stored per deployment tenant in Postgres; apply migration **`011_gtm_use_case_statuses.sql`** (via the normal migration runner) before expecting PATCH to succeed in production.

## Intake

- Successful `POST /api/intake` responses are preceded by a structured log line `intake.persisted` with `tenantId`, `leadKey`, `existing`, `dryRun`, and `source`.
- Failures log `POST /api/intake failed` with the error message.

## Dead-letter queue

- BullMQ failures are mirrored into Postgres `dead_letter_jobs` for durable inspection.
- Use the control plane or `/api/queue` / `/api/health/deep` to inspect counts; re-drive work only after fixing root cause (schema drift, external API, etc.).
