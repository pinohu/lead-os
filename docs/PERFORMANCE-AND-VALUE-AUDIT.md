# Lead OS — Performance Engineering & Product/Value Audit

**Date:** 2026-04-05
**Scope:** All four packages — kernel runtime, erie-pro, neatcircle-beta, lead-os-hosted-runtime-wt-public
**Method:** Static analysis of source code, configuration files, query patterns, and architectural patterns

---

## Part 1: Performance Engineering Audit

### 1.1 Next.js Configuration Analysis

#### lead-os-hosted-runtime-wt-hybrid/next.config.mjs
- **Output mode:** `standalone` — **GOOD.** Correct for Docker/serverless.
- **Image optimization:** **MISSING.** No `images` config at all. No `formats`, no `remotePatterns`, no `deviceSizes`. Every `<Image>` component serves default unoptimized formats.
- **Compression:** Not explicitly set. Defaults to gzip but no Brotli.
- **Security headers:** Present and correct (HSTS, X-Frame-Options, CSP, Referrer-Policy).
- **Missing:** No `experimental.optimizePackageImports`, no `transpilePackages`.

| Setting | Status | Impact |
|---------|--------|--------|
| `output: "standalone"` | ✅ Present | Correct for production |
| `images.formats` | ❌ Missing | No AVIF/WebP optimization |
| `images.remotePatterns` | ❌ Missing | External images unoptimized |
| `compress` | ❌ Missing | Default gzip only |
| `poweredByHeader: false` | ✅ Present | Good security practice |

#### erie-pro/next.config.ts
- **Output mode:** Default (not standalone) — acceptable for Vercel.
- **Image optimization:** ✅ `formats: ["image/avif", "image/webp"]` — **GOOD.**
- **Compression:** `compress: true` — explicit, good.
- **Caching headers:** ✅ Static assets cached 1 year, SSG pages use `stale-while-revalidate`. **Best config in the monorepo.**
- **CSP:** Full Content-Security-Policy header with Stripe, PostHog, Sentry domains. **GOOD.**

#### neatcircle-beta/next.config.ts
- **Output mode:** Default.
- **Image optimization:** ❌ Missing entirely.
- **Compression:** ❌ Not set.
- **Caching:** ❌ No cache headers beyond security headers.
- **Minimal config** — security headers only. Bare-bones.

#### lead-os-hosted-runtime-wt-public/next.config.mjs
- Identical minimal config to the kernel, minus `standalone` output. No image optimization.

**Verdict:** Only erie-pro has proper image optimization and caching headers. The kernel runtime — the most complex app with 60 pages — has **zero image optimization config**.

---

### 1.2 Dynamic Imports, React.lazy, and Suspense

**Findings: Almost entirely absent across all packages.**

| Package | dynamic() calls | React.lazy | Suspense boundaries | Pages |
|---------|----------------|------------|---------------------|-------|
| kernel runtime | 0 | 0 | 2 (`preferences`, `manage-data`) | 60 |
| erie-pro | 0 | 0 | 0 | 61 |
| neatcircle-beta | 0 | 0 | 0 | 18 |

**Critical concern:** The kernel runtime has 27 client-side pages (with `"use client"`), many of which are 400-1,000+ lines (marketplace: 1,073 lines, onboard: 839, prospects: 832, competitors: 512). These are **monolithic client bundles** with zero code splitting.

**Specific offenders:**
- `src/app/marketplace/page.tsx` (1,073 lines, client component) — entire marketplace UI ships in one chunk
- `src/app/onboard/page.tsx` (839 lines, client component) — entire onboarding wizard
- `src/app/dashboard/prospects/page.tsx` (832 lines, client component)
- `src/app/dashboard/leads/page.tsx` (487 lines, client component)
- `src/app/dashboard/competitors/page.tsx` (512 lines, client component)

**Impact:** First-load JS bundle for any dashboard page includes the **full page component** even when the user only sees the initial above-the-fold content.

#### Revalidation

Only **1 file** in the entire kernel runtime references `revalidate`:
- `src/app/api/tracking/pixel/route.ts` — sets cache headers for pixel tracking

