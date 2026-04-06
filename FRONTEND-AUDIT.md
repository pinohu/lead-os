# Senior Frontend Engineering Audit

**Audited**: April 5, 2026  
**Scope**: 4 sub-projects — `erie-pro`, `neatcircle-beta`, `lead-os-hosted-runtime-wt-hybrid`, `lead-os-hosted-runtime-wt-public`

---

## Executive Summary

| Area | erie-pro | neatcircle-beta | wt-hybrid | wt-public |
|------|----------|-----------------|-----------|-----------|
| TS strictness | ✅ strict | ✅ strict | ✅ strict | ✅ strict |
| Error boundaries | ✅ 3 files | ❌ None | ✅ 2 files | ❌ None |
| Loading states | ✅ 6 files | ❌ None | ✅ 2 files | ❌ None |
| not-found.tsx | ✅ Present | ❌ Missing | ✅ Present | ❌ Missing |
| Font optimization | ✅ next/font | ✅ next/font | ✅ next/font | ❌ No font loading |
| Image optimization | ❌ No next/image | ❌ No next/image | ❌ No next/image | N/A |
| Dynamic imports | ❌ None | ❌ None | ❌ None | ❌ None |
| ESLint config | ❌ Missing | ✅ Present | ❌ Missing | ❌ Missing |
| Component tests | ❌ None | ❌ None | ❌ None | ❌ None |
| `any` types | ✅ Clean | ✅ Clean | ⚠️ 5 in tests | ✅ Clean |

**Overall Grade: C+** — TypeScript config is solid, security headers are good, but there are systemic issues with client/server separation, missing error boundaries, zero code splitting, no `next/image` usage, massive module-level mutable state, and no component/integration tests.

---

## 1. Code Quality

### 1.1 TypeScript Strictness

**All 4 projects have `strict: true`.** This is excellent. Additionally, `erie-pro` and `neatcircle-beta` enable `noImplicitReturns` and `noFallthroughCasesInSwitch`. The hybrid project also enables these flags.

**`any` type violations:**

Production source code is clean across all 4 projects — no `any` types found. The only `as any` casts are in test files:

- `lead-os-hosted-runtime-wt-hybrid/tests/multi-tenant-stress.test.ts:72` — `as any` on object literal
- `lead-os-hosted-runtime-wt-hybrid/tests/discovery-scout.test.ts:106,199,218,237` — `as any` cast on partial objects

**Type assertions bypassing safety:**

Several `as unknown as` casts exist but are justified:

- `erie-pro/src/lib/db.ts:9` — `globalThis as unknown as { prisma }` (standard Prisma singleton pattern)
- `erie-pro/prisma/seed.ts:24`, `src/scripts/*.ts` — `PrismaClient({ adapter }) as unknown as PrismaClient` (Prisma adapter compat)
- `erie-pro/src/lib/env.ts:73` — `result.data as unknown as Env` (Zod validated, acceptable)

**Non-null assertions (`!`):** Heavily used in test files (~200+ instances in hybrid tests). This is acceptable for tests but warrants `eslint-plugin-@typescript-eslint/no-non-null-assertion` for production code.

⚠️ Production non-null assertions found:
- `erie-pro/src/app/api/privacy/delete-data/route.ts:61` — `session.user.email!.toLowerCase()` — potential crash if email is null
- `erie-pro/src/app/api/privacy/export-data/route.ts:61` — same pattern
- `erie-pro/src/scripts/stripe-setup.ts:86` — `STRIPE_SECRET_KEY!` — unguarded env var access
- `erie-pro/src/app/[niche]/[provider]/page.tsx:351,386,488,490,491,562,1050,1219,1321` — `data!` used 9 times in a single component, indicating a nullable-safety issue in the rendering path

### 1.2 `"use client"` vs Server Component Separation

**CRITICAL: `lead-os-hosted-runtime-wt-hybrid` has 45 client-side page components.** Nearly every dashboard page is `"use client"` with `useEffect(() => { fetch(...) }, [])` for data loading. This is the single biggest architectural issue in the codebase.

Affected pages (all should be server components or use the server→client pattern):

