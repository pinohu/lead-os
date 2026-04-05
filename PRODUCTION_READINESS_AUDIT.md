# CX React / Lead OS — Production-Readiness Audit

**Date**: 2026-04-05  
**Auditor**: Performance Engineer + Product Strategist  
**Verdict**: **NOT READY FOR PRODUCTION** — 7 blockers, 12 critical findings, 19 warnings

---

## PART 1 — PERFORMANCE AUDIT

### 1. Critical Rendering Path — Font Loading

| App | File | Font | `display: swap` | Verdict |
|-----|------|------|-----------------|---------|
| lead-os-hosted-runtime-wt-hybrid | `src/app/layout.tsx:13-17` | Inter (Google) | **YES** | OK |
| erie-pro | `src/app/layout.tsx:23` | Inter (Google) | **NO** | **BLOCKER** — FOIT on slow connections |
| neatcircle-beta | `src/app/layout.tsx:11-19` | Geist + Geist_Mono (Google) | **NO** | **BLOCKER** — FOIT on slow connections |
| lead-os-hosted-runtime-wt-public | `src/app/layout.tsx` | No fonts loaded | N/A | OK (no font) |

**Details**:
- `erie-pro/src/app/layout.tsx:23`: `const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })` — missing `display: "swap"`.
- `neatcircle-beta/src/app/layout.tsx:11-19`: Both `Geist` and `Geist_Mono` lack `display: "swap"`, causing Flash of Invisible Text (FOIT).
- Only the kernel runtime (`lead-os-hosted-runtime-wt-hybrid/src/app/layout.tsx:15`) has `display: "swap"`.

---

### 2. JavaScript Bundle — Heavy Client Components

**BLOCKER: `DynastyLandingPage.tsx` — 1,181 lines, `"use client"`, no code splitting**
- File: `lead-os-hosted-runtime-wt-hybrid/src/components/DynastyLandingPage.tsx`
- This is a monolithic 1,181-line client component with `useEffect`, `useRef`, `useState` imports. It renders an entire conversion landing page.
- **No `next/dynamic` or `React.lazy` is used anywhere in the entire monorepo** (0 results). Every `"use client"` component is loaded synchronously.

**Finding: 100+ "use client" pages in the kernel dashboard**
- Every dashboard page (analytics, leads, scoring, billing, agents, etc.) is a full `"use client"` page that fetches data in `useEffect` on mount.
- Files: `lead-os-hosted-runtime-wt-hybrid/src/app/dashboard/*/page.tsx` (approximately 25 pages)
- This prevents server-side rendering of any dashboard content. Initial load is always an empty shell followed by a client-side fetch.

**Finding: neatcircle-beta loads 5 "use client" components in root layout**
- File: `neatcircle-beta/src/app/layout.tsx:4-8` and lines `106-110`
- `BehavioralTracker`, `ExitIntent`, `ChatWidget`, `FunnelOrchestrator`, `WhatsAppOptIn` — all loaded eagerly on every page.
- These are 5 heavyweight components (tracking, chat, funnel orchestration, exit intent detection) bundled into the initial load of every page.

**No heavy library imports found** (no recharts, moment, date-fns, framer-motion, rich-text editors in the 4 main apps).

---

### 3. Image Optimization

| Metric | Count |
|--------|-------|
| `<img>` tags across all 4 apps | **2** (both in `_n8n_sources/`, not main apps) |
| `next/image` (`Image` component) usage | **0** |
| Images on pages | Almost none — apps are text/form-heavy |

**Verdict**: Low risk. The apps rely almost entirely on SVG icons and CSS. No images means no CLS from missing `width`/`height`. However, the complete absence of `next/image` means any future image additions will bypass optimization.

---

### 4. Data Fetching Patterns

**CRITICAL: Every dashboard page is a waterfall**

Pattern found in all 25+ dashboard pages under `lead-os-hosted-runtime-wt-hybrid/src/app/dashboard/`:

```
"use client" → useEffect mount → fetch("/api/dashboard/...") → setState → render
```

Example files:
- `src/app/dashboard/analytics/page.tsx:93-114`
- `src/app/dashboard/leads/page.tsx:104-131`
- `src/app/dashboard/health/page.tsx:147`
- `src/app/dashboard/scoring/page.tsx:89`
- `src/app/dashboard/billing/page.tsx:110`

