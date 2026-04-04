# Comprehensive Repository Audit Report

**Repository:** `pinohu/immigration-smarts` (aka CX React / Lead OS)
**Date:** 2026-04-04
**Scope:** All 4 main applications + supporting directories

---

## Executive Summary

This monorepo contains 4 Next.js applications (a kernel platform, territory layer, marketing edge layer, and public embed runtime), with supporting automation scripts and vendored n8n references. The codebase demonstrates strong TypeScript discipline and thoughtful architecture, but has **critical security issues** that require immediate attention, along with significant gaps in testing, performance optimization, and dependency hygiene.

| Severity | Count |
|----------|-------|
| CRITICAL | 5 |
| HIGH | 11 |
| MEDIUM | 10 |
| LOW | 6 |

---

## 1. SECURITY

### CRITICAL

#### S1. Hardcoded Production Secrets in Git History

**Files:**
- `make-scenarios/deploy-advanced-scenarios.mjs`
- `make-scenarios/nurture-engine.mjs`
- `make-scenarios/deploy-referral-engine.mjs`
- `make-scenarios/deploy-niche-intelligence.mjs`
- `make-scenarios/deploy-event-scenarios.mjs`

**Exposed credentials:**
- Telegram bot token: `8739229269:AAGYs6jIIjDa87y4TAVwn4QtTWBqliohDQI`
- Emailit API key: `secret_4lQqUaweMC1pmyCpwqdRy3ktjl9hzd6m`
- AITable token: `usk8wYBrRgsc6RHxkZP9VAN`
- WBizTool API key: `54140a11389a13031a2eb19070ce35c5ce769a30`
- Make.com API token: `24595d5e-9b7f-48f9-ab61-9644c46ed7f9`
- 4 Discord webhook URLs with full tokens
- Telegram chat IDs

**Remediation:** Rotate ALL exposed credentials immediately. Move to environment variables. Use `git filter-repo` or BFG Repo-Cleaner to purge secrets from git history.

#### S2. Tracked `.env` File with Default Credentials

**File:** `_n8n_sources/Zie619-n8n-workflows/ai-stack/.env`