- `src/app/dashboard/leads/page.tsx` — fetches leads client-side
- `src/app/dashboard/analytics/page.tsx` — fetches analytics client-side
- `src/app/dashboard/tenants/page.tsx` — fetches tenants client-side
- `src/app/dashboard/scoring/page.tsx` — fetches scoring data client-side
- `src/app/dashboard/creative/page.tsx` — fetches creative jobs client-side
- `src/app/dashboard/distribution/page.tsx` — fetches distribution data client-side
- `src/app/dashboard/competitors/page.tsx` — fetches competitor data client-side
- `src/app/dashboard/agents/page.tsx` — fetches agent data client-side
- `src/app/dashboard/billing/page.tsx` — fetches billing data client-side
- ...and 15+ more dashboard pages

**The correct pattern** (demonstrated in `erie-pro/src/app/dashboard/page.tsx`): use an `async` server component that fetches data with `prisma`/API directly, passing pre-fetched data to small client islands.

**`erie-pro` does this well** for its main dashboard but reverts to client-side fetching for settings sub-pages (`integrations`, `notifications`, `webhooks`, `hours`).

**`neatcircle-beta`** has 14 `"use client"` components. The root layout (`layout.tsx`) imports 5 client components (`BehavioralTracker`, `ExitIntent`, `ChatWidget`, `FunnelOrchestrator`, `WhatsAppOptIn`) that render on every page. These should be dynamically imported or deferred.

### 1.3 Error Boundaries (`error.tsx`) and Loading States (`loading.tsx`)

| Project | error.tsx files | loading.tsx files | not-found.tsx |
|---------|----------------|-------------------|---------------|
| erie-pro | 3 (root, dashboard, admin) | 6 | 1 |
| neatcircle-beta | **0** | **0** | **0** |
| wt-hybrid | 2 (root, dashboard) | 2 (root, dashboard) | 1 |
| wt-public | **0** | **0** | **0** |

**Critical gaps:**
- `neatcircle-beta` has **zero** error boundaries, loading states, or not-found pages. Any uncaught error will bubble to Next.js default 500 page.
- `wt-public` has **zero** error boundaries, loading states, or not-found pages.
- `wt-hybrid` is missing error/loading for 20+ dashboard sub-routes (e.g., `dashboard/leads`, `dashboard/analytics`, `dashboard/billing`).
- `erie-pro` is missing loading states for `dashboard/integrations`, `dashboard/webhooks`, `dashboard/profile`, `dashboard/leads`.

### 1.4 React Anti-Patterns

**`useEffect` for data fetching (waterfall pattern):**

The `useEffect(() => { fetch(...) }, [])` pattern is used in ~30+ pages across the codebase. This creates:
1. Render → show loading → fetch → re-render (waterfall)
2. No SSR/streaming benefit
3. No SEO indexing of content
4. Layout shifts as data loads

Worst offenders:
- `lead-os-hosted-runtime-wt-hybrid/src/app/marketplace/page.tsx` — 1,074 lines, **4 useEffects**, massive monolith component
- `lead-os-hosted-runtime-wt-hybrid/src/app/dashboard/DashboardSidebar.tsx` — **4 useEffects** including localStorage reads
- `lead-os-hosted-runtime-wt-hybrid/src/app/dashboard/prospects/page.tsx` — client-side data fetching for table data
- `neatcircle-beta/src/components/ChatWidget.tsx` — **4 useEffects**, mixing concerns

**Missing dependency arrays:** All checked `useEffect` calls have dependency arrays. No missing-deps violations found. ✅

**Stale closure risk:**
- `lead-os-hosted-runtime-wt-hybrid/src/app/marketplace/page.tsx:302-312` — `LeadPreviewModal` captures `onClose` in an effect listener but does not re-register when `onClose` changes

### 1.5 Data Fetching Patterns

**Good patterns (erie-pro):**
- `src/app/dashboard/page.tsx` — async server component with `prisma` queries ✅
- `src/app/admin/*.tsx` pages — async server components with `prisma` queries ✅
- `src/app/[niche]/page.tsx` — async server component ✅
- `src/app/api/lead/route.ts` — proper Zod validation, rate limiting, TCPA compliance ✅