**Problems**:
1. **No server-side data fetching**: Every page is `"use client"` and fetches in `useEffect`. The server renders an empty loading skeleton, then the client makes a second round-trip to the API.
2. **No prefetching or `<Link prefetch>`**: Navigation between dashboard pages always triggers a fresh fetch.
3. **No parallel fetching**: Pages make a single API call, but the API routes themselves sometimes make sequential calls.

**N+1 query pattern in `runtime-store.ts`**: The `getLeadRecord()` function at line 470 is called per-lead in the intake flow (`intake.ts:331`), then `upsertLeadRecord()` at line 373 writes back. Each lead intake triggers individual reads/writes rather than batch operations.

**Sequential await waterfall in `intake.ts:597-652`**: The intake flow runs `Promise.all` for email/WhatsApp/SMS/alert — good. But the CRM sync (`syncLeadToCrm`, line 453), logging (`logEventsToLedger`, line 454), and workflow trigger (line 465) are **sequential `await`s** before the parallel block. These could all run in parallel.

---

### 5. Caching

**VERDICT: ZERO application-level caching exists**

| Caching Mechanism | Present? | Details |
|-------------------|----------|---------|
| `unstable_cache` / React `cache()` | **NO** | 0 usages across entire monorepo |
| ISR / `revalidate` on pages | **NO** | Only `erie-pro/src/app/api/health/route.ts` has `revalidate = 0` (meaning *no* cache) |
| Redis caching layer | **NO** | Redis references only in `_n8n_sources/` (external), BullMQ in `job-queue.ts` but only for queuing, not caching |
| HTTP Cache-Control headers on API routes | **5 routes** | `lead-os-hosted-runtime-wt-hybrid`: tracking pixel (1y), widget-preview render (1h), realtime stream (no-cache), page render (1h), openapi.json (1h). `erie-pro`: places-photo (1d). **No cache headers on any data API routes.** |
| CDN caching configuration | **NO** | No `vercel.json` with cache rules, no edge middleware caching, no `stale-while-revalidate` headers on data endpoints |

**Impact**: Every API call, every page load, every dashboard refresh hits the database (or in-memory store) directly. The public-facing erie-pro pages (702 pages) are all `force-dynamic` in the dashboard and have no ISR on content pages — every visit queries the DB.

---

### 6. Memory Leaks

**CRITICAL: Unbounded in-memory stores that grow without eviction**

| Store | File | Max Size | Eviction? | Risk |
|-------|------|----------|-----------|------|
| `leadStore` (Map) | `runtime-store.ts:112` | Unlimited growth | Only `clear()` on reset | **HIGH** — grows with every lead |
| `eventStore` (Array) | `runtime-store.ts:113` | 10,000 cap | Splice at cap | Medium |
| `providerExecutionStore` | `runtime-store.ts:114` | 10,000 cap | Splice at cap | Medium |
| `workflowRunStore` | `runtime-store.ts:115` | 10,000 cap | Splice at cap | Medium |
| `bookingJobStore` (Map) | `runtime-store.ts:116` | Unlimited growth | None | **HIGH** |
| `documentJobStore` (Map) | `runtime-store.ts:117` | Unlimited growth | None | **HIGH** |
| `workflowRegistryStore` (Map) | `runtime-store.ts:118` | Unlimited growth | None | Medium |
| `runtimeConfigStore` (Map) | `runtime-store.ts:119` | Unlimited growth | None | Medium |
| `intakeReplayStore` (Map) | `intake.ts:117` | Unlimited growth | None | **HIGH** — grows per unique lead |
| `tenantStore` (Map) | `tenant-store.ts:32` | Unlimited growth | None | Medium |
| `slugIndex` (Map) | `tenant-store.ts:33` | Unlimited growth | None | Medium |
| `rateLimiters` (Map) | `tenant-isolation.ts:49` | Unlimited growth | None | Medium |
| `endpointLimiters` (Map) | `rate-limiter.ts:97` | Bounded by endpoints | None | Low |

**Specific issues**:

1. **`intakeReplayStore` at `intake.ts:117`**: Grows with every unique lead submission key. Never cleaned up. In production with thousands of leads/day, this leaks megabytes per day.

