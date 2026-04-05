# Production-Readiness Audit Report

**Date:** 2026-04-05
**Scope:** 4 Next.js apps in /workspace monorepo
**Auditor:** Automated Senior Frontend Engineer Audit

---

## App Inventory

| App | Path | Framework | Key Deps |
|-----|------|-----------|----------|
| **Kernel** | `lead-os-hosted-runtime-wt-hybrid/` | Next.js 16, React 19 | pg, bullmq, stripe, zod, recharts |
| **Territory Layer** | `erie-pro/` | Next.js 15, React 19 | Prisma 7, next-auth 5 beta, stripe, bcryptjs |
| **Edge Layer** | `neatcircle-beta/` | Next.js 15, React 19 | @opennextjs/cloudflare, wrangler |
| **Embed Runtime** | `lead-os-hosted-runtime-wt-public/` | Next.js 15, React 19 | pg |

---

## 1. BUILD HEALTH

### 1.1 Missing Environment Variables That Would Crash Builds

#### CRITICAL — erie-pro

- **`erie-pro/src/lib/db.ts:14-18`** — `DATABASE_URL` is required at module evaluation time. Prisma Client instantiation calls `new PrismaPg({ connectionString })` and throws immediately if `DATABASE_URL` is empty. The `env.ts` validator confirms `DATABASE_URL: z.string().min(1)` is required.
- **`erie-pro/src/lib/env.ts:77`** — In production mode, missing `DATABASE_URL` calls `process.exit(1)` via `instrumentation.ts:19`. This is correct behavior but means **builds will fail on Vercel without DATABASE_URL** since Prisma generates types during `postinstall`.

#### CRITICAL — lead-os-hosted-runtime-wt-hybrid

- **`src/lib/integrations/job-queue.ts:129`** — Uses `process.env.REDIS_URL!` (non-null assertion). If REDIS_URL is unset at runtime, this crashes with a connection error. No graceful fallback.
- **`src/app/api/billing/portal/route.ts` (erie-pro):50** — `process.env.STRIPE_SECRET_KEY!` non-null assertion. Will throw at runtime if Stripe is not configured.

#### MODERATE — All apps

- `lead-os-hosted-runtime-wt-hybrid/.env.example` lists **105+ env vars**. Many are optional but there is no validation layer like erie-pro's `env.ts`. Any typo or missing var fails silently.
- `neatcircle-beta` and `lead-os-hosted-runtime-wt-public` have **no env validation** at all.

### 1.2 Hardcoded localhost URLs

| Severity | File | Line | Issue |
|----------|------|------|-------|
| **HIGH** | `hybrid/src/lib/dynasty-landing-engine.ts` | 336, 383 | Fallback `"https://localhost:3000"` for `NEXT_PUBLIC_APP_URL` in JSON-LD generation. Will leak into production structured data. |
| **HIGH** | `hybrid/src/lib/sso.ts` | 52, 154 | SSO callback URLs default to `http://localhost:3000`. OIDC/SAML callbacks will fail in production without `NEXT_PUBLIC_SITE_URL`. |
| **HIGH** | `hybrid/src/app/dashboard/revenue/page.tsx` | 80 | `fetchRevenueData()` falls back to `"http://localhost:3000"` to make a server→server fetch. Will fail on any deployment. |
| **MEDIUM** | `hybrid/src/lib/openapi-spec.ts` | 13 | OpenAPI spec lists `http://localhost:3000` as development server. |
| **MEDIUM** | `hybrid/src/app/dashboard/page.tsx` | 19 | Demo fallback `"demo@localhost"` for operator session. |
| **LOW** | `hybrid/src/lib/onboarding.ts` | 414 | Properly guarded with `window.location.origin` on client, `process.env.NEXT_PUBLIC_SITE_URL` with localhost fallback on server. |
| **LOW** | `erie-pro/.env.example` | 18, 23 | `NEXT_PUBLIC_APP_URL` and `AUTH_URL` default to `http://localhost:3002`. Expected for example file. |

### 1.3 Import / Dynamic Import Risks

- **`hybrid/src/middleware.ts:241-243`** — Dynamic `import("@/lib/auth-system")` inside middleware. If `auth-system.ts` has a runtime dependency that fails (e.g., DB connection), every authenticated API request 500s. This is a **SPOF** for the entire API layer.
- **`hybrid/src/mcp/tools.ts`** — 20+ dynamic imports using relative `.ts` extension paths (e.g., `import("../lib/distribution-engine.ts")`). These work in Node with `--experimental-strip-types` but may break in bundled contexts.