**Zero** pages use `export const revalidate = N` or `revalidatePath`/`revalidateTag`. All server-rendered pages are either fully dynamic (no caching) or client-side rendered (SPA-style fetch on mount).

---

### 1.3 Database Query Analysis

#### Full Table Scans (Missing WHERE Clauses)

| File | Query | Risk |
|------|-------|------|
| `runtime-store.ts:661` | `SELECT payload FROM lead_os_provider_executions ORDER BY created_at DESC` | **No WHERE, no LIMIT** — returns ALL rows |
| `runtime-store.ts:732` | `SELECT payload FROM lead_os_workflow_runs ORDER BY created_at DESC` | **No WHERE, no LIMIT** |
| `runtime-store.ts:808` | `SELECT payload FROM lead_os_booking_jobs ORDER BY updated_at DESC` | **No WHERE, no LIMIT** |
| `runtime-store.ts:884` | `SELECT payload FROM lead_os_document_jobs ORDER BY updated_at DESC` | **No WHERE, no LIMIT** |
| `runtime-store.ts:1013` | `SELECT payload FROM lead_os_workflow_registry ORDER BY updated_at DESC` | **No WHERE, no LIMIT** |
| `runtime-store.ts:1069` | `SELECT payload FROM lead_os_runtime_config ORDER BY updated_at DESC` | **No WHERE, no LIMIT** |
| `auth-system.ts:678` | `SELECT * FROM lead_os_invites WHERE tenant_id = $1 ORDER BY created_at DESC` | WHERE present but **no LIMIT** |
| `design-spec-store.ts:192` | `SELECT * FROM lead_os_design_specs WHERE tenant_id = $1 ORDER BY version DESC` | **No LIMIT** |
| `email-sender.ts:155` | `SELECT ... FROM lead_os_email_suppressions WHERE tenant_id = $1 ORDER BY created_at DESC` | **No LIMIT** |
| `marketing-artifact-store.ts:126` | `SELECT payload FROM lead_os_marketing_artifacts WHERE tenant_id = $1 ORDER BY created_at DESC` | **No LIMIT** |
| `niche-benchmarking.ts:516` | `SELECT DISTINCT niche FROM lead_os_tenant_snapshots ORDER BY niche` | **No LIMIT** |
| `data-pipeline.ts:181` | `SELECT ... FROM lead_os_leads WHERE ${where} ORDER BY created_at DESC` | **No LIMIT** |

The `runtime-store.ts` file is the backbone of data access. When `getProviderExecutions()`, `getWorkflowRuns()`, `getBookingJobs()`, or `getDocumentJobs()` are called without a `leadKey` filter, they execute unbounded `SELECT` queries against PostgreSQL. These functions are called from the **dashboard home page** (`src/app/dashboard/page.tsx:20-26`) in a `Promise.all` — meaning the dashboard page triggers **5 unbounded queries simultaneously on every load**.

#### erie-pro: Unbounded findMany()

| File | Query | Risk |
|------|-------|------|
| `erie-pro/src/lib/provider-store.ts:129` | `prisma.provider.findMany()` | Returns ALL providers, no pagination |
| `erie-pro/src/lib/lead-routing.ts:498` | `prisma.provider.findMany()` | Returns ALL providers for routing |

#### Queries in Loops

- `webhook-registry.ts:386-401` — iterates over `deliveries` array and executes an `UPDATE` query per delivery inside the loop. Should be a batch `UPDATE ... WHERE id IN (...)`.

---

### 1.4 Memory Leak Analysis

#### Module-Level Maps That Grow Unboundedly