2. **`leadStore` at `runtime-store.ts:112`**: When Postgres is available, records are still cached in the Map. `getLeadRecords()` (line 491-525) calls `leadStore.clear()` then repopulates, but `getLeadRecord()` (line 470-489) only adds, never removes. Over time, this grows to hold every lead ever queried.

3. **Rate limiter at `rate-limiter.ts:18-26`**: Uses `setInterval` with `unref()` for cleanup — good. But the `erie-pro/src/lib/rate-limit.ts:102-109` has a bare `setInterval` without `unref()` — **this prevents graceful process shutdown**.

4. **`RealtimeProvider` at `src/components/RealtimeProvider.tsx:44-131`**: EventSource reconnect logic uses recursive `setTimeout` + `connect()`. If the component unmounts during a reconnect timeout, the `setTimeout` callback can fire and create a new EventSource on an unmounted component. The cleanup (line 125-130) only closes the current ref but doesn't clear pending reconnect timeouts.

---

### 7. Database Query Performance

**Adequate index coverage for existing queries.** The migration `001_initial_schema.sql` creates indexes on:
- `lead_os_events(lead_key, timestamp DESC)` and `(event_type)`
- `lead_os_provider_executions(lead_key, created_at DESC)` and `(provider)`
- `lead_os_workflow_runs(lead_key, created_at DESC)` and `(event_name)`
- `lead_os_booking_jobs(lead_key)` and `lead_os_document_jobs(lead_key)`
- `lead_os_lead_scores(lead_key, created_at DESC)`, `(score_type)`, `(score DESC)`
- Tenant indexes from `002_multi_tenant.sql` on `tenant_id` columns

**Missing indexes**:
1. **`lead_os_leads` has no index on `(tenant_id, updated_at DESC)`** — the most common query pattern (`SELECT payload FROM lead_os_leads ORDER BY updated_at DESC`) will do a sequential scan on large tables.
2. **`lead_os_leads` has no index on email or phone** — deduplication lookups use `lead_key` (good), but searching by email/phone requires a full scan.
3. **`lead_os_events` JSONB payload queries**: Some API routes filter events by `payload->>'tenantId'` but there's no GIN index on the JSONB column.
4. **`lead_os_tenants` filtering by `payload->>'status'` and `payload->>'revenueModel'`** at `tenant-store.ts:253-258` uses a functional index on `(payload->>'status')` — present and correct.

**Schema design concern**: All tables store the entire record in a `payload JSONB` column with minimal typed columns. This means:
- No type safety at the DB level
- Queries like `WHERE payload->>'tenantId' = $1` cannot use B-tree indexes efficiently without functional indexes
- No foreign key constraints between `lead_os_leads` and any other table (except `lead_os_lead_scores`)

---

## PART 2 — PRODUCT / VALUE AUDIT

### 8. README Promises vs. Reality

The README claims (exact quotes with verification):

| Claim | Actual Status |
|-------|---------------|
| "499 API endpoints" | **Plausible** — `src/app/api/` has deep nesting; count not independently verified |
| "4,187 test cases, 100% pass rate" | **Not verifiable** — `tests/` directory exists but `npm test` was not run |
| "137 provider integrations" | **Aspirational** — providers exist as adapter files, but every one operates in "dry-run mode" when API keys aren't configured. Most are stub wrappers around `fetch` calls. |
| "Multi-tenant infrastructure with RLS policies" | **NOT IMPLEMENTED** — see Section 12 |
| "Parameterized SQL everywhere" | **TRUE** — all SQL uses `$1, $2` parameterization |
| "Rate limiting on all public endpoints" | **Partially true** — `rate-limiter.ts` has endpoint-specific limits for 7 endpoints; other endpoints have no rate limiting |
| "BullMQ queue" | **Present but optional** — `job-queue.ts` has a Redis/BullMQ integration that falls back to in-memory |
| "PostgreSQL (via pg)" | **TRUE** — with in-memory fallback |
| "Idempotent deduplication via lead keys" | **TRUE** — `intake.ts:117-119` implements replay detection |

---

### 9. Core User Journeys — Traced Through Code

#### A. Lead Intake: Form Submission → Storage → Notification

