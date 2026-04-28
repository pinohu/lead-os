# System hardening (hosted runtime)

This document maps engineering controls to the numbered “phase” checklist. Not every phase is fully automatable across ~500 API routes; where automation stops, operational process picks up.

| Phase | Status | Implementation notes |
|-------|--------|----------------------|
| 1 API security uniformity | **Partial** | Middleware enforces **single-tenant alignment** (`LEAD_OS_SINGLE_TENANT_ENFORCE`) and **billing gate** (`LEAD_OS_BILLING_ENFORCE`) for **all authenticated** `/api/*` traffic. Per-route Zod/audit for legacy routes: **incremental**; operator mutations use `operator_audit_log` + idempotency. Run `npm run enumerate:api-routes` for a full path list to classify. |
| 2 Idempotency | **Partial** | Postgres `idempotency_records` (migration `008`) + `Idempotency-Key` on `POST /api/operator/actions`. BullMQ DLQ replay uses stable job ids where applicable. |
| 3 Single-tenant | **Yes** | Default: reject API-key/session identity when `x-authenticated-tenant-id !== LEAD_OS_TENANT_ID`. Disable with `LEAD_OS_SINGLE_TENANT_ENFORCE=false`. |
| 4 Billing | **Partial** | Middleware: active subscription + API tier (`/api/operator` → `full`, else `standard`). Pricing ticks use `assertPricingExecutionAllowed`. Stripe sync → **future**. |
| 5 Build / tests | **Process** | Run `npm run build` and `npm test` in CI. |
| 6 Migrations | **Tooling** | `npm run verify:migrations` checks ordering + optional DB `lead_os_migrations` parity. |
| 7 Web/worker version | **Partial** | `LEAD_OS_BUILD_ID`, response header `x-leados-build-id`, `public/build-id.json` via `prebuild`, worker stdout + pricing bootstrap log field. **Mismatch detection** vs live worker: compare logs / build ids (no shared heartbeat yet). |
| 8 DLQ / retry | **Doc + constants** | `docs/RETRY-DLQ-POLICY.md`, `src/lib/pricing/retry-policy.ts`. BullMQ attempts remain bounded in `queue-client`. |
| 9 Alerting | **Partial** | `/api/health/deep` exposes `alerts` (DLQ spike, queue waiting) + structured `pricingLog` warnings when thresholds crossed. Wire to PagerDuty/Opsgenie externally. |
| 10 PII / governance | **Existing + doc** | GDPR routes under `/api/gdpr/*`. Document retention/backup in `DEPLOYMENT.md`. Dedicated “delete lead by key” API: **extend** when product confirms schema. |
| 11 Secret isolation | **Single-tenant mode** | One deployment = one tenant id; no cross-tenant secret sharing by construction. |
| 12 Rate limits | **Partial** | Auth endpoints limited in middleware; **all public allowlisted** `/api/*` routes get per-IP per-path limiter (`LEAD_OS_PUBLIC_API_RATE_LIMIT`). |
| 13 Performance / dead code | **Process** | Requires production metrics; not automated here. |
| 14 Business rules | **Partial** | `platform-conventions.ts` re-exports tenant + billing; expand over time. |
| 15 CSP | **Deferred** | Nonce-based CSP with Next.js requires coordinated `next.config` + layout changes; still `unsafe-inline` today — see `src/proxy.ts` comments. |
| 16 Backup / restore | **Doc** | `DEPLOYMENT.md` — use managed Postgres PITR / `pg_dump`; verify restores in staging. |