### 1.4 next.config Gaps

| App | Issue |
|-----|-------|
| **neatcircle-beta** | `next.config.ts` is `{}` — **completely empty**. No security headers, no `output`, no image config, no CSP. Contrast with erie-pro and hybrid which have comprehensive security headers. |
| **lead-os-hosted-runtime-wt-public** | Minimal config: `poweredByHeader: false, reactStrictMode: true`. No security headers, no CSP, no caching config. |
| **hybrid** | `output: "standalone"` is set. Good for Docker. Has security headers. |
| **erie-pro** | Strongest config: CSP, caching headers, image formats, `serverExternalPackages`. |

---

## 2. CLIENT/SERVER BOUNDARY

### 2.1 Unnecessary "use client" Directives

| File | Issue | Recommendation |
|------|-------|----------------|
| `hybrid/src/app/dashboard/leads/page.tsx` | Entire page is `"use client"` with 458 lines. Fetches data client-side via `fetch("/api/leads")` in `useEffect`. | Should be a server component with `async` page fetching directly from the DB. Client interactivity (filters, pagination) should be extracted to a child client component. |
| `hybrid/src/app/dashboard/scoring/page.tsx` | Client page that fetches scoring config via API. | Move data loading server-side. |
| `hybrid/src/app/dashboard/pipeline/page.tsx` | Client page fetching pipeline data. | Server component candidate. |
| `hybrid/src/app/dashboard/prospects/page.tsx` | Client page fetching prospect data. | Server component candidate. |
| `hybrid/src/app/dashboard/competitors/page.tsx` | Client page fetching competitor data. | Server component candidate. |
| `hybrid/src/app/dashboard/attribution/page.tsx` | Client page fetching attribution data. | Server component candidate. |
| `hybrid/src/app/dashboard/creative/page.tsx` | Client page fetching creative data. | Server component candidate. |
| `hybrid/src/app/dashboard/marketplace/page.tsx` | Client page fetching marketplace data. | Server component candidate. |
| `neatcircle-beta/src/app/dashboard/page.tsx` | Client page fetching dashboard metrics via API. | Could be server component with client child for refresh. |

### 2.2 Heavy Imports in Client Components

| File | Import | Impact |
|------|--------|--------|
| `hybrid/src/components/DynastyLandingPage.tsx` | ~1800+ lines as `"use client"` with `useEffect`, `useRef`, `useState`. | Massive client bundle. Should SSR the static parts. |
| `hybrid/src/components/ui/chart.tsx` | Imports `recharts` (large charting library) in a `"use client"` wrapper. | recharts is ~200KB minified. Used by dashboard pages. Consider lazy loading. |
| `hybrid/src/components/SetupWizardClient.tsx` | ~800+ lines as single client component. | Should be split into smaller components. |

### 2.3 Client-Side Data Fetching That Should Be Server-Side

The hybrid app's dashboard has **14+ pages** that are `"use client"` and fetch data via `useEffect` + `fetch("/api/...")`. This is the single biggest architectural concern:

- All data goes through an API round-trip instead of direct DB access.
- No streaming or suspense boundaries.
- First paint shows loading spinner, then data. Poor LCP.
- Every page reload triggers a waterfall: HTML → JS → mount → fetch → render.

---

## 3. STATE MANAGEMENT

### 3.1 Patterns Used

| App | Pattern | Assessment |
|-----|---------|------------|
| **hybrid** | Individual `useState` per component. No global store. | Acceptable for isolated dashboard pages. |
| **erie-pro** | NextAuth session + server components + individual forms. | Clean pattern. Server-first. |
| **neatcircle-beta** | `useState` + custom `window.addEventListener("nc-profile-updated")` event bus. | Custom event bus pattern in `Hero.tsx`, `WhatsAppOptIn.tsx`, `ReferralBanner.tsx`. Fragile — no deduplication, no error handling on event dispatch. |
| **public** | Minimal. Two client components (`RuntimeConfigForm`, `AdaptiveLeadCaptureForm`). | Clean. |

### 3.2 Race Conditions

