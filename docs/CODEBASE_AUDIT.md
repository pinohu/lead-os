# Lead OS — Comprehensive Codebase Audit

**Date:** 2026-04-04
**Scope:** All four primary packages + CI/CD + infrastructure configs
**Auditor:** Automated deep-dive analysis

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [CRITICAL — Immediate Action Required](#critical--immediate-action-required)
4. [HIGH — Fix Before Next Release](#high--fix-before-next-release)
5. [MEDIUM — Scheduled Remediation](#medium--scheduled-remediation)
6. [LOW — Improvements](#low--improvements)
7. [Security Posture](#security-posture)
8. [Test Coverage Analysis](#test-coverage-analysis)
9. [CI/CD Pipeline Assessment](#cicd-pipeline-assessment)
10. [Infrastructure & Deployment](#infrastructure--deployment)
11. [Dependency Health](#dependency-health)
12. [Code Quality](#code-quality)
13. [Positive Findings](#positive-findings)
14. [Remediation Priority Matrix](#remediation-priority-matrix)

---

## Executive Summary

The Lead OS monorepo is a **multi-tenant SaaS platform** with four deployable Next.js applications, ~5,559 files, ~500 API endpoints, and 200 test files. The codebase demonstrates a strong security-first architecture in the hybrid kernel with parameterized SQL, HMAC-signed auth, defense-in-depth middleware, and comprehensive security headers.

However, the audit identified **5 critical**, **8 high**, and **12 medium** severity issues that require attention, including **production secrets committed to git** (Stripe live keys, API tokens), **auth bypass vectors** in the middleware signature chain, and **fail-open cron endpoint guards**.

### Severity Breakdown

| Severity | Count | Scope |
|----------|-------|-------|
| **CRITICAL** | 5 | Secrets exposure, auth bypass, fail-open guards |
| **HIGH** | 8 | CSP weaknesses, CORS gaps, missing session invalidation |
| **MEDIUM** | 12 | In-memory stores, enum types, test gaps |
| **LOW** | 8 | Code duplication, naming inconsistencies |

---

## Architecture Overview

| Package | Framework | Purpose | Routes | Tests |
|---------|-----------|---------|--------|-------|
| `lead-os-hosted-runtime-wt-hybrid` | Next.js 16 | Primary kernel runtime | ~500 | 175 |
| `erie-pro` | Next.js 15 | Territory platform (Prisma) | ~43 | 8 |
| `neatcircle-beta` | Next.js 15 | Edge/marketing (Cloudflare) | ~28 | 6 |
| `lead-os-hosted-runtime-wt-public` | Next.js 15 | Public runtime variant | ~15 | 11 |

**No root `package.json`** — each package is independently managed with npm. The `_n8n_sources/` directory (~3,853 files) contains vendored reference material.

---

## CRITICAL — Immediate Action Required

### C1. Production Secrets Committed to Git

**File:** `neatcircle-beta/.env.local` (committed in `d12e35c`)
**Impact:** Anyone with repository access has live production credentials.

| Exposed Secret | Service | Risk |
|----------------|---------|------|
| `STRIPE_SECRET_KEY` (sk_live_...) | Stripe payments | Direct payment operations |
| `STRIPE_PUBLISHABLE_KEY` (pk_live_...) | Stripe | Token creation |
| `EMAILIT_API_KEY` | Transactional email | Send emails as your domain |
| `TELEGRAM_BOT_TOKEN` | Telegram | Full bot control |
| `AITABLE_API_TOKEN` | Lead tracking | Data access/manipulation |
| `WBIZTOOL_API_KEY` | WhatsApp messaging | Send messages |
| `CALLSCALER_API_KEY` | Phone tracking | Tracking data access |
| `AGENTICFLOW_API_KEY` | AI agent service | Service access |
| `BOOST_SPACE_API_KEY` | Make.com | Automation access |
| `MAKE_API_TOKEN` | Make.com API | Full API access |
| `DISCORD_*_WEBHOOK` (4 URLs) | Discord | Post to channels |
| `SUITEDASH_SECRET_KEY` | CRM | API access |
| `CRON_SECRET` | Internal | Cron endpoint access |

**Remediation:**
1. Rotate ALL listed secrets immediately — they exist in git history permanently
2. `git rm --cached neatcircle-beta/.env.local` and commit
3. Consider using `git filter-branch` or BFG Repo-Cleaner to purge from history
4. Add `.env*` rules to `neatcircle-beta/.gitignore`

Also tracked: `_n8n_sources/Zie619-n8n-workflows/ai-stack/.env` (low risk — contains template defaults only).

### C2. Middleware Signature Verification Mismatch (Auth Bypass)

**Location:** `src/lib/auth-middleware.ts` vs `src/middleware.ts`

The middleware produces raw HMAC hex signatures, but `getAuthFromHeaders()` checks for a `"mw1-"` prefix that is never applied. When the signature header is absent, the guard is skipped entirely, allowing spoofed `x-authenticated-*` headers to be trusted by downstream handlers.

**Remediation:** Align the signature format between middleware.ts and auth-middleware.ts. Add a mandatory signature check in getAuthFromHeaders() that fails-closed when the header is missing.

### C3. Fail-Open Cron Endpoint Guards (Erie Pro)

**Location:** `erie-pro/src/app/api/cron/*/route.ts` (4 of 5 cron routes)

```
const cronSecret = process.env.CRON_SECRET;
if (cronSecret && authHeader !== `Bearer ${cronSecret}`) { ... }
```

When `CRON_SECRET` is not configured, the guard silently passes and anyone can invoke cron jobs (SLA checker, lead archival, cleanup, grace period checks).

**Remediation:** Invert the guard to fail-closed: reject when the secret is absent or doesn't match.

### C4. `/api/setup-admin` Permanently Exposed (Erie Pro)

**Location:** `erie-pro/src/app/api/setup-admin/route.ts`

The admin bootstrap endpoint only checks `if (adminCount > 0)`. While this prevents additional admins after the first, the endpoint remains callable in production, has no rate limiting, and is discoverable. A race condition during initial setup could allow multiple admin accounts.

**Remediation:** Add environment-flag gating (`ALLOW_ADMIN_SETUP=true`), rate limiting, and disable after first successful creation.

### C5. Open CORS When Widget Origins Unconfigured (Hybrid)

**Location:** `src/lib/tenant.ts` — `isAllowedWidgetOrigin()`

When `LEAD_OS_WIDGET_ORIGINS` is empty (the default), the function returns `true` for every origin. This means default deployments have effectively `Access-Control-Allow-Origin: *` on all widget/embed endpoints.

**Remediation:** Default to denying all origins when the env var is empty. Require explicit configuration.

---

## HIGH — Fix Before Next Release

### H1. No Timing-Safe Secret Comparison

**Location:** `operator-auth-core.ts:81`, `middleware.ts:229`

Token signatures and cron secrets compared with `===` instead of `crypto.timingSafeEqual`. Enables timing attacks to brute-force secret values byte-by-byte.

### H2. CSP Uses `unsafe-inline` for Scripts

**Location:** All four Next.js configs and `middleware.ts`

Both `script-src` and `style-src` include `'unsafe-inline'`, which substantially weakens XSS protection. The TODOs acknowledge this needs nonce-based CSP.

### H3. Session-Only In-Memory (Hybrid)

**Location:** `auth-system.ts` — `validateSession()`

Sessions are stored only in memory. On process restart or across multiple instances, sessions are lost. No Postgres fallback exists for session validation.

### H4. In-Memory Login Rate Limiter Ineffective in Serverless (Erie Pro)

**Location:** `erie-pro/src/lib/auth.ts`

Uses an in-memory `Map` for login rate limiting. On Vercel serverless, each cold start gets a fresh Map, allowing brute-force by distributing requests across instances.

### H5. Webhook Secrets Stored in Plaintext (Erie Pro)

**Location:** Prisma schema — `WebhookEndpoint.secret`

Webhook signing secrets stored as plain `String`. Should be hashed or encrypted at rest.

### H6. No Session Invalidation After Password Change (Erie Pro)

**Location:** `/api/auth/reset-password`

Password changes don't invalidate existing JWT sessions. Compromised tokens remain valid until natural expiry.

### H7. SSRF via Scrape Endpoints (Hybrid)

**Location:** `src/app/api/scrape/url/route.ts`, `scrape/batch/route.ts`

User-supplied URLs passed to scraper without scheme/IP validation. An attacker could target internal services (169.254.169.254 metadata, localhost services).

### H8. Wildcard CORS on Lead Ingestion (Erie Pro)

**Location:** `src/app/api/leads/inbound/route.ts`, `embed/submit/route.ts`

Both set `Access-Control-Allow-Origin: *`. While API-key-protected, this allows any webpage to make cross-origin requests.

---

## MEDIUM — Scheduled Remediation

### M1. `.gitignore` Missing `.env` Rules in 3 of 4 Packages

| Package | `.env` excluded | `.env.local` excluded |
|---------|-----------------|----------------------|
| `lead-os-hosted-runtime-wt-hybrid` | NO | NO |
| `lead-os-hosted-runtime-wt-public` | NO | NO |
| `neatcircle-beta` | NO | NO |
| `erie-pro` | Yes | Yes |

The root `.gitignore` lists `.env` and `.env.local` but this doesn't protect files already committed.

### M2. In-Memory Rate Limiter (Hybrid)

**Location:** `src/lib/rate-limiter.ts`

Rate limiting uses in-memory stores with no distributed backing (Redis/Postgres). Ineffective in multi-instance deployments.

### M3. API Key Hash Uses Unsalted SHA-256 (Hybrid)

**Location:** `auth-system.ts`

API keys hashed with SHA-256 without a salt. A rainbow table attack is feasible since API keys follow a known prefix format (`los_*`).

### M4. CORS Allow-Methods Missing DELETE/PUT/PATCH (Hybrid)

**Location:** `src/lib/cors.ts`

The CORS configuration only allows `GET, POST, OPTIONS`. Legitimate API calls using DELETE, PUT, or PATCH may fail on cross-origin requests.

### M5. Database Enums Stored as Freetext Strings (Erie Pro)

| Field | Current | Should Be |
|-------|---------|-----------|
| `User.role` | `String` | `enum UserRole { PROVIDER ADMIN }` |
| `Provider.billingInterval` | `String` | `enum BillingInterval { MONTHLY ANNUAL }` |
| `LeadDispute.reason` | `String` | enum |
| `ContactMessage.status` | `String` | enum |

Direct database insertions can bypass Zod validation.

### M6. No CSRF Protection on State-Mutating Endpoints (Erie Pro)

None of the POST endpoints implement CSRF tokens. The `form-action 'self'` CSP helps but is incomplete.

### M7. `CRON_SECRET` Not in env Validation (Erie Pro)

Referenced in cron endpoints but not documented in `.env.example` or validated in `src/lib/env.ts`.

### M8. Minimal Password Policy (Erie Pro)

Only enforces `min(8)`. No complexity requirements, no breach-database checking per NIST 800-63B.

### M9. Public Runtime Test Script Uses Windows Syntax

**Location:** `lead-os-hosted-runtime-wt-public/package.json`

```json
"test": "set LEAD_OS_USE_AITABLE_PERSISTENCE=false&& set ..."
```

Uses Windows `set` syntax instead of `cross-env`. Will fail on Linux/macOS CI environments.

### M10. SQL Limit Interpolated (Hybrid)

**Location:** `context-engine.ts:289`

A `LIMIT` value is string-interpolated into SQL rather than parameterized. While it's coerced to a number, parameterization is the safer pattern.

### M11. Hardcoded Fallback Secrets (Hybrid)

4 files fall back to `"unsubscribe-token-secret"` when env secrets are unset:
- `cron/nurture/route.ts`
- `unsubscribe/route.ts`
- `email/send/route.ts`
- `notification-hub.ts`

Enables forging unsubscribe tokens.

### M12. Health Endpoint Exposes Internal State (Erie Pro)

`/api/health` returns `process.uptime()`, database latency, and email service configuration. Should be behind auth or return minimal info to unauthenticated requests.

---

## LOW — Improvements

| # | Finding | Package |
|---|---------|---------|
| L1 | Duplicated CORS helper functions across routes | Erie Pro |
| L2 | Inconsistent error logging (logger vs console.error) | Erie Pro |
| L3 | Audit log action names overloaded (`admin.action` for multiple operations) | Erie Pro |
| L4 | Stripe webhook handler is ~483 lines, should be decomposed | Erie Pro |
| L5 | `next-auth@5.0.0-beta.30` — beta dependency in production | Erie Pro |
| L6 | Hardcoded physical address `"123 State St"` in email template (CAN-SPAM) | Erie Pro |
| L7 | `setup/configure` route has no in-handler auth guard | Hybrid |
| L8 | Missing `reactStrictMode: true` in hybrid and public runtime configs | Hybrid, Public |

---

## Security Posture

### Strengths

- **SQL Injection:** All queries use parameterized statements (`$1`, `$2`, …). Zero raw concatenation found.
- **Auth Architecture:** HMAC-signed middleware with request identity forwarding. API keys hashed before storage.
- **Security Headers:** HSTS (2-year max-age + preload), X-Content-Type-Options, X-Frame-Options DENY, Referrer-Policy, Permissions-Policy.
- **Rate Limiting:** Per-IP limiters on auth, intake, and scoring endpoints with configurable windows.
- **Input Validation:** Zod schemas on all public API inputs with HTML sanitization.
- **Password Handling:** bcrypt with 12 rounds (Erie Pro). Passwordless magic links (Hybrid).
- **TCPA Compliance:** Consent tracking with IP address and timestamp.
- **Stripe Webhooks:** Signature verification with `crypto.timingSafeEqual` in Erie Pro.
- **Anti-Enumeration:** Forgot-password always returns 200 regardless of email existence.

### Weaknesses

- CSP `unsafe-inline` on all packages
- In-memory session/rate-limit stores (not distributed)
- No CSRF tokens
- Middleware signature chain has a mismatch
- Default CORS is too permissive

---

## Test Coverage Analysis

### By Package

| Package | Test Files | API Routes | Lib Files | Route Coverage | Lib Coverage | Grade |
|---------|-----------|------------|-----------|----------------|--------------|-------|
| Hybrid kernel | 175 | ~500 | 172 | 0% (HTTP) | ~102% | **A-** |
| Erie Pro | 8 | 43 | 33 | 0% | ~24% | **D** |
| NeatCircle | 6 | 28 | 20 | 0% | ~30% | **D+** |
| Public runtime | 11 | ~15 | 22 | 0% | ~50% | **C+** |

### Test Categories

| Category | Hybrid | Erie Pro | NeatCircle | Public |
|----------|--------|----------|------------|--------|
| Unit tests | Strong | Minimal | Minimal | Moderate |
| Integration (module) | Present | None | None | None |
| HTTP endpoint tests | None | None | None | None |
| E2E (Playwright/Cypress) | None | None | None | None |
| Component/UI tests | None | None | None | None |
| Database integration | None | None | None | None |
| Stress/concurrency | Present | None | None | None |
| Security-focused | Present | None | Present | None |

### Hybrid Kernel Test Quality (Strong)
- Well-structured with `node:test` + `node:assert/strict`
- Tests SQL injection in tenant IDs, UUID validation, boundary enforcement
- Multi-tenant stress test: 50 concurrent tenants across 10 dimensions
- Auth flow testing: magic links, token validation, open-redirect prevention
- Shared test helpers for store reset and env-var isolation

### Key Gaps
1. **Zero HTTP-level API endpoint tests** across all packages
2. **Zero database integration tests** (all use in-memory stubs)
3. **Zero component/UI tests** in any package
4. **Erie Pro is severely undertested** (8 tests for 43 API routes + auth + Stripe)
5. **No E2E test framework** configured anywhere

---

## CI/CD Pipeline Assessment

### Current Pipeline (`.github/workflows/ci.yml`)

| Job | Package | Runs |
|-----|---------|------|
| `typecheck` | Hybrid kernel | `npx tsc --noEmit` |
| `test` | Hybrid kernel | `npm run test:ci` |
| `build-hybrid` | Hybrid kernel | `npm run build` |
| `build-edge` | NeatCircle | `npm run build` |

### Gaps

1. **Erie Pro is not tested or built in CI** — The largest app after Hybrid has zero CI coverage
2. **Public runtime not in CI** — No typecheck, test, or build job
3. **No lint step** — ESLint not configured or run in any CI job
4. **No security scanning** — No `npm audit`, Snyk, CodeQL, or dependency scanning
5. **No coverage reporting** — No test coverage threshold enforcement
6. **No deployment pipeline** — Only build verification, no staging/prod deploy
7. **No E2E tests in CI** — No Playwright/Cypress
8. **No performance checks** — No Lighthouse CI or bundle size tracking
9. **Action versions pinned to SHA** (good practice), Node 22 (current LTS)
10. **Concurrency control** present with `cancel-in-progress: true` (good)

---

## Infrastructure & Deployment

### Docker (Hybrid Kernel) — Well Done

- Multi-stage build (deps → builder → runner)
- Non-root user (`nextjs:nodejs` UID/GID 1001)
- `standalone` output mode for minimal image
- Health check configured on `/api/health`
- Telemetry disabled
- Alpine base for small image size
- Target: <200MB

### Vercel (Hybrid)
- Region: `iad1` (US East)
- Standard Next.js framework detection
- Missing: No `rewrites`, `redirects`, or environment variable configuration

### Cloudflare (NeatCircle)
- OpenNext adapter for Cloudflare Workers
- Wrangler deployment configured

### Railway (Public Runtime)
- `railway.json` present

### Missing
- No `docker-compose.yml` for local development with Postgres + Redis
- No Kubernetes manifests or Helm charts
- No infrastructure-as-code (Terraform/Pulumi)

---

## Dependency Health

### Version Currency

| Dependency | Hybrid | Erie Pro | NeatCircle | Notes |
|-----------|--------|----------|------------|-------|
| Next.js | 16.2.1 | 15.5.12 | 15.3.3 | Hybrid on latest; others 1 major behind |
| React | 19.1.0 | 19.1.0 | 19.1.0 | Consistent |
| TypeScript | 5.9.3 | 5.9.3 | 5.9.3 | Consistent, current |
| Zod | 4.3.6 | 4.3.6 | — | Zod 4 is very new (2025); less battle-tested than Zod 3 |
| Stripe | 21.0.1 | 21.0.1 | — | Current |
| Prisma | — | 7.6.0 | — | Current major |
| next-auth | — | 5.0.0-beta.30 | — | **Beta** in production |
| pg | 8.20.0 | 8.20.0 | — | Current |

### Concerns

1. **`next-auth@5.0.0-beta.30`** — Pre-release software handling authentication. Monitor for CVEs.
2. **Zod 4** — Released 2025, may have undiscovered issues vs battle-tested Zod 3.
3. **No `npm audit`** in CI — Vulnerability scanning not automated.
4. **No lockfile integrity check** — `npm ci --frozen-lockfile` flag used (good), but no lockfile hash verification.

### Missing Development Dependencies (Hybrid)
- No ESLint
- No Prettier/Biome
- No lint-staged or husky for pre-commit hooks

---

## Code Quality

### TypeScript Configuration

| Setting | Hybrid | Erie Pro | NeatCircle |
|---------|--------|----------|------------|
| `strict` | true | true | (default) |
| `target` | ES2022 | ES2017 | (default) |
| `allowJs` | false | true | (default) |
| `noUncheckedIndexedAccess` | missing | missing | missing |
| `noImplicitReturns` | missing | missing | missing |
| `noFallthroughCasesInSwitch` | missing | missing | missing |

Recommendations:
- Enable `noUncheckedIndexedAccess` in all packages
- Enable `noImplicitReturns` and `noFallthroughCasesInSwitch`
- Erie Pro should set `target` to at least ES2020 (ES2017 is conservative)

### Code Organization

**Hybrid kernel** — Well-structured:
- `src/app/` (pages + API routes)
- `src/lib/` (domain logic + integrations)
- `src/cli/` (CLI interface)
- `src/mcp/` (MCP server)
- `tests/` (comprehensive test suite)

**Erie Pro** — Standard Next.js:
- `src/app/`, `src/components/`, `src/lib/`
- Prisma for database
- Good separation of concerns

**NeatCircle** — Minimal but clean:
- Cloudflare-optimized
- Generated clients pattern

---

## Positive Findings

These practices are exemplary and should be maintained:

1. **Parameterized SQL everywhere** — Zero raw SQL concatenation across the entire codebase
2. **HMAC-signed auth tokens** — Magic links with 15-minute expiry, no stored passwords in hybrid
3. **Multi-stage Dockerfile** — Non-root user, standalone output, health checks, <200MB target
4. **Security headers** — HSTS with preload, frame-ancestors none, strict referrer, permissions policy
5. **Middleware-first auth** — All API routes require auth by default; public routes are explicitly allowlisted
6. **Zod validation** — Comprehensive input validation with field-length limits on all public endpoints
7. **Rate limiting** — Per-IP limiters on auth, intake, scoring with configurable windows
8. **Multi-tenant stress testing** — 50 concurrent tenants tested across 10 dimensions
9. **Pinned CI action SHAs** — Supply-chain attack protection in GitHub Actions
10. **`poweredByHeader: false`** — Server fingerprinting disabled on all packages
11. **Anti-enumeration patterns** — Forgot-password always returns 200
12. **TCPA compliance** — Consent tracking with IP and timestamp
13. **Stripe webhook signature verification** — Using crypto.timingSafeEqual (Erie Pro)
14. **Pool configuration** — Postgres connection pool with timeouts and size caps
15. **SSL enforcement** — Database connections require SSL

---

## Remediation Priority Matrix

### Immediate (This Sprint)

| # | Issue | Effort | Risk if Unresolved |
|---|-------|--------|--------------------|
| C1 | Rotate compromised secrets, remove `.env.local` from git | Low | Active credential exposure |
| C2 | Fix middleware signature verification chain | Medium | Auth bypass |
| C3 | Fix fail-open cron guards in Erie Pro | Low | Unauthorized cron execution |
| M1 | Add `.env` rules to all `.gitignore` files | Low | Future secret commits |

### Next Release

| # | Issue | Effort | Risk if Unresolved |
|---|-------|--------|--------------------|
| C4 | Gate `/api/setup-admin` with env flag | Low | Admin account injection |
| C5 | Default-deny empty widget origins | Low | Open CORS |
| H1 | Use timing-safe comparison for all secrets | Low | Timing attacks |
| H5 | Hash webhook secrets at rest | Medium | Secret exposure on DB breach |
| H6 | Invalidate sessions on password change | Medium | Compromised session persistence |
| H7 | Validate URLs in scrape endpoints (SSRF) | Medium | Internal service access |

### Scheduled

| # | Issue | Effort | Risk if Unresolved |
|---|-------|--------|--------------------|
| H2 | Implement nonce-based CSP | High | XSS weakness |
| H3 | Add Postgres-backed session store | High | Session loss on restart |
| H4 | Distributed rate limiting | High | Brute-force in serverless |
| M5 | Convert freetext strings to Prisma enums | Medium | Data integrity |
| M9 | Fix Windows-only test script (public runtime) | Low | Tests fail on CI |
| M11 | Remove hardcoded fallback secrets | Low | Token forgery |

### Backlog

| # | Issue | Effort | Risk if Unresolved |
|---|-------|--------|--------------------|
| — | Add Erie Pro to CI pipeline | Medium | Undetected regressions |
| — | Add HTTP-level API endpoint tests | High | Integration gaps |
| — | Add E2E test framework (Playwright) | High | No user-flow verification |
| — | Add ESLint to all packages | Medium | Code quality drift |
| — | Enable stricter TypeScript options | Low | Runtime type errors |
| — | Add `npm audit` to CI | Low | Undetected vulnerabilities |
| — | Add coverage thresholds to CI | Low | Coverage regression |
| — | Decompose Stripe webhook handler | Low | Maintainability |

---

## Appendix: Files Reviewed

### Configuration Files
- `.github/workflows/ci.yml`
- `lead-os-hosted-runtime-wt-hybrid/package.json`, `tsconfig.json`, `next.config.mjs`, `vercel.json`, `Dockerfile`, `.env.example`, `.gitignore`
- `erie-pro/package.json`, `tsconfig.json`, `next.config.ts`, `.gitignore`
- `neatcircle-beta/package.json`, `next.config.ts`, `.gitignore`, `.env.local`
- `lead-os-hosted-runtime-wt-public/package.json`, `.gitignore`
- `.gitignore` (root)
- `.github/pull_request_template.md`

### Source Files (Sampled)
- `lead-os-hosted-runtime-wt-hybrid/src/middleware.ts`
- `lead-os-hosted-runtime-wt-hybrid/src/lib/auth-system.ts`
- `lead-os-hosted-runtime-wt-hybrid/src/lib/operator-auth.ts`
- `lead-os-hosted-runtime-wt-hybrid/src/lib/cors.ts`
- `lead-os-hosted-runtime-wt-hybrid/src/lib/rate-limiter.ts`
- `lead-os-hosted-runtime-wt-hybrid/src/lib/tenant.ts`
- `lead-os-hosted-runtime-wt-hybrid/src/lib/db.ts`
- 10+ API route files across hybrid and Erie Pro
- Erie Pro Prisma schema, auth config, middleware
- Representative test files across all packages