**Bad patterns:**
- Every `lead-os-hosted-runtime-wt-hybrid` dashboard page fetches client-side
- `neatcircle-beta/src/app/dashboard/page.tsx` — `useEffect(() => fetch(...), [])` with fallback to demo data
- `erie-pro/src/app/dashboard/settings/hours/page.tsx` — `"use client"` page with `useEffect` fetch, could be server component with client form island

---

## 2. Build & Bundle

### 2.1 Dynamic Imports / Code Splitting

**Zero dynamic imports across all 4 projects.** No usage of `next/dynamic` or `React.lazy`.

This is a significant gap for:
- `neatcircle-beta/src/app/layout.tsx` — loads `ChatWidget`, `FunnelOrchestrator`, `ExitIntent`, `BehavioralTracker`, `WhatsAppOptIn` on every page load. These should be `dynamic(() => import(...), { ssr: false })`.
- `lead-os-hosted-runtime-wt-hybrid/src/app/marketplace/page.tsx` — 1,074-line monolith should split modal, table, and chart sub-components.
- `erie-pro/src/components/ui/chart.tsx` — wraps recharts; should be dynamically imported since it's heavy and not used on most pages.

### 2.2 Image Optimization

**No project uses `next/image`.** Zero imports of `next/image` found anywhere.

- `erie-pro` configures `images.formats: ["image/avif", "image/webp"]` in `next.config.ts` but never uses `<Image>`.
- All image rendering uses raw `<img>` tags in HTML template strings (email templates, landing page builders).
- The provider listing page (`erie-pro/src/app/[niche]/[provider]/page.tsx`) renders Google Places photos via a proxy API but doesn't use `next/image` for optimization.

### 2.3 Font Optimization

- `erie-pro` — `next/font/google` Inter ✅
- `neatcircle-beta` — `next/font/google` Geist + Geist_Mono ✅
- `wt-hybrid` — `next/font/google` Inter with `display: "swap"` ✅
- `wt-public` — **No font loading at all** ❌

### 2.4 Unused Dependencies

**`erie-pro`** — suspected unused:
- `recharts` (3.8.1, ~500KB gzipped) — only imported in `ui/chart.tsx`, which is a shadcn component wrapper. No page actually renders a chart.
- `embla-carousel-react` — only used in `ui/carousel.tsx` wrapper, no consumer found outside `ui/`.
- `react-resizable-panels` — only in `ui/resizable.tsx`, no consumer found outside `ui/`.
- `input-otp` — only in `ui/input-otp.tsx`, no consumer found.
- `cmdk` — only in `ui/command.tsx`, not used in app pages.
- `vaul` — only in `ui/drawer.tsx`, not used in app pages.
- `react-day-picker` — only in `ui/calendar.tsx`, used in 1 page (`costs`).
- `outscraper` — used only in scripts (not in the Next.js app); could be a devDependency.

These are all shadcn/ui default installations. While tree-shaking removes unused code in production, they still bloat `node_modules` and `npm install` time.

**`lead-os-hosted-runtime-wt-hybrid`** — same shadcn bloat plus:
- `recharts` — not imported anywhere in production code outside `ui/chart.tsx`
- `bullmq` — job queue library, used in `src/lib/integrations/job-queue.ts`; legitimate but heavy (~200KB)

### 2.5 Massive Dependencies

| Package | Approx. size | Used in |
|---------|-------------|---------|
| `recharts` | ~500KB gzip | erie-pro (unused), wt-hybrid (unused in production) |
| `bullmq` | ~200KB | wt-hybrid (job queue) |
| `stripe` | ~150KB | erie-pro, wt-hybrid |
| `lucide-react` | ~150KB (tree-shakeable) | erie-pro, wt-hybrid |
| `@prisma/client` | ~200KB | erie-pro |

---

## 3. State Management

### 3.1 Patterns Used

- **No state management library** (no Redux, Zustand, Jotai, Recoil, or TanStack Query) in any project.
- State is managed via React `useState` + `useEffect` fetch pattern throughout.
- `React.createContext` is used only in shadcn/ui primitives (carousel, form, sidebar, toggle-group) and one production component (`RealtimeProvider.tsx`).