| File | Issue |
|------|-------|
| `neatcircle-beta/src/components/BehavioralTracker.tsx` | `useRef(Date.now())` on mount. Multiple rapid mounts (StrictMode) could create duplicate tracking events. No deduplication logic for scroll/time events. |
| `neatcircle-beta/src/components/ChatWidget.tsx:203-223` | Multiple `useEffect` hooks with `window.addEventListener`. In React 18/19 StrictMode, these may double-register briefly. Cleanup functions are present but timing-sensitive. |
| `hybrid/src/lib/db.ts:4-5` | Module-level `let pool: Pool | null = null` singleton. In serverless (Vercel), this is re-created per invocation — **pool is effectively unused** as connection pooling. No PgBouncer/Neon pooler reference. |
| `erie-pro/src/lib/db.ts:9-10` | Uses `globalThis` pattern correctly for Prisma client singleton. |

---

## 4. ERROR BOUNDARIES

### Coverage Matrix

| App | `error.tsx` (root) | `not-found.tsx` (root) | `loading.tsx` (root) | Sub-route coverage |
|-----|-------------------|----------------------|---------------------|-------------------|
| **hybrid** | ✅ `src/app/error.tsx` | ✅ `src/app/not-found.tsx` | ✅ `src/app/loading.tsx` | ✅ `dashboard/error.tsx`, `dashboard/loading.tsx` |
| **erie-pro** | ✅ `src/app/error.tsx` | ✅ `src/app/not-found.tsx` | ✅ `src/app/loading.tsx` | ✅ `admin/error.tsx`, `admin/loading.tsx`, `dashboard/error.tsx`, `dashboard/loading.tsx`, `dashboard/disputes/loading.tsx`, `dashboard/settings/loading.tsx`, `dashboard/notifications/loading.tsx` |
| **neatcircle-beta** | ❌ **MISSING** | ❌ **MISSING** | ❌ **MISSING** | ❌ No error/loading/not-found anywhere |
| **public** | ❌ **MISSING** | ❌ **MISSING** | ❌ **MISSING** | ❌ No error/loading/not-found anywhere |

### CRITICAL GAPS

- **neatcircle-beta** has **zero** error boundaries. Any unhandled error in any page will show Next.js's default error page (ugly white screen in production).
- **lead-os-hosted-runtime-wt-public** also has **zero** error boundaries. Same risk.
- These apps are customer-facing — a missing error boundary is a production incident waiting to happen.

### Missing Per-Route Boundaries

In **hybrid**, the following high-traffic routes lack dedicated error/loading states:
- `src/app/marketplace/` — no error.tsx
- `src/app/pricing/` — no error.tsx
- `src/app/industries/` — no error.tsx
- `src/app/lp/[slug]/` — no error.tsx (dynamic landing pages)

In **erie-pro**, missing for:
- `src/app/[niche]/` (46 niche routes) — no error.tsx per niche
- `src/app/for-business/` — no error.tsx
- `src/app/directory/` — no error.tsx

---

## 5. HYDRATION RISKS

### 5.1 Date.now() / new Date() in Render

| File | Line | Risk |
|------|------|------|
| `hybrid/src/app/layout.tsx` | 206 | `new Date().getFullYear()` in footer. **Low risk** — only affects year number, unlikely to mismatch between server/client unless around midnight Dec 31. |
| `erie-pro/src/app/layout.tsx` | 369 | Same pattern: `new Date().getFullYear()`. Same low risk. |
| `neatcircle-beta/src/components/BehavioralTracker.tsx` | 14 | `useRef(Date.now())` — safe, inside `useRef`, not in render output. |

### 5.2 window/document Access Without Guards

| Severity | File | Issue |
|----------|------|-------|
| **SAFE** | `neatcircle-beta/src/components/ChatWidget.tsx:21-22` | `typeof window === "undefined"` guard present. |
| **SAFE** | `neatcircle-beta/src/components/ExitIntent.tsx:66, 94` | `typeof window === "undefined"` and `window.innerWidth` guards present. |
| **RISKY** | `neatcircle-beta/src/components/BehavioralTracker.tsx:20-21` | `window.scrollY`, `document.documentElement.scrollHeight` accessed inside `useCallback` — only called from `useEffect`, so safe, but no explicit guard. |
| **RISKY** | `neatcircle-beta/src/components/ReferralBanner.tsx:61-66` | `document.createElement("textarea")`, `document.execCommand("copy")` — legacy clipboard API. No feature detection. Will break in future browsers. Should use `navigator.clipboard.writeText()`. |
| **SAFE** | `erie-pro/src/components/cookie-banner.tsx:8,14` | `document.cookie` access — inside event handlers, safe. |
| **SAFE** | `erie-pro/src/components/service-search.tsx:80` | `window.location.href` in event handler. |