**Full path traced**:
1. Client submits to `POST /api/intake` → `lead-os-hosted-runtime-wt-hybrid/src/app/api/intake/route.ts`
2. Rate limiting checked (`rate-limiter.ts:11`)
3. Payload validated via Zod (`canonical-schema.ts`)
4. Plan limits enforced (`plan-enforcer.ts`)
5. Ingress channel enrichment (dynamically imported `ingress-engine.ts`)
6. `persistLead()` → `processLeadIntake()` in `intake.ts:317-891`
7. Inside `processLeadIntake()`:
   - Lead scored locally (`computeLeadScore`, line 136-148)
   - Stage resolved (line 150-161)
   - Lead upserted to store (line 373-401)
   - Events appended (line 438)
   - CRM sync attempted (line 453) — **sequential await**
   - Event logging attempted (line 454) — **sequential await**
   - Workflow trigger emitted (line 465) — **sequential await**
   - Additional workflow triggers in parallel (line 581)
   - Email/WhatsApp/SMS/Alert in parallel (line 597-652)
   - Booking job created if applicable (line 688)
   - Document jobs created (line 707)
   - All provider executions recorded (line 755-860)
   - Usage incremented (line 862-863)

**Verdict**: **Functional but slow.** A single lead intake triggers 10-20+ async operations, many sequential. In production with live integrations, a single `POST /api/intake` could take 5-15 seconds.

#### B. Dashboard: Login → Viewing Leads/Analytics

**Path**:
1. Login via `/auth/sign-in` — magic link flow (checks `LEAD_OS_OPERATOR_EMAILS` env var)
2. Dashboard at `/dashboard` renders `DashboardSidebar.tsx` (client component, 264+ lines)
3. Each sub-page (e.g., `/dashboard/leads`) is `"use client"`, fetches data in `useEffect`
4. API route returns data from `runtime-store.ts` (in-memory or Postgres)
5. If no data exists, **hardcoded `DEMO_DATA` constants are rendered** (every dashboard page has a fallback)

**Verdict**: The dashboard is a demo shell. Every page renders mock data when the API returns empty or errors.

#### C. Lead Scoring

**Path**:
1. `scoring-engine.ts` implements a full 4-dimensional scoring engine (intent, fit, engagement, urgency)
2. Scores are computed at intake time via `computeLeadScore()` in `intake.ts:136-148` — a **simplified version** that only uses source + phone + booking signals
3. The full `scoring-engine.ts` with weighted factors, recency multipliers, and keyword matching is **never called from the intake flow**
4. The full engine can be called via `/api/scoring` endpoints

**Verdict**: **Two scoring systems that don't talk to each other.** The intake uses a simple heuristic (line 136-148) while `scoring-engine.ts` (358 lines) implements a sophisticated system that's only accessible via manual API calls, not the automated intake pipeline.

#### D. Automation: What Actually Runs Automatically?

1. **Follow-up emails/SMS/WhatsApp**: Sent immediately during intake if provider keys are configured. Otherwise dry-run.
2. **n8n/Activepieces workflows**: Events emitted to webhook URLs if configured. The workflow logic itself lives in external systems.
3. **Cron jobs**: Referenced in docs but no `src/app/api/cron/` routes exist in the kernel runtime. The `welcome-sequence.ts` has a `/api/welcome-sequence/due` route but no scheduler calls it.
4. **Nurture sequences**: `markNurtureStageSent()` marks stages in `runtime-store.ts`, but there's no background job that advances leads through nurture stages. It's fire-once at intake.

**Verdict**: **No automation loop exists.** The system fires actions at intake time but has no background scheduler, no retry logic, no nurture progression engine. The "7-stage nurture sequence" from the README does not exist as running code.

---

### 10. Feature Completeness