### 3.2 Prop Drilling

Generally **not a major issue** because most pages are self-contained client components that fetch their own data. However:
- `erie-pro/src/app/layout.tsx` passes no props deep — clean.
- `lead-os-hosted-runtime-wt-hybrid/src/app/dashboard/DashboardSidebar.tsx` — internal state only, no drilling.
- The absence of a shared state layer means each dashboard page re-fetches independently, with no caching or deduplication.

### 3.3 Global State Leaks (Module-Level Mutable State)

**CRITICAL: `lead-os-hosted-runtime-wt-hybrid` has 40+ module-level `Map`/`Set` instances used as in-memory stores.**

These are persistent across requests in the same Node.js process, which creates:
1. **Memory leaks** — Maps grow unboundedly; no eviction/TTL observed in most stores
2. **Cross-request data leakage** — in a serverless environment (Vercel), these persist within a single Lambda instance
3. **Multi-tenant data isolation risk** — tenant data stored in global Maps could leak between tenants if tenant filtering has bugs

Worst offenders (partial list):
- `src/lib/page-builder.ts:62-63` — `pageStore`, `formStore`
- `src/lib/integrations/groove-adapter.ts:146-154` — **9 global Maps** for contacts, campaigns, sequences, affiliates, etc.
- `src/lib/integrations/salespanel-adapter.ts:80-82` — 3 global Maps
- `src/lib/integrations/notification-hub.ts:91,118` — 2 global Maps
- `src/lib/webhook-registry.ts:33-34` — endpoint and delivery stores
- `src/lib/welcome-sequence.ts:36` — sequence state store
- `src/lib/scoring-config.ts:3` — scoring config store
- `src/lib/tenant-scoring-model.ts:70-71` — outcome and model stores
- `src/lib/agent-orchestrator.ts:57` — task store
- `src/lib/auto-deploy.ts:83` — deployment store
- `src/lib/widget-preview.ts:47` — preview session store
- `src/lib/dynasty-landing-engine.ts:239` — config store
- `src/lib/social-dm-engine.ts:105` — sequence store
- `src/lib/email-templates.ts:37` — template store

**`erie-pro`** has smaller-scale global state:
- `src/lib/rate-limit.ts:99` — `windows` Map (has TTL cleanup ✅)
- `src/lib/auth.ts:22` — `loginAttempts` Map (has TTL cleanup ✅)
- `src/lib/call-tracking.ts:59` — `trackingNumberCache` Map (no eviction ⚠️)
- `src/app/api/setup-admin/route.ts:29` — `setupAttempts` Map (has TTL ✅)

**`neatcircle-beta`** has minor global state:
- `src/lib/lead-intake.ts:69` — `intakeReplayStore` Map (replay dedup, no eviction ⚠️)
- `src/lib/request-guards.ts:8` — `rateLimitStore` Map (no eviction ⚠️)

---

## 4. Testing Gaps

### 4.1 Component Tests

**Zero component tests exist across all 4 projects.** No `@testing-library/react` render tests despite `erie-pro` having it as a devDependency.

- `erie-pro` — 8 unit tests, all in `src/lib/__tests__/`. Tests cover: rate limiting, city config, niches, email, feature flags, logger, validation, city registry. **Zero UI component tests.**
- `neatcircle-beta` — 6 integration tests in `tests/`. Tests cover: website intelligence, tracing, automation catalog, automation smoke, catalog, request guards. **Zero UI tests.**
- `wt-hybrid` — **175 test files** in `tests/`. Extensive backend/integration coverage. **Zero UI component tests.**
- `wt-public` — 11 test files in `tests/`. Backend-only. **Zero UI tests.**

### 4.2 Testing Libraries

| Project | Framework | UI Testing Lib | Config |
|---------|-----------|---------------|--------|
| erie-pro | vitest 4.x | @testing-library/react + jsdom (installed, **unused**) | vitest.config.ts |
| neatcircle-beta | Node.js built-in `--test` | None | npm script |
| wt-hybrid | Node.js built-in `--test` | None | npm script |
| wt-public | Node.js built-in `--test` | None | npm script |