| File | Map(s) | Has Size Limit? | Has Cleanup? |
|------|--------|-----------------|--------------|
| `trust-engine.ts` | `reviewStore`, `certificationStore`, `tenantMeta` (3 Maps) | ❌ No | Only via `reset()` test helper |
| `proactive-alerts.ts` | `alertStore` (1 Map) | ❌ No | ❌ No cleanup at all |
| `offer-competition.ts` | `variantStore`, `testStore`, `visitorLog`, `refundLog`, `complaintLog` (5 Maps) | ❌ No | Only via `reset()` test helper |
| `moat-exploitation.ts` | `deploymentStore`, `tenantMoatStore` (2 Maps) | Arrays capped at 10K | Maps unbounded |
| `joy-engine.ts` | `milestoneStore` (1 Map, values are arrays) | ❌ No limit per tenant | ❌ No eviction |
| `autonomous-recovery.ts` | `recoveryStore` (1 Map, values are arrays) | ❌ No limit per tenant | ❌ No eviction |
| `data-moat.ts` | `patternStore`, `conversionPathStore` (2 Maps) | ❌ No | Only via `reset()` test helper |
| `runtime-store.ts` | `leadStore`, `bookingJobStore`, `documentJobStore`, `workflowRegistryStore`, `runtimeConfigStore` (5 Maps) | Some arrays capped at `MAX_STORE_SIZE` (10K), **Maps uncapped** | Partial |

**Total: ~20 module-level Maps with no automatic eviction.** In a long-running Node.js process (production), these grow monotonically. The `joy-engine.ts` and `autonomous-recovery.ts` Maps are especially dangerous because they store **arrays** per tenant key — each tenant's array grows without limit.

**Mitigating factor:** The `lru-cache.ts` exists and is well-implemented (bounded, TTL-aware), but it's **not used by any of these stores**. The LRU cache is only referenced in `niche-adapter.ts` and a few adapter files.

#### Intervals and Timeouts

- `rate-limiter.ts:18-26` — `setInterval` with `.unref()`. **Acceptable.** The cleanup interval correctly uses `unref()` so it won't prevent process exit, and it prunes expired entries.
- `integrations/job-queue.ts` — Uses `setInterval` for job polling. Has `.unref()`.
- `integrations/search-engine.ts` — Uses `setTimeout` for debouncing. Short-lived, no leak.
- Client components use `setInterval` for polling (radar, experiments, agents pages) — these are in `useEffect` with cleanup returns. **Acceptable.**

#### Event Listeners

- `components/RealtimeProvider.tsx` — `EventSource` listener with cleanup in `useEffect` return. **OK.**
- `hooks/use-mobile.ts` — `addEventListener` with cleanup. **OK.**
- `components/DynastyLandingPage.tsx` — `addEventListener` with cleanup. **OK.**
- `lib/auto-deploy.ts` — `addEventListener` on process events. No cleanup but acceptable for process-level listeners.

**Verdict:** Event listener cleanup is **adequate**. The major leak risk is the ~20 unbounded Maps.

---

### 1.5 API Response Sizes and Pagination

#### Endpoints Returning Unbounded Data

| Endpoint | Returns | Paginated? |
|----------|---------|------------|
| `GET /api/tenants` | All tenants | ❌ No. Returns full array with `meta.count`. |
| `GET /api/experiments` | All experiments from in-memory Map | ❌ No. |
| `GET /api/prospects` | All matching prospects | `limit` param exists but **not enforced as default** — can return everything. |
| `GET /api/dashboard` | All leads + events + booking jobs + document jobs + workflow runs | ❌ No. Server component loads ALL records. |
| `GET /api/marketplace/leads` | Paginated via `marketplace-store.ts` | ✅ Yes — uses LIMIT/OFFSET in SQL. |
| `GET /api/dashboard/leads` | Lead list | ✅ Yes — client sends `page`/`pageSize` params. |

**The dashboard home page is the worst offender.** It calls `getLeadRecords()`, `getCanonicalEvents()`, `getBookingJobs()`, `getDocumentJobs()`, and `getWorkflowRuns()` without limits. For a production instance with thousands of leads, this loads **the entire dataset into server memory on every page load**.

#### Response Size Concerns

Many API routes return full object payloads including nested `metadata` and `payload` JSONB fields. No response compression beyond Next.js defaults. No field selection/projection at the API level.

---

### 1.6 Caching Strategy

#### What Exists

| Component | Caching | Location |
|-----------|---------|----------|
| LRU Cache | Generic, well-built | `src/lib/lru-cache.ts` — 10K entries, optional TTL |
| Rate limiter store | In-memory with periodic cleanup | `src/lib/rate-limiter.ts` |
| AITable cache | Time-based (fetched once, reused) | `runtime-store.ts:122` |
| erie-pro static assets | `Cache-Control: max-age=31536000, immutable` | `next.config.ts` headers |
| erie-pro SSG pages | `s-maxage=86400, stale-while-revalidate=3600` | `next.config.ts` headers |