### 5.3 suppressHydrationWarning

- `hybrid/src/app/layout.tsx:75` — `suppressHydrationWarning` on `<html>` tag. Used correctly for `next-themes` dark mode class injection.
- `erie-pro/src/app/layout.tsx:96` — Same pattern, correct usage.

---

## 6. BUNDLE SIZE RISKS

### 6.1 Large Library Imports

| Library | Approx Size | Apps | Used In |
|---------|------------|------|---------|
| **recharts** | ~200KB min | hybrid, erie-pro | `src/components/ui/chart.tsx` (client component) |
| **lucide-react** | Tree-shakeable | hybrid, erie-pro | Many components. Properly imported per-icon. ✅ |
| **stripe** | ~150KB | hybrid, erie-pro | Server-only. Dynamic import in erie-pro. ✅ |
| **bullmq** | ~100KB | hybrid | Server-only dep. ✅ |
| **embla-carousel-react** | ~20KB | hybrid, erie-pro | Client component. Acceptable. |
| **react-day-picker** | ~40KB | hybrid, erie-pro | Client component. Acceptable. |

### 6.2 No lodash imports in the 4 audited apps

Lodash is only imported in the `_n8n_sources/` directory (outside audit scope). ✅

### 6.3 Monolithic Client Components

| File | Lines | Issue |
|------|-------|-------|
| `hybrid/src/components/DynastyLandingPage.tsx` | ~2100+ | Massive single `"use client"` component. Entire landing page engine in one file. |
| `hybrid/src/components/SetupWizardClient.tsx` | ~850+ | Large wizard component. |
| `neatcircle-beta/src/components/ChatWidget.tsx` | ~396 | Chat widget with full conversation UI. |

### 6.4 Large Data Files in Client Bundles

- **`erie-pro/src/lib/glossary-data.ts`** — Glossary data (size unknown) potentially imported in client `[niche]/glossary/page.tsx`. Should verify this is server-only.
- **`neatcircle-beta/src/lib/funnel-blueprints.ts`**, **`src/lib/niche-config.ts`**, **`src/lib/services.ts`** — Configuration data imported in both server and client components. The client-side `ChatWidget.tsx` imports `funnel-blueprints.ts`. May inflate client bundle if these files are large.

---

## 7. ROUTE HANDLER ROBUSTNESS

### 7.1 Missing OPTIONS/CORS Handlers

| App | Route | Has OPTIONS? | Has CORS? |
|-----|-------|-------------|-----------|
| **hybrid** | `/api/intake` | ❌ No OPTIONS export | ✅ CORS headers via `buildCorsHeaders` |
| **public** | `/api/intake` | ✅ Explicit OPTIONS handler | ✅ CORS headers |
| **neatcircle-beta** | `/api/intake` | ❌ No OPTIONS export | ❌ No CORS headers |
| **neatcircle-beta** | `/api/track` | ❌ No OPTIONS export | ❌ No CORS headers |
| **neatcircle-beta** | `/api/subscribe` | ❌ No OPTIONS export | ❌ No CORS headers |
| **neatcircle-beta** | `/api/contact` | ❌ No OPTIONS export | ❌ No CORS headers |
| **erie-pro** | `/api/lead` | ❌ No OPTIONS export | ❌ No CORS headers (relies on same-origin) |
| **erie-pro** | `/api/embed/submit` | ✅ Explicit OPTIONS handler | ✅ CORS headers |
| **erie-pro** | `/api/leads/inbound` | ✅ Explicit OPTIONS handler | ✅ CORS headers |

### 7.2 Input Validation

| Route | Validation | Assessment |
|-------|-----------|------------|
| `hybrid/api/intake` | ✅ Zod schema (`IntakePayloadSchema`) + `validateSafe()` | **Strong** |
| `erie-pro/api/lead` | ✅ Zod schema (`LeadRequestSchema`) + `safeParse()` | **Strong** |
| `neatcircle-beta/api/intake` | ⚠️ `isPlainObject(body)` check only. No schema validation. `body as LeadIntakePayload` type assertion. | **Weak** — trusts client data shape |
| `neatcircle-beta/api/track` | ✅ Manual field-level validation + `clampText()` sanitization | **Adequate** |
| `neatcircle-beta/api/subscribe` | ⚠️ Only checks `if (!email)`. No email format validation. | **Weak** |
| `public/api/intake` | ❌ **No validation at all**. Raw `request.json()` passed to `persistLead()`. | **CRITICAL** — untrusted input goes directly to persistence |