Contains `N8N_BASIC_AUTH_USER=admin` / `N8N_BASIC_AUTH_PASSWORD=changeme`. This file is tracked by git despite `.gitignore` containing `.env` (pattern doesn't match nested paths by default).

**Remediation:** Add `**/.env` to `.gitignore`. Remove the tracked file with `git rm --cached`.

### HIGH

#### S3. Auth Bypass via Trivially Spoofable Headers

**File:** `neatcircle-beta/middleware.ts:101-108`

Two static headers (`x-lead-os-internal-smoke: 1` + `x-lead-os-dry-run: 1`) grant **unauthenticated access** to all `/api/automations/*` routes. Any attacker who discovers these header names can bypass authentication entirely.

```typescript
const internalSmokeRequest =
  request.headers.get("x-lead-os-internal-smoke") === "1" &&
  request.headers.get("x-lead-os-dry-run") === "1";

if (internalSmokeRequest) {
  return allow(request);  // No further auth check
}
```

**Remediation:** Remove the header-based bypass. Use a proper shared secret or restrict to localhost only.

#### S4. Erie Pro Admin Routes Lack Middleware Auth

Erie Pro's middleware does not cover `/api/admin/*` routes. Auth is handled ad-hoc inside individual route handlers, which is error-prone and inconsistent.

**Remediation:** Add explicit middleware matchers for admin routes.

#### S5. In-Memory Rate Limiting (All Apps)

Rate limiting resets on every cold start in serverless environments (Vercel, Cloudflare Workers). This makes rate limits trivially bypassable.

**Remediation:** Use Redis-backed or edge-native rate limiting (Upstash, Cloudflare Rate Limiting).

#### S6. Weak Password Policy

8-character minimum with no complexity requirements.

**Remediation:** Enforce minimum 12 characters with complexity rules, or adopt passkey/SSO.

### MEDIUM

#### S7. Missing Security Headers (2 of 4 Apps)

`neatcircle-beta` and `lead-os-hosted-runtime-wt-public` have **no security headers** configured (no `X-Content-Type-Options`, `X-Frame-Options`, HSTS, CSP, or `Permissions-Policy`). Only `lead-os-hosted-runtime-wt-hybrid` and `erie-pro` set these.

**Remediation:** Add security headers via `next.config` or middleware in both apps.

#### S8. CSP Uses `unsafe-inline` for Scripts

Both `erie-pro` and `lead-os-hosted-runtime-wt-hybrid` use `'unsafe-inline'` in their Content Security Policy for scripts, weakening XSS protections. There are even TODO comments in hybrid's middleware acknowledging this.

**Remediation:** Migrate to nonce-based CSP.

#### S9. Open CORS on Embed Endpoint

When `EMBED_ALLOWED_ORIGINS` is not set, the embed endpoint accepts requests from any origin.

**Remediation:** Fail closed — reject cross-origin requests when no allowlist is configured.

---

## 2. DEPENDENCIES

### CRITICAL

#### D1. Beta Authentication Package in Production

**File:** `erie-pro/package.json`

`next-auth@5.0.0-beta.30` is a beta prerelease used in a production-facing app. Beta APIs may change without notice and may have unpatched security issues.

**Remediation:** Pin to the latest stable NextAuth release, or document the risk and monitor closely.

### HIGH

#### D2. 11 Known Vulnerabilities in neatcircle-beta

`npm audit` reports 8 high and 3 moderate vulnerabilities, primarily from the `wrangler`/`miniflare`/`undici` dependency chain. All are fixable via `npm audit fix`.

**Remediation:** Run `npm audit fix` in `neatcircle-beta/`.

#### D3. Next.js HTTP Smuggling Vulnerability (Public Runtime)

`lead-os-hosted-runtime-wt-public` uses a Next.js version with a known HTTP smuggling + disk cache vulnerability. Fixed in Next.js >= 15.5.14.

**Remediation:** Bump Next.js to >= 15.5.14.

#### D4. Major Version Fragmentation

| Package | hybrid | erie-pro | neatcircle | public |
|---------|--------|----------|------------|--------|
| Next.js | 16 | 15 | 15 | 15 |
| Tailwind | 3 | 3 | 4 | — |
| React | 19 | 19 | 19 | 19 |

Running Next.js across a major version boundary creates maintenance risk — features, APIs, and security patches differ.

### MEDIUM

#### D5. Missing `engines.node` in 3 of 4 Apps

Only `lead-os-hosted-runtime-wt-hybrid` declares `"engines": { "node": ">=22.0.0" }`. The other 3 apps silently require Node 22+ but don't enforce it.

**Remediation:** Add `engines` field to all `package.json` files.

#### D6. Lockfile Drift in neatcircle-beta

`neatcircle-beta/package-lock.json` has uncommitted modifications (visible in `git status`). This causes CI builds to use different dependency versions than development.

**Remediation:** Commit the lockfile after `npm install`, or regenerate with `npm ci`.

#### D7. Vendored `_n8n_sources/` with No Update Mechanism

The `_n8n_sources/` directory contains copied third-party code with no automated update or dependency scanning. One project (`growchief`) pins `engines.node` to 20.x only, conflicting with the workspace's Node 22 requirement.

---

## 3. CODE QUALITY

### HIGH

#### C1. Massive Code Duplication Between Hybrid and Public Runtime

21 library files are duplicated between `lead-os-hosted-runtime-wt-hybrid/src/lib/` and `lead-os-hosted-runtime-wt-public/src/lib/`:
- **10 files** are 100% identical (~1,200+ lines of wasted code)
- **6 files** have drifted — they share the same origin but have diverged, creating maintenance risk and potential behavioral inconsistencies

**Key duplicated files:** `runtime-store.ts`, `intake.ts`, `scoring-engine.ts`, `orchestration.ts`, `persistent-store.ts`

**Remediation:** Extract a shared `@lead-os/core` package or use a workspace-level shared directory.

#### C2. All Dashboard Pages Are Client Components

All 21+ pages under `lead-os-hosted-runtime-wt-hybrid/src/app/dashboard/` are `"use client"` components that fetch data via `useEffect` + `fetch`. This is a Next.js anti-pattern — these could be server components with streaming, reducing bundle size and improving initial load performance.

**Remediation:** Convert dashboard pages to server components using `async` data fetching. Keep interactive portions as small client sub-components.

#### C3. 48+ Silent Error Swallowing

Found `.catch(() => {})` in 48+ locations across hybrid, neatcircle, and erie-pro. Errors are silently discarded, making debugging production issues extremely difficult.

**Key offenders:**
- `erie-pro/src/app/api/embed/submit/route.ts` (3 instances)
- `erie-pro/src/app/api/leads/inbound/route.ts` (3 instances)
- `neatcircle-beta/src/lib/lead-intake.ts` (3 instances)
- `lead-os-hosted-runtime-wt-hybrid/src/lib/execution-engine.ts` (3 instances)

**Remediation:** Replace with proper error logging. At minimum: `.catch((err) => console.error("context:", err))`.

#### C4. 1,181-Line Component File

`lead-os-hosted-runtime-wt-hybrid/src/app/DynastyLandingPage.tsx` is 1,181 lines — far too large for a single component. This harms readability, testability, and reuse.

**Remediation:** Split into smaller, focused sub-components.

### MEDIUM

#### C5. Index-Based Keys in 28+ List Renders

Using `key={index}` in list renders causes React reconciliation issues when items are added, removed, or reordered.

**Remediation:** Use stable unique identifiers for keys.

#### C6. Inconsistent File Naming

The hybrid app mixes `PascalCase` (`DashboardSidebar.tsx`) and `kebab-case` (`scoring-engine.ts`) component files in the same directory.

**Remediation:** Standardize on one convention (kebab-case is the Next.js convention).

#### C7. 41 Deep Relative Imports

The hybrid app has 41+ imports with 3-5 levels of `../` despite having `@/` path alias configured in `tsconfig.json`.

**Remediation:** Replace deep relative imports with `@/` aliases.

### LOW

#### C8. TypeScript Strict Mode — Excellent

All 4 apps have `strict: true` in `tsconfig.json`. Zero `any` types, zero `@ts-ignore`, zero `@ts-nocheck` found across the codebase. This is exemplary.

#### C9. Console.log Usage — Acceptable

Console statements are minimal and mostly appropriate. Erie-pro's ~158 instances are concentrated in CLI scripts, not production routes.

---

## 4. DATABASE & DATA

### CRITICAL

#### DB1. SQL Identifier Interpolation in PersistentStore

**File:** `lead-os-hosted-runtime-wt-hybrid/src/lib/persistent-store.ts:78-101`

Table names, column names, and tenant columns are interpolated directly into SQL strings:
```typescript
`SELECT ${this.keyCol}, ${this.valueCol} FROM ${this.tableName} WHERE ${this.tenantCol} = $1`
```

While currently safe (all callers use hardcoded strings), this violates defense-in-depth. If any future caller passes user input, it becomes a SQL injection vector.

**Remediation:** Use a whitelist of allowed identifiers, or use `pg-format` for identifier quoting.

#### DB2. No Connection Timeouts in Public Runtime Pool

**File:** `lead-os-hosted-runtime-wt-public/src/lib/runtime-store.ts:177-181`

The connection pool has `max: 4` but no `connectionTimeoutMillis`, `idleTimeoutMillis`, or `statement_timeout`. A single slow query can exhaust all connections and hang the entire application.

**Remediation:** Add timeout configuration:
```typescript
const pool = new Pool({
  max: 4,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  statement_timeout: 10000,
});
```

### HIGH

#### DB3. Webhook Secrets Stored in Plaintext

- **Erie Pro:** `schema.prisma:545` — `WebhookEndpoint.secret` stored as plain `String`
- **Hybrid:** `003_additional_tables.sql:505` — webhook secrets in plaintext column

**Remediation:** Encrypt webhook secrets at rest. Use application-level encryption with a KMS-managed key.

#### DB4. Missing Cascade Deletes in Erie Pro

`ApiKey` and `WebhookEndpoint` models in erie-pro's Prisma schema are **missing `onDelete: Cascade`** on their `Provider` relation. Deleting a provider will fail with foreign key constraint violations.

**Remediation:** Add `onDelete: Cascade` to child relations.

#### DB5. Missing Database Indexes

Erie Pro Prisma schema is missing indexes on frequently queried columns:
- `Lead.email` (used in uniqueness checks and lookups)
- `Lead.createdAt` (used in sorting and pagination)
- `User.providerId` (used in auth lookups)

**Remediation:** Add `@@index` declarations in the Prisma schema.

#### DB6. Event Insertion Performance Regression (Public Runtime)

`lead-os-hosted-runtime-wt-public/src/lib/runtime-store.ts:546-555` — `appendEvents()` inserts events one-by-one in a loop, while the hybrid version batches into a single multi-row INSERT. This is an O(n) network round-trip penalty.

**Remediation:** Port the batch insert from hybrid to public runtime.

### MEDIUM

#### DB7. Non-Idempotent Migration Statements

`lead-os-hosted-runtime-wt-hybrid/db/migrations/004_enterprise_upgrade.sql` uses `CREATE INDEX` without `IF NOT EXISTS`, which will fail if run twice.

`002_multi_tenant.sql` is also missing idempotency guards.

**Remediation:** Use `CREATE INDEX IF NOT EXISTS` and `CREATE TABLE IF NOT EXISTS` consistently.

---

## 5. TESTING

### HIGH

#### T1. Zero End-to-End / Integration Tests

No Playwright, Cypress, or browser-based tests exist anywhere in the monorepo. All testing is unit/library-level.

**Test file counts:**
| App | Test Files |
|-----|-----------|
| hybrid | 175 |
| erie-pro | 8 |
| neatcircle-beta | 6 |
| public | 11 |

While hybrid has solid library test coverage, there are **zero UI/component tests** across all 4 apps.

**Remediation:** Add Playwright E2E tests for critical user flows (auth, lead intake, dashboard). Add component tests for shared UI.

#### T2. CI Pipeline Only Covers 3 of 4 Apps

**File:** `.github/workflows/ci.yml`

The CI pipeline includes typecheck, test, and build for hybrid and erie-pro, but for neatcircle-beta only has a build step (no typecheck, no tests). `lead-os-hosted-runtime-wt-public` is **completely absent** from CI.

**Remediation:** Add test and typecheck jobs for all 4 apps.

#### T3. Security Audit in CI Uses `|| true`

```yaml
run: npm audit --audit-level=critical || true
```

The `|| true` suffix means the security audit **never fails the build**, even with critical vulnerabilities. This makes it purely informational.

**Remediation:** Remove `|| true` at least for critical-level audits, or use a dedicated tool like Snyk/Socket that can be configured with proper thresholds.

### MEDIUM

#### T4. Erie Pro Tests Are Library-Only

Erie Pro's 8 test files only cover library utilities. No API route tests, no middleware tests, no component tests.

---

## 6. PERFORMANCE

### HIGH

#### P1. Zero Usage of `next/image`

Searched all `.tsx` files across all 4 apps: **zero imports of `next/image`**. All images use raw `<img>` tags, missing out on:
- Automatic WebP/AVIF conversion
- Responsive `srcSet` generation
- Lazy loading
- Layout shift prevention (CLS)

**Remediation:** Replace `<img>` with `next/image` throughout.

#### P2. No Caching Strategy

3 of 4 apps have **no caching layer** — no `unstable_cache`, no Redis caching, no ISR (Incremental Static Regeneration). Every page request hits the origin/database.

**Remediation:** Implement ISR for marketing pages, Redis/unstable_cache for API responses, and proper `Cache-Control` headers.

### MEDIUM

#### P3. Dashboard Fetching Pattern (Waterfall)

Dashboard pages use `useEffect` → `fetch` → `setState`, creating client-side waterfalls. Combined with `"use client"`, this means:
1. User downloads JavaScript bundle
2. React hydrates
3. `useEffect` fires
4. Fetch begins
5. Data arrives
6. Content renders

With server components: steps 1-4 are eliminated.

#### P4. Missing Dynamic Imports for Heavy Components

Large dashboard components are statically imported. Components like charts, rich text editors, and data tables should use `next/dynamic` to reduce initial bundle size.

---

## 7. ARCHITECTURE

### MEDIUM

#### A1. No Shared Package Strategy

The 4 apps share significant code (types, utilities, validation schemas) but there is no workspace/package mechanism. Code is either duplicated or missing from apps that need it.

**Remediation:** Adopt npm/pnpm workspaces with a `packages/shared` directory.

#### A2. `_n8n_sources/` Inflates Repository

The `_n8n_sources/` directory contains ~10,000+ files of vendored third-party code. This bloats the repository, slows clones, and creates confusion about what is "the product" vs. reference material.

**Remediation:** Move to a separate repository or git submodule. If kept, add a clear README and exclude from CI/linting.

---

## Prioritized Action Plan

### Immediate (This Week)

1. **Rotate all exposed credentials** (S1) — Telegram, Emailit, AITable, WBizTool, Make.com, Discord webhooks
2. **Purge secrets from git history** using BFG Repo-Cleaner
3. **Remove auth bypass headers** in neatcircle middleware (S3)
4. **Fix `.gitignore`** to use `**/.env` and remove tracked `.env` file (S2)
5. **Run `npm audit fix`** in neatcircle-beta (D2)
6. **Bump Next.js** in public runtime to fix HTTP smuggling (D3)

### Short-Term (Next 2-4 Sprints)

7. Add security headers to neatcircle and public runtime (S7)
8. Add connection timeouts to public runtime DB pool (DB2)
9. Extract shared package from duplicated hybrid/public code (C1)
10. Add missing Prisma indexes (DB5) and cascade deletes (DB4)
11. Expand CI to cover all 4 apps with tests (T2)
12. Adopt `next/image` across all apps (P1)

### Medium-Term

13. Convert dashboard pages to server components (C2)
14. Add Playwright E2E tests for critical flows (T1)
15. Implement proper rate limiting with Redis (S5)
16. Add caching layer (P2)
17. Migrate to nonce-based CSP (S8)
18. Encrypt webhook secrets at rest (DB3)
19. Evaluate NextAuth stable release for erie-pro (D1)
20. Implement shared package/workspace strategy (A1)

---

## Positive Findings

The codebase has several strengths worth acknowledging:

- **TypeScript discipline is excellent** — strict mode everywhere, zero `any`, zero `@ts-ignore`
- **Parameterized SQL** throughout (with the `PersistentStore` exception noted)
- **Secure session cookies** with proper flags
- **bcrypt password hashing** with appropriate cost factor
- **Timing-safe comparisons** for token validation
- **Anti-enumeration** on password reset flows
- **Comprehensive middleware auth** in the hybrid kernel
- **Well-structured Prisma schema** with good use of enums and relations
- **Standalone Docker build** with non-root user and health checks
- **Security-conscious response headers** in hybrid and erie-pro
- **Pinned GitHub Actions** using commit SHAs (not tags)
- **Good CI concurrency** configuration with cancel-in-progress