#### What's Missing

| Gap | Impact |
|-----|--------|
| No HTTP cache headers on kernel runtime API responses | Every API call hits the server fresh |
| No `Cache-Control` on static pages in kernel | Pages re-render every request |
| No `revalidate` on any server components | All server components render dynamically |
| No Redis/external caching layer | All caching is in-process memory — lost on deploy |
| LRU cache is available but unused by most stores | Opportunity cost: scoring, niche config lookups could be cached |
| No CDN-level caching config | All requests hit origin |
| No `stale-while-revalidate` on API responses | Users always wait for fresh data |

**Verdict:** Caching is essentially **non-existent** in the kernel runtime. Erie-pro has static asset caching (good). The kernel runtime serves every request fresh from database/memory.

---

## Part 2: Product/Value Audit

### 2.1 What the Product Claims to Be

Per README.md and LEAD-OS-COMPLETE-GUIDE.md, Lead OS claims to be:

1. A **multi-tenant lead generation platform** replacing 15-20 SaaS tools
2. **210,000+ lines of code**, 499 API endpoints, 60+ UI pages
3. **137 provider integrations** with dry-run fallback
4. **4 revenue models** in one codebase
5. **AI-powered** content generation, scoring, and chat
6. **Embeddable widgets** for any website
7. Complete **onboarding wizard** and **setup wizard**
8. **Marketplace** for buying/selling leads
9. 4,187 passing test cases
10. Production-deployed at 3 URLs

### 2.2 Does the Code Deliver on the Promise?

#### What's Real and Working

| Claim | Evidence | Verdict |
|-------|----------|---------|
| Multi-tenant architecture | `tenant-store.ts`, `tenant-context.ts`, `tenant-isolation.ts`, middleware-based tenant resolution | ✅ **Real.** Tenant isolation is properly implemented with RLS policies, scoped queries, and header-based resolution. |
| 499 API endpoints | 56 top-level route files + nested routes | ✅ **Plausible.** Route count is high and each file often handles GET/POST/PATCH/DELETE. |
| 60 UI pages | 60 `page.tsx` files in kernel, 61 in erie-pro, 18 in neatcircle | ✅ **Real.** Pages exist and render. |
| Lead intake & scoring | `intake.ts` (895 lines), `scoring-engine.ts` | ✅ **Real.** Full normalization, deduplication, 4D scoring. |
| Niche generator | `niche-generator.ts`, `niche-templates.ts` (1,905 lines) | ✅ **Real.** 13 industry templates with deep domain knowledge. |
| Funnel library | `funnel-library.ts` — 98 node types | ✅ **Real definition.** But funnel execution is rule-based configuration, not a visual flow engine. |
| Authentication | `auth-system.ts`, `operator-auth.ts`, middleware | ✅ **Real.** API keys, sessions, magic links, 2FA. |
| GDPR compliance | `gdpr.ts` — export, deletion, consent | ✅ **Real.** Endpoints exist and work. |
| Stripe billing | `billing.ts`, `billing-store.ts`, `plan-catalog.ts` | ✅ **Real.** Checkout, portal, webhooks, usage tracking. |
| Onboarding wizard | `src/app/onboard/page.tsx` (839 lines, 7-step wizard) | ✅ **Real.** Complete multi-step wizard with plan selection, branding, and provisioning. |
| Setup wizard | `src/app/setup/page.tsx` + `SetupWizardClient.tsx` | ✅ **Real.** Environment checks, niche selection, branding config. |
| Erie-Pro territory platform | Full Next.js app with 46 niches, dynamic routes | ✅ **Real.** Prisma-backed, with lead routing, provider management, billing. |

#### What's Partially Implemented or Overstated