### 7.3 Rate Limiting

| App | Rate Limiting | Assessment |
|-----|--------------|------------|
| **hybrid** | ✅ `createRateLimiter` in-memory. 30 req/60s on intake, 10 req/min on auth. | Good, but in-memory won't work across serverless instances. |
| **erie-pro** | ✅ `checkRateLimit` with optional Upstash Redis backing. In-memory fallback. | **Best** — supports distributed rate limiting. |
| **neatcircle-beta** | ✅ `enforceRateLimit` in-memory. 20 req/60s on intake, 120 req/60s on tracking. | Same in-memory limitation as hybrid. |
| **public** | ❌ **No rate limiting on intake route.** | **CRITICAL** — `/api/intake` is wide open to abuse. |

### 7.4 Error Responses

| App | Consistent Error Shape | Status Codes |
|-----|----------------------|--------------|
| **hybrid** | ✅ `{ data: null, error: { code, message, details? } }` | ✅ 400, 401, 403, 422, 429, 500 |
| **erie-pro** | ✅ `{ success: false, error: "message" }` | ✅ 400, 401, 403, 413, 500, 503 |
| **neatcircle-beta** | ⚠️ Mixed: `{ error: "message" }` and `{ success: true }` | ✅ 400, 429 |
| **public** | ⚠️ `{ success: false, error: "message" }` — no error codes | ✅ 400, 204 |

### 7.5 Streaming / Timeout

- **erie-pro** uses `after()` from `next/server` for background email/webhook tasks. ✅ Excellent pattern — response returns immediately.
- **hybrid** does blocking `await persistLead(body)` and ingress enrichment before responding. Response time depends on DB + enrichment latency.
- **neatcircle-beta** `api/track` does `await logToAITable(safeEvent)` which makes an external HTTP call to aitable.ai before responding. **HIGH RISK** — if AITable is slow, all tracking requests block. Should be fire-and-forget.

---

## 8. SEO

### 8.1 Metadata Coverage

| App | Root Metadata | OG Tags | Twitter Cards | JSON-LD | Per-Page Metadata |
|-----|--------------|---------|---------------|---------|-------------------|
| **hybrid** | ✅ Full | ✅ OG image, title, desc | ✅ summary_large_image | ✅ Organization, WebSite, SoftwareApplication | ✅ 25+ pages with metadata/generateMetadata |
| **erie-pro** | ✅ Full | ✅ OG image, title, desc, locale | ✅ summary_large_image | ✅ LocalBusiness, WebSite | ✅ 30+ pages with metadata/generateMetadata |
| **neatcircle-beta** | ✅ Full | ✅ OG image, title, desc | ✅ summary_large_image | ✅ Organization, WebSite, SoftwareApplication | ✅ 15+ pages with metadata/generateMetadata |
| **public** | ⚠️ Minimal | ❌ No OG tags | ❌ No Twitter cards | ❌ No JSON-LD | ❌ No per-page metadata |

### 8.2 robots.txt

| App | Has robots.ts? | Blocks Sensitive Routes? | Has Sitemap Reference? |
|-----|---------------|------------------------|----------------------|
| **hybrid** | ✅ | ✅ `/dashboard/`, `/api/`, `/setup/`, `/auth/` | ✅ |
| **erie-pro** | ✅ | ✅ `/admin/*`, `/api/`, `/dashboard/*`, `/login`, `/setup-admin` | ✅ |
| **neatcircle-beta** | ✅ | ✅ `/dashboard/`, `/control-center/`, `/api/`, `/auth/`, `/funnels/` | ✅ |
| **public** | ❌ **MISSING** | N/A | N/A |

### 8.3 Sitemap

| App | Has sitemap.ts? | Dynamic URLs? | Assessment |
|-----|----------------|---------------|------------|
| **hybrid** | ✅ | Yes (industries, offers, etc.) | Good |
| **erie-pro** | ✅ | Yes (niches, providers, listings from DB) | **Excellent** — most comprehensive |
| **neatcircle-beta** | ✅ | Yes (services, industries, locations, stories) | Good |
| **public** | ❌ **MISSING** | N/A | No sitemap generation |

### 8.4 Structured Data Issues

- **hybrid/src/app/layout.tsx:87-111** — JSON-LD uses hardcoded `"https://cxreact.com"` URLs instead of `process.env.NEXT_PUBLIC_SITE_URL`. When deployed under a different domain, structured data will reference the wrong site.