### 4.3 Missing Test Coverage

- **No E2E tests** (no Playwright, Cypress, or similar)
- **No visual regression tests**
- **No accessibility tests** (no `jest-axe` or `@axe-core/react`)
- **No form component tests** despite forms being critical paths (lead intake, contact, claim, login, registration)
- **No API route handler tests** for erie-pro (15+ API routes untested)

---

## 5. Error Handling

### 5.1 Fetch Calls

**Good patterns found in `erie-pro`:**
- API routes wrap everything in `try/catch` with proper 500 responses ✅
- `src/app/api/lead/route.ts` — exemplary: Zod validation, rate limiting, try/catch, `after()` for background tasks with individual `.catch()` on each task ✅

**Silent `.catch(() => {})` swallowing errors — 40+ instances across the codebase:**

`lead-os-hosted-runtime-wt-hybrid` (15 instances):
- `src/lib/niche-adapter.ts:744,762,786` — persistence failures silently swallowed
- `src/lib/persistent-store.ts:44,49` — persistence failures silently swallowed
- `src/lib/intake.ts:863` — usage increment failure swallowed
- `src/lib/execution-engine.ts:106,123,140` — usage tracking for emails/SMS/WhatsApp silently swallowed
- `src/lib/error-reporting.ts:55` — **error reporter swallows its own send errors**
- `src/lib/agent-audit-log.ts:282` — audit log persistence failure swallowed
- `src/app/api/tracking/*.ts` — tracking events silently swallowed

`erie-pro` (12 instances):
- `src/app/api/leads/inbound/route.ts:96,187,198` — webhook/notification failures swallowed
- `src/app/api/embed/submit/route.ts:58,116,127` — same pattern
- `src/app/api/provider/api-keys/route.ts:122,186` — audit logging failures swallowed
- `src/lib/webhook-delivery.ts:96` — retry scheduling failure swallowed

`neatcircle-beta` (11 instances):
- `src/lib/lead-intake.ts:180` — **AITable record creation failure silently swallowed** — leads could be lost
- `src/lib/trace.ts:246` — tracking events silently swallowed
- `src/components/WhatsAppOptIn.tsx:75`, `ReferralBanner.tsx:58`, `ROICalculator.tsx:111`, `ChatWidget.tsx:275`, `ExitIntent.tsx:136`, `AssessmentQuiz.tsx:119` — intake API failures swallowed

**Verdict:** Fire-and-forget for analytics/tracking is acceptable, but `.catch(() => {})` on lead persistence (`neatcircle-beta/src/lib/lead-intake.ts:180`) and audit logging is a data loss risk. At minimum, these should log the error.

### 5.2 Unhandled `.then()` chains without `.catch()`

Several `useEffect` fetch patterns use `.then().catch()` correctly. No dangling `.then()` without error handling found. ✅

### 5.3 API Route Error Handling

`erie-pro` API routes consistently use try/catch with 500 responses. ✅  
`neatcircle-beta` API routes use try/catch. ✅  
`wt-hybrid` API routes use try/catch. ✅  

### 5.4 Missing Error Handling

- `erie-pro/src/lib/error-tracking.ts:60-65` — Sentry envelope `fetch()` has `.catch(() => {})` — acceptable for error reporting
- `neatcircle-beta/src/lib/trace.ts:234-246` — browser event tracking uses fire-and-forget; acceptable for analytics
- `lead-os-hosted-runtime-wt-hybrid/src/lib/error-reporting.ts:55` — meta-irony: the error reporter silently swallows its own errors

---

## 6. Additional Findings

### 6.1 ESLint Configuration

- `erie-pro` — **No ESLint config file.** No `lint` script in package.json. No linting is configured.
- `neatcircle-beta` — Has `eslint` + `eslint-config-next` in devDeps and a `lint` script. ✅
- `wt-hybrid` — **No ESLint config.** No `lint` script.
- `wt-public` — **No ESLint config.** No `lint` script.

### 6.2 `reactStrictMode`

