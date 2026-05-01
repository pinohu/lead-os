# Lead OS Architecture

Lead OS is a Next.js App Router SaaS runtime with API, operator dashboard, pricing worker, MCP tools, and PostgreSQL-backed persistence. The deployable production app is this directory: `lead-os-hosted-runtime-wt-hybrid`.

## Runtime Layers

1. Web/API: `src/app/**` and `src/app/api/**` expose public capture surfaces, authenticated SaaS APIs, operator APIs, billing webhooks, health checks, and MCP-compatible routes.
2. Global policy: `src/middleware.ts` enforces API authentication by default, signed middleware identity headers, single-tenant deployment boundaries, optional billing gates, rate limits, CORS, CSP, and security headers.
3. Auth: `src/lib/auth-system.ts` handles user API keys and sessions. `src/lib/operator-auth.ts` handles operator magic links and operator-only API sessions.
4. Billing: `src/lib/billing.ts`, `src/lib/billing-store.ts`, and `src/lib/billing/*` manage Stripe checkout, portal sessions, webhook idempotency, subscription sync, plan entitlements, usage limits, and API tier gates.
5. Data: `src/lib/db.ts` provides PostgreSQL pooling and migration startup. SQL migrations live in `db/migrations`.
6. Lead/GTM/revenue: `src/lib/intake.ts`, `src/lib/runtime-store.ts`, `src/lib/revenue-engine.ts`, `src/lib/revenue-pipeline.ts`, `src/lib/attribution.ts`, and `src/lib/gtm/*` capture, score, route, monetize, and report on leads.
7. Queue/worker: `src/lib/pricing/queue-client.ts`, `src/lib/pricing/bootstrap.ts`, and `src/runtime/worker-entry.ts` run BullMQ pricing jobs, retries, DLQ persistence, and replay.
8. Operator control plane: `src/app/dashboard/control-plane`, `src/app/api/operator/*`, `src/lib/operator-control-plane.ts`, and `src/lib/operator-actions.ts` expose health, queue, DLQ, pricing, and audit controls.
9. Agent/MCP: `src/lib/agent-orchestrator.ts`, `src/lib/paperclip-orchestrator.ts`, `src/mcp/server.ts`, and `src/mcp/tools.ts` expose agent-callable workflows and tools.

## Security Decisions

- API routes require auth unless explicitly allowlisted in `src/middleware.ts`.
- Middleware identity headers are HMAC signed with `LEAD_OS_AUTH_SECRET`.
- Operator APIs now only trust forwarded identity when `x-authenticated-method=operator-cookie` and the middleware HMAC is valid.
- Single-tenant deployments reject authenticated tenant mismatch unless `LEAD_OS_SINGLE_TENANT_ENFORCE=false`.
- Billing enforcement is enabled by `LEAD_OS_BILLING_ENFORCE=true` and checks subscription state plus API tier.

## Data Alignment

Migration `012_production_schema_alignment.sql` aligns JSON-first legacy tables with production query paths:

- Adds typed subscription and usage columns expected by `billing-store.ts`.
- Adds typed lead columns expected by revenue metrics: `tenant_id`, `status`, `score`, `niche`, and `source`.
- Adds tenant/status/score/niche indexes for revenue and dashboard queries.

## Verification

Run from this directory:

```bash
npm audit --omit=dev
npm run verify:migrations
npm test
npm run build
```