| Claim | Reality | Verdict |
|-------|---------|---------|
| **137 provider integrations** | 62 adapter files exist in `src/lib/integrations/`. Most return hardcoded mock data in dry-run mode. Real API calls are behind env-var gates. | ⚠️ **Overstated.** ~62 adapters exist. Many are thin wrappers that return mock data structures. The "137" count likely includes sub-features within adapters, but actual distinct service integrations are ~62. |
| **AI content generation** | `social-asset-engine.ts`, `ai-client.ts`, `langchain-adapter.ts` | ⚠️ **Structure exists, execution depends on API keys.** Without `AI_API_KEY`, all AI features return template/mock content. The AI client does real calls when configured. |
| **234 lib modules** | `find src/lib -name "*.ts" | wc -l` = 165 files | ⚠️ **Overstated.** 165 lib files, not 234. |
| **Marketplace** | `marketplace.ts`, `marketplace-store.ts`, full UI in `src/app/marketplace/page.tsx` | ⚠️ **UI works but falls back to demo data.** The marketplace page (1,073 lines) has hardcoded `DEMO_LEADS` and loads them when the API fails. Real marketplace depends on leads being published via API. |
| **A/B experiment engine** | `experiment-engine.ts`, `experiment-evaluator.ts`, `experiment-store.ts` | ⚠️ **In-memory only.** `experimentStore` is a `Map<string, Experiment>` with no database persistence. Experiments are lost on server restart. |
| **4,187 test cases** | Tests exist in `/tests/` directory | ⚠️ **Could not independently verify.** Test files exist, but the claim of 4,187 cases with 100% pass rate was not verified in this audit. |
| **Embeddable widgets** | `/api/embed/manifest` and `/api/widgets/boot` routes exist | ⚠️ **Routes exist but widget rendering is minimal.** No standalone widget JS bundle was found. The embed system serves config JSON, not a self-contained widget. |

#### What's Missing or Incomplete

| Feature | Status | Details |
|---------|--------|---------|
| **Visual funnel builder** | ❌ Missing | 98 funnel node types are defined as data structures in `funnel-library.ts`, but there is no visual drag-and-drop builder. The dashboard funnel pages display pre-configured sequences. |
| **Real-time dashboard (SSE)** | ⚠️ Half-built | `src/lib/realtime.ts` and `/api/realtime/stream/route.ts` exist. `RealtimeProvider.tsx` exists. But the SSE stream is a basic stub — the radar page uses `setInterval` polling instead. |
| **WhatsApp/SMS/Voice actual sending** | ⚠️ Dry-run only | Without API keys, all communication is logged but never sent. This is by design, but means a fresh install has zero communication capability. |
| **Landing page builder** | ⚠️ Configuration only | `landing-page-generator.ts` (826 lines) generates page configs. `grapesjs` adapter exists. But there's no in-app visual page editor — just API routes that return HTML templates. |
| **Cross-tenant data learning** | ⚠️ Conceptual | `data-moat.ts` and `adaptive-loop.ts` have the architecture but rely on in-memory stores that reset on deploy. No actual cross-tenant ML pipeline. |
| **Prospect discovery** | ⚠️ Depends on Firecrawl | `discovery-scout.ts`, `prospect-pipeline.ts` are well-structured but depend entirely on Firecrawl API for web scraping. Without `FIRECRAWL_API_KEY`, returns mock businesses. |
| **Content memory/deduplication** | ⚠️ In-memory only | `social-content-memory.ts` uses in-memory hash maps. Lost on restart. |
| **Agent orchestrator** | ⚠️ Structure only | `agent-orchestrator.ts` (982 lines) defines agent teams and workflows but actual agent execution calls AI APIs. Without keys, it returns mock results. |

### 2.3 Half-Implemented Features

| Feature | File(s) | What's Done | What's Missing |
|---------|---------|-------------|----------------|
| **SSO** | `src/lib/sso.ts` | SAML/OIDC config structures | No actual SSO flow in auth routes |
| **Workflow versioning** | `src/lib/workflow-versioning.ts` | CRUD for workflow versions | No UI, no diffing, no rollback UI |
| **Widget preview** | `src/lib/widget-preview.ts` | Preview generation function | No preview UI in dashboard |
| **Design spec store** | `src/lib/design-spec-store.ts` | Full CRUD | Partial dashboard integration |
| **Content copilot** | `src/lib/content-copilot.ts` | AI content suggestions | No UI surface |
| **Dynamic intelligence** | `src/lib/dynamic-intelligence.ts` | Intelligence gathering | API route exists, no dashboard page |
| **Strategy engine** | `src/lib/strategy-engine.ts` | Strategy computation | No UI surface |
| **Channel domination** | `src/lib/channel-domination.ts` | Channel ranking | No UI surface |