| Claimed Feature | Implementation Status | Evidence |
|----------------|----------------------|----------|
| Lead Capture (multi-source) | **Real** | `intake.ts` handles 8 source types |
| Lead Scoring (4-dimensional) | **Partially real** | Full engine exists but isn't wired into intake |
| Lead Nurturing (7-stage) | **Stub** | `markNurtureStageSent("day-0")` at line 656 is the only stage ever sent |
| AI Content Generation | **Stub/Dry-run** | `ai-client.ts` exists but requires external API keys |
| AI Agent System | **Real framework, no execution** | Agent orchestrator exists, scheduler referenced, but no running agents |
| Funnel System (98 node types) | **Config-only** | `funnel-blueprints` is a library of JSON configs; no runtime execution engine |
| Marketplace | **UI + stub backend** | Dashboard page exists, API routes exist, marketplace pricing logic exists |
| Billing (Stripe) | **Real integration** | Stripe checkout, portal, webhooks all implemented |
| Multi-tenant (RLS) | **NOT IMPLEMENTED** | See Section 12 |
| Niche Configuration | **Real** | Config-driven, 46 niches in erie-pro |
| Operator Dashboard (31 pages) | **Real UI, demo data** | All 31 pages render, all fall back to hardcoded demo data |
| 137 Provider Integrations | **Adapter stubs** | Files exist, all return dry-run responses without keys |
| A/B Experiment Engine | **Schema + UI, no runner** | DB tables, dashboard page, but no experiment assignment in page rendering |
| GDPR Compliance | **Partial** | `/manage-data` page exists, deletion request API exists |

---

### 11. Data Integrity — What Would Break?

If this system handled real customer leads:

1. **In-memory fallback loses all data on restart**: Without `DATABASE_URL`, all leads, events, and provider executions are stored in JavaScript `Map`/`Array` objects. A Vercel cold start or deploy wipes everything.
   - File: `runtime-store.ts:112-119`, `runtimeMode()` at line 294

2. **Dual-write inconsistency**: Every write goes to both the in-memory store AND Postgres (when available). If Postgres write fails after the in-memory write succeeds, the states diverge.
   - File: `runtime-store.ts:441-468` (`upsertLeadRecord`)

3. **No transaction boundary around intake**: `processLeadIntake()` in `intake.ts:317-891` performs 20+ operations with no transaction. If the process crashes after `upsertLeadRecord()` (line 373) but before `appendEvents()` (line 438), the lead exists without its event history.

4. **Lead key collision potential**: `buildLeadKey()` creates keys from email/phone. Two leads with the same email get the same key and the second submission overwrites the first via `ON CONFLICT DO UPDATE`.
   - File: `runtime-store.ts:456-465`

5. **`intakeReplayStore` is per-process**: Deduplication via `intakeReplayStore` (Map) is process-local. In a multi-instance deployment (Vercel serverless), the same lead can be processed simultaneously on different instances.
   - File: `intake.ts:117`

6. **No data validation on JSONB payloads**: All core tables store records as opaque `JSONB`. A malformed payload write corrupts the record permanently with no schema enforcement at the DB level.

---

### 12. Multi-Tenancy — Aspirational, Not Real

**BLOCKER: Tenant isolation is not enforced at the database level.**

Evidence:

1. **RLS policies are generated but never applied**: `tenant-isolation.ts:99-135` has `generateRLSPolicy()` and `generateRLSSetupSQL()` which produce SQL strings. These functions are **never called** during migrations, provisioning, or startup. The SQL is a string that gets returned but never executed.

2. **`SET LOCAL app.current_tenant_id` is never called**: The RLS policies reference `current_setting('app.current_tenant_id')`, but no query in the codebase ever calls `SET LOCAL app.current_tenant_id = ?`. The setting is referenced only in the SQL template at `tenant-isolation.ts:110-111,121,125`.

3. **Core queries have no tenant_id WHERE clause**: The most-used functions in `runtime-store.ts` query without tenant filtering:
   - `getLeadRecord(leadKey)` at line 480-489: `WHERE lead_key = $1` — no tenant_id
   - `getLeadRecords()` at line 515-524: `ORDER BY updated_at DESC LIMIT $1` — **returns all tenants' leads**
   - `getCanonicalEvents()` at line 575-584: `ORDER BY timestamp DESC` — **returns all tenants' events**
   - `getProviderExecutions()` at line 654-665: No tenant filter
   - `getWorkflowRuns()` at line 725-736: No tenant filter
   - `getBookingJobs()` at line 800-812: No tenant filter

4. **Migration adds `tenant_id` column but code never uses it**: `002_multi_tenant.sql` adds `tenant_id TEXT DEFAULT 'default-tenant'` to all tables and creates indexes. But `runtime-store.ts` never includes `tenant_id` in INSERT or SELECT statements. The column exists but is always `'default-tenant'`.