---

## SEVERITY SUMMARY

### 🔴 CRITICAL (Block Release)

1. **`public/api/intake` — No input validation.** Raw JSON passed to persistence. Path: `lead-os-hosted-runtime-wt-public/src/app/api/intake/route.ts:15`
2. **`public/api/intake` — No rate limiting.** Open to abuse/DDoS. Same file.
3. **neatcircle-beta — Zero error boundaries.** No `error.tsx`, `not-found.tsx`, or `loading.tsx` anywhere.
4. **lead-os-hosted-runtime-wt-public — Zero error boundaries.** Same gap.
5. **neatcircle-beta `next.config.ts` — Empty config.** No security headers, no CSP, no X-Frame-Options. Path: `neatcircle-beta/next.config.ts`

### 🟠 HIGH (Fix Before GA)

6. **Hardcoded localhost fallbacks in production code paths.** `dynasty-landing-engine.ts:336`, `sso.ts:52`, `dashboard/revenue/page.tsx:80`.
7. **JSON-LD uses hardcoded domain** instead of env var. `hybrid/src/app/layout.tsx:87-111`.
8. **`neatcircle-beta/api/track` blocks on external HTTP.** `logToAITable()` should be fire-and-forget. Path: `neatcircle-beta/src/app/api/track/route.ts:190`.
9. **`erie-pro/api/billing/portal` — `process.env.STRIPE_SECRET_KEY!`** non-null assertion will crash if Stripe is unconfigured. Path: `erie-pro/src/app/api/billing/portal/route.ts:50`.
10. **`hybrid` middleware SPOF** — Dynamic import of `@/lib/auth-system` in middleware. If this module fails, all API auth fails. Path: `hybrid/src/middleware.ts:241`.
11. **`public` — No robots.txt, no sitemap, minimal metadata.** Path: entire `lead-os-hosted-runtime-wt-public/` app.
12. **In-memory rate limiters** won't work across serverless instances (hybrid, neatcircle-beta).

### 🟡 MEDIUM (Track for Next Sprint)

13. Dashboard pages in hybrid should be server components (14+ pages doing client-side API fetches).
14. `DynastyLandingPage.tsx` at 2100+ lines as single client component — should be split.
15. `neatcircle-beta/src/components/ReferralBanner.tsx` uses deprecated `document.execCommand("copy")`.
16. `neatcircle-beta` custom event bus (`window.dispatchEvent("nc-profile-updated")`) is fragile. Consider React Context or Zustand.
17. `hybrid/src/lib/db.ts` Pool singleton — ineffective in serverless. Needs connection pooler (PgBouncer/Neon).
18. Missing per-route error boundaries in erie-pro's niche routes and hybrid's marketing pages.
19. `neatcircle-beta/api/subscribe` has no email format validation.
20. `neatcircle-beta/api/intake` has weak validation (type assertion, no schema).

### 🟢 LOW (Nice to Have)

21. `hybrid` and `erie-pro` have `recharts` in client bundle (~200KB). Consider dynamic import with `next/dynamic`.
22. `hybrid/src/lib/openapi-spec.ts` lists localhost in server list.
23. `hybrid/src/app/dashboard/page.tsx:19` fallback to `"demo@localhost"` for session.
24. neatcircle-beta env vars have no build-time validation.
25. `hybrid` and `public` use `"type": "module"` in package.json with `.mjs` config — consistent but verify all tooling supports ESM.

---

## RECOMMENDATIONS (Priority Order)

1. **Add input validation + rate limiting to `public/api/intake`** — copy pattern from hybrid.
2. **Add `error.tsx`, `not-found.tsx`, `loading.tsx` to neatcircle-beta and public**.
3. **Add security headers to neatcircle-beta's `next.config.ts`** — copy from erie-pro.
4. **Replace all hardcoded localhost fallbacks** with proper env var checks that throw on missing values in production.
5. **Make `api/track` in neatcircle-beta fire-and-forget** — use `waitUntil()` or `after()` instead of `await`.
6. **Add robots.ts and sitemap.ts to public app**.
7. **Convert hybrid dashboard pages to server components** with client-only interactive children.
8. **Add env validation to neatcircle-beta and public** — port erie-pro's `env.ts` pattern.
9. **Use distributed rate limiting** (Upstash Redis) across all apps, not just erie-pro.
10. **Fix JSON-LD to use NEXT_PUBLIC_SITE_URL** instead of hardcoded domain.