### 2.4 Features in Code Without UI

The following lib modules have API routes but **no corresponding dashboard page or UI**:

1. `content-copilot.ts` — AI content assistant with no UI
2. `dynamic-intelligence.ts` — intelligence engine, API-only
3. `strategy-engine.ts` — strategic recommendations, no dashboard page
4. `channel-domination.ts` — channel performance, no dedicated page
5. `data-moat.ts` — data accumulation, no visibility
6. `autonomous-recovery.ts` — auto-recovery actions, no log viewer
7. `proactive-alerts.ts` — alert generation with no alert inbox
8. `offer-competition.ts` — offer testing engine, no management UI
9. `moat-exploitation.ts` — moat deployment tracking, no dashboard
10. `dm-conversion-engine.ts` — DM funnel, no DM management UI
11. `content-memory.ts` — content dedup/exhaustion, no visibility
12. `niche-benchmarking.ts` — benchmarks, no dashboard page
13. `content-quality-scorer.ts` — quality scoring, no UI
14. `creative-scheduler.ts` — scheduled creative, no calendar UI
15. `optimization-crons.ts` — optimization jobs, no visibility

**These represent ~15 library modules with business logic that users cannot see or interact with.** They execute in the background (via cron or API calls) but provide no feedback loop to the operator.

### 2.5 Onboarding Experience Assessment

The onboarding flow is **one of the stronger parts** of the product:

1. `/setup` — First-run wizard checks environment (database, AI, email, billing, encryption). Clear status indicators. Niche catalog browsable. Brand configuration. **Complete and functional.**

2. `/onboard` — 7-step client wizard (email → niche → plan → branding → integrations → review → complete). Stripe checkout integration. Magic link delivery. **Complete and functional.**

3. `/auth/sign-in` — Magic link auth flow. **Complete.**

**Gap:** After onboarding, the operator lands on a dashboard that loads demo data if no leads exist. The "Getting Started Checklist" component exists but there's no guided tour or contextual help. A first-time operator would see empty charts and zero leads.

### 2.6 Can a Real User Accomplish the Core Use Case End-to-End?

**Core use case: Capture a lead, score it, nurture it, and see it in the dashboard.**

| Step | Possible? | Friction |
|------|-----------|---------|
| 1. Deploy to Vercel | ✅ Yes | Standard `vercel --prod` |
| 2. Run setup wizard | ✅ Yes | `/setup` works well |
| 3. Configure niche | ✅ Yes | Niche generator works |
| 4. Submit a test lead via `/api/intake` | ✅ Yes | Intake endpoint works |
| 5. See lead in dashboard | ⚠️ Partially | Dashboard loads but unbounded queries may be slow. Demo mode may mask real data. |
| 6. Lead gets scored | ✅ Yes | Scoring runs on intake |
| 7. Lead gets nurture email | ❌ Not without API keys | Requires SINOSEND_API_KEY or EMAILIT_API_KEY |
| 8. View analytics | ⚠️ Partially | Analytics page works but shows demo data if insufficient real data |
| 9. Run A/B experiment | ⚠️ Partially | Works in-memory but experiments lost on restart |
| 10. Sell lead on marketplace | ⚠️ Partially | Marketplace works but defaults to demo data |

**Honest assessment:** A user can deploy, configure, and capture leads. The scoring engine works. But the system is fundamentally a **demo-first platform** — nearly every UI page has hardcoded demo data that shows when the API returns empty/error. This is good for sales demos but means a new production user sees a mix of real and fake data until they have sufficient volume.

---

## Part 3: Production Readiness Summary

### Critical Blockers

1. **Unbounded database queries on dashboard load** — 5 concurrent `SELECT * FROM ... ORDER BY ... DESC` with no LIMIT. Will crash or timeout with production data volumes.

2. **~20 unbounded in-memory Maps** — Module-level Maps in `trust-engine.ts`, `proactive-alerts.ts`, `offer-competition.ts`, `joy-engine.ts`, `autonomous-recovery.ts`, `data-moat.ts`, `moat-exploitation.ts` grow without limit. In a long-running process, this is a memory leak.