- `erie-pro` — `reactStrictMode: true` ✅
- `neatcircle-beta` — **not set** (defaults to `false` in Next.js < 15, `true` in 15+) ⚠️
- `wt-hybrid` — `reactStrictMode: true` ✅
- `wt-public` — `reactStrictMode: true` ✅

### 6.3 `Suspense` Usage

Only 2 files use `<Suspense>`: `wt-hybrid/src/app/preferences/page.tsx` and `wt-hybrid/src/app/manage-data/page.tsx`. The rest of the codebase relies on `loading.tsx` files or manual `useState` loading booleans.

### 6.4 Accessibility

- Skip-to-content links: present in all 4 layout files ✅
- ARIA landmarks: present in `erie-pro` and `wt-hybrid` ✅
- No automated accessibility testing ❌

### 6.5 Security Headers

All 4 projects configure security headers (`X-Content-Type-Options`, `X-Frame-Options`, HSTS, `Referrer-Policy`, `Permissions-Policy`). `erie-pro` additionally configures a detailed CSP policy. ✅

### 6.6 Next.js Version Discrepancy

- `erie-pro` — Next.js `^15.5.12`
- `neatcircle-beta` — Next.js `^15.3.3`
- `wt-hybrid` — Next.js **`^16.2.1`**
- `wt-public` — Next.js `^15.5.12`

The hybrid project is on Next.js 16 while others are on 15. This could cause API/behavior inconsistencies.

---

## Prioritized Recommendations

### P0 — Fix Now

1. **Add `error.tsx` and `not-found.tsx` to `neatcircle-beta` and `wt-public`** — unhandled runtime errors currently show a bare white page.
2. **Replace silent `.catch(() => {})` on lead/data persistence calls with at minimum `console.error`** — `neatcircle-beta/src/lib/lead-intake.ts:180` is losing leads silently.
3. **Fix non-null assertions on session email** — `erie-pro/src/app/api/privacy/delete-data/route.ts:61` and `export-data/route.ts:61` will crash if `session.user.email` is null.

### P1 — High Impact

4. **Convert `wt-hybrid` dashboard pages from `"use client"` + `useEffect` fetch to server components** — this is the single biggest architectural improvement possible. Start with `dashboard/leads/page.tsx`, `dashboard/analytics/page.tsx`, `dashboard/tenants/page.tsx`.
5. **Add `next/dynamic` for heavy client components in `neatcircle-beta/src/app/layout.tsx`** — `ChatWidget`, `FunnelOrchestrator`, `ExitIntent`, `BehavioralTracker`, `WhatsAppOptIn` should be `dynamic(() => import(...), { ssr: false })`.
6. **Implement `next/image` for user-facing images** — especially in `erie-pro`'s provider listing pages where Google Places photos are rendered.
7. **Add eviction/TTL to module-level Map stores in `wt-hybrid`** — 40+ Maps with no eviction is a memory leak time bomb. Consider moving to Redis or adding `Map` wrappers with LRU eviction.

### P2 — Important

8. **Add ESLint to `erie-pro`, `wt-hybrid`, and `wt-public`** — use `eslint-config-next` at minimum.
9. **Add component tests** — start with form components (`lead-form.tsx`, `contact-form.tsx`, `login-form.tsx`) using the already-installed `@testing-library/react` in erie-pro.
10. **Remove unused shadcn/ui dependencies from `erie-pro`** — `recharts`, `embla-carousel-react`, `react-resizable-panels`, `input-otp`, `cmdk`, `vaul` are installed but not used in any app page.
11. **Add `loading.tsx` files** for dashboard sub-routes in all projects.
12. **Split `wt-hybrid/src/app/marketplace/page.tsx`** (1,074 lines) into smaller sub-components.

### P3 — Nice to Have

13. Align Next.js versions across all projects (currently 15.x vs 16.x).
14. Add E2E tests with Playwright for critical user flows (lead submission, claim, login).
15. Add Suspense boundaries for data-fetching components.
16. Move `outscraper` to devDependencies in `erie-pro` (only used in scripts).
17. Consider TanStack Query for client-side data fetching where server components aren't feasible.