5. **Tenant resolution works but isn't enforced**: `tenant-context.ts` correctly resolves tenant from headers/subdomain/params. But the resolved `tenantConfig.tenantId` is stored in the lead record's JSONB `payload` field — not in the `tenant_id` column, and not used as a query filter.

**Impact**: In a multi-tenant deployment, **Tenant A can see Tenant B's leads, events, and all data** by querying the dashboard. This is a P0 data privacy violation.

---

## SUMMARY — Release Gate Decision

### Blockers (must fix before any production traffic)

| # | Finding | File(s) | Severity |
|---|---------|---------|----------|
| B1 | Multi-tenancy not enforced — cross-tenant data leakage | `runtime-store.ts`, `tenant-isolation.ts` | **P0** |
| B2 | In-memory stores leak indefinitely | `runtime-store.ts:112-119`, `intake.ts:117` | **P0** |
| B3 | No transaction boundary around lead intake | `intake.ts:317-891` | **P1** |
| B4 | Zero application-level caching | Entire codebase | **P1** |
| B5 | All dashboard pages are client-only with demo data fallback | `src/app/dashboard/*/page.tsx` | **P1** |
| B6 | Erie-pro missing `font-display: swap` | `erie-pro/src/app/layout.tsx:23` | **P2** |
| B7 | Neatcircle missing `font-display: swap` on both fonts | `neatcircle-beta/src/app/layout.tsx:11-19` | **P2** |

### Critical Findings (high-risk but not blocking)

| # | Finding | File(s) |
|---|---------|---------|
| C1 | Intake flow has sequential awaits that should be parallel | `intake.ts:453-465` |
| C2 | Full scoring engine never called during intake | `scoring-engine.ts` vs `intake.ts:136-148` |
| C3 | No nurture progression engine — only day-0 fires | `intake.ts:656` |
| C4 | No cron/background scheduler exists | Missing `api/cron/` routes |
| C5 | `intakeReplayStore` dedup is per-process, fails in serverless | `intake.ts:117` |
| C6 | RealtimeProvider reconnect timeout not cleaned on unmount | `RealtimeProvider.tsx:116-118` |
| C7 | 5 heavyweight client components loaded eagerly on every neatcircle page | `neatcircle-beta/src/app/layout.tsx:106-110` |
| C8 | DynastyLandingPage is 1,181-line monolithic client component | `DynastyLandingPage.tsx` |
| C9 | No `next/dynamic` or `React.lazy` used anywhere | Entire monorepo |
| C10 | Erie-pro rate limiter `setInterval` has no `unref()` | `erie-pro/src/lib/rate-limit.ts:103` |
| C11 | `lead_os_leads` missing composite index on `(tenant_id, updated_at DESC)` | `001_initial_schema.sql` |
| C12 | Dual-write to in-memory + Postgres can diverge | `runtime-store.ts:441-468` |

### Warnings

| # | Finding |
|---|---------|
| W1 | All 137 integrations are dry-run stubs without API keys |
| W2 | Schema stores everything in JSONB — no DB-level type safety |
| W3 | `next/image` never used — no image optimization pipeline |
| W4 | Every erie-pro dashboard/admin page is `force-dynamic` with no ISR |
| W5 | No error boundaries beyond root `error.tsx` in dashboard |
| W6 | `tenantStore`/`slugIndex` Maps grow without eviction |
| W7 | A/B experiment engine has schema but no runtime assignment |
| W8 | AI agent system exists as framework but nothing auto-executes |
| W9 | `lead_key` collision by design — same email = same lead, overwritten |
| W10 | No health check for DB connection pool exhaustion |
| W11 | `aitable` persistence mode pages through all records with no server-side filtering |
| W12 | Marketplace pricing exists but no payment processing for lead purchases |
| W13 | `LEAD_OS_ALLOW_RESET=true` enables `TRUNCATE` on all tables via API |
| W14 | Embedded secrets file has empty string defaults (safe but misleading) |
| W15 | No Content Security Policy header defined |
| W16 | `new Date().getFullYear()` in root layout SSR means footer year is baked at build |
| W17 | Chat widget in neatcircle-beta uses local `generateResponse()` — no AI backend |
| W18 | Funnel orchestrator uses `localStorage` directly — SSR-incompatible without guards |
| W19 | No monitoring, alerting, or observability instrumentation |