3. **Experiment store is in-memory only** — A/B experiments (`experimentStore`) are stored in a Map. Server restart = all experiments lost. This is a core feature that must be persistent.

4. **No caching on kernel runtime** — Every page load and API call hits the database fresh. No HTTP cache headers, no `revalidate`, no CDN caching.

5. **Previously identified: Production secrets in git** (per existing CODEBASE_AUDIT.md) — Stripe live keys and 12+ other production secrets committed to `neatcircle-beta/.env.local`.

### High Priority

6. **Zero dynamic imports / code splitting** — 27 client-side pages with no lazy loading. Largest is 1,073 lines (marketplace).

7. **Zero Suspense boundaries** on data-fetching pages — except 2 minor pages (`preferences`, `manage-data`).

8. **Webhook retry loop** — `webhook-registry.ts` executes individual `UPDATE` queries per delivery in a loop. Should batch.

9. **No image optimization** in kernel runtime — Missing `images` config in `next.config.mjs`.

10. **Demo data fallback masks bugs** — When API calls fail, pages silently render hardcoded demo data instead of showing errors. This hides real issues in production.

### Medium Priority

11. Provider count overstated (62 actual vs 137 claimed)
12. Lib module count overstated (165 actual vs 234 claimed)
13. ~15 lib modules with no UI surface
14. SSO defined but not wired
15. Cross-tenant learning is conceptual only
16. Real-time SSE is stubbed but not used

### What's Genuinely Good

- **Security posture is strong** — parameterized SQL, HMAC auth, CSP headers, rate limiting, CORS whitelisting, GDPR compliance.
- **Niche generator is genuinely impressive** — 13 industry templates with domain-specific psychology, scoring weights, and nurture content.
- **Multi-tenant architecture is solid** — tenant isolation via scoped queries and RLS policies.
- **Onboarding wizard is complete** — 7-step flow with Stripe integration.
- **Erie-Pro is a fully functional territory platform** — Prisma-backed, with real lead routing, provider management, Stripe billing, and admin dashboard.
- **LRU cache implementation is correct** — just needs to be used more widely.
- **Input validation on API routes is thorough** — field length limits, pattern checks, type validation.
- **Authentication middleware is well-designed** — defense-in-depth with multiple auth methods.

---

## Appendix: File References

All findings reference specific files in the workspace:

| Finding | File Path |
|---------|-----------|
| Missing image optimization | `lead-os-hosted-runtime-wt-hybrid/next.config.mjs` |
| Good image optimization | `erie-pro/next.config.ts` |
| Unbounded queries | `lead-os-hosted-runtime-wt-hybrid/src/lib/runtime-store.ts:661,732,808,884,1013,1069` |
| Dashboard loading all data | `lead-os-hosted-runtime-wt-hybrid/src/app/dashboard/page.tsx:20-26` |
| Memory leak Maps | `src/lib/trust-engine.ts:91-94`, `src/lib/proactive-alerts.ts:34`, `src/lib/offer-competition.ts:72-81`, `src/lib/joy-engine.ts:86`, `src/lib/autonomous-recovery.ts:42`, `src/lib/data-moat.ts:81-82` |
| In-memory experiment store | `lead-os-hosted-runtime-wt-hybrid/src/lib/experiment-store.ts` |
| LRU cache (unused potential) | `lead-os-hosted-runtime-wt-hybrid/src/lib/lru-cache.ts` |
| Rate limiter (well done) | `lead-os-hosted-runtime-wt-hybrid/src/lib/rate-limiter.ts` |
| Query in loop | `lead-os-hosted-runtime-wt-hybrid/src/lib/webhook-registry.ts:386-401` |
| Demo data fallback | `src/app/dashboard/leads/page.tsx:44-62`, `src/app/marketplace/page.tsx:63-119` |
| Niche templates (genuinely good) | `lead-os-hosted-runtime-wt-hybrid/src/lib/niche-templates.ts` (1,905 lines) |
| Onboarding wizard (complete) | `lead-os-hosted-runtime-wt-hybrid/src/app/onboard/page.tsx` (839 lines) |
