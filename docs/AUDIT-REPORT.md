# Lead OS (manifest-iq) — Comprehensive Code Audit

**Date:** 2026-04-04
**Scope:** Full monorepo audit — all sub-projects, configurations, dependencies, security, and architecture
**Auditor:** Automated deep audit

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Repository Overview](#repository-overview)
3. [Critical Findings](#critical-findings)
4. [Security Audit](#security-audit)
5. [Dependency Audit](#dependency-audit)
6. [Architecture & Code Quality](#architecture--code-quality)
7. [Configuration Audit](#configuration-audit)
8. [CI/CD & DevOps](#cicd--devops)
9. [Performance Observations](#performance-observations)
10. [Recommendations](#recommendations)

---

## Executive Summary

The Lead OS monorepo contains **5 sub-projects** spanning Next.js 15–16 applications, automation tooling, and vendored third-party sources. The codebase demonstrates solid architectural patterns (Zod validation, structured logging, middleware-based auth) but has **critical security issues** that require immediate attention — most notably **live production secrets committed to git** including a Stripe live secret key.

### Severity Breakdown

| Severity | Count | Summary |
|----------|-------|---------|
| 🔴 Critical | 3 | Secrets in git, `.gitignore` gaps, SSRF |
| 🟠 High | 5 | Auth bypass headers, weak unsubscribe, CSP, hardcoded email, auth fallback chain |
| 🟡 Medium | 8 | In-memory rate limiting, missing ESLint configs, CI gaps, outdated deps |
| 🔵 Low | 6 | TypeScript strictness gaps, error swallowing, missing test coverage |

---

## Repository Overview

| Project | Framework | Role | Status |
|---------|-----------|------|--------|
| `neatcircle-beta` | Next.js 15, Tailwind 4, Cloudflare | Marketing/edge layer | Active |
| `erie-pro` | Next.js 15, Prisma 7, NextAuth v5 | Territory/local-lead platform | Active |
| `lead-os-hosted-runtime-wt-hybrid` | Next.js 16, BullMQ, Stripe | Kernel runtime (full) | Active |
| `lead-os-hosted-runtime-wt-public` | Next.js 15, pg | Public runtime (slim) | Active |
| `_n8n_sources` | Mixed (TS, NestJS, Vite) | Vendored third-party n8n tools | Reference |

No root-level workspace manager (no pnpm-workspace.yaml, npm workspaces, or Turborepo config). Each project manages its own dependencies independently.

---

## Critical Findings

### 🔴 C-1: Live Production Secrets Committed to Git

**File:** `neatcircle-beta/.env.local` (tracked in git history)

This file contains **live production credentials** including:
- **Stripe live secret key** (`sk_live_51RZLN8...`)
- **Stripe live publishable key** (`pk_live_51RZLN8...`)
- SuiteDash API credentials (public ID + bcrypt-hashed secret key)
- Emailit API key
- AITable API token
- Telegram bot token
- CallScaler, UpViral, AgenticFlow, Boost Space, Make API keys
- CRON_SECRET (plaintext)

**Impact:** Anyone with repository read access has full Stripe API access and can charge customers, issue refunds, or access payment data. All listed API keys should be considered compromised.

**Required action:**
1. **Immediately rotate ALL exposed credentials** (Stripe keys first)
2. Remove the file from git tracking: `git rm --cached neatcircle-beta/.env.local`
3. Use `git filter-branch` or BFG Repo-Cleaner to purge secrets from git history
4. Verify the root `.gitignore` entries apply (they do, but the file was added before the ignore rule)

### 🔴 C-2: Incomplete `.gitignore` in Sub-Projects

**Affected:** `lead-os-hosted-runtime-wt-hybrid/.gitignore`, `lead-os-hosted-runtime-wt-public/.gitignore`

Both files contain only:
```
node_modules/
.next/
*.tsbuildinfo
```

**Missing:** `.env`, `.env.local`, `.env.production`, `.env.*.local`, `.vercel`, `.DS_Store`, `npm-debug.log*`, `*.pem`

While the root `.gitignore` covers `.env` files, if these projects are ever used standalone or a developer runs `git add` from within the sub-directory, secrets could be committed.

`neatcircle-beta/.gitignore` also lacks `.env` entries (only covers `.vercel`, `.open-next`, `.wrangler`).

### 🔴 C-3: Server-Side Request Forgery (SSRF)

**File:** `neatcircle-beta/src/app/api/intelligence/analyze/route.ts`

The endpoint accepts a user-provided `url` and performs a server-side `fetch()` with no restrictions:
```typescript
async function fetchTargetHtml(url: string) {
  const response = await fetch(url, { ... });
  return response.text();
}
```

**No authentication** is required (endpoint is not in the middleware matcher). An attacker can:
- Probe internal network services (`http://169.254.169.254/` for cloud metadata)
- Use the server as a proxy for external attacks
- Exfiltrate data from internal services

---

## Security Audit

### 🟠 H-1: Forgeable Auth Bypass Headers (neatcircle-beta)

**File:** `neatcircle-beta/middleware.ts` (lines 103–109)

Requests with headers `x-lead-os-internal-smoke: 1` and `x-lead-os-dry-run: 1` **bypass Bearer token authentication** for all `/api/automations/*` routes. These headers can be set by any HTTP client, making the bypass exploitable in production.

### 🟠 H-2: Unsubscribe Endpoint Allows Unauthenticated Suppression (erie-pro)

**File:** `erie-pro/src/app/api/unsubscribe/route.ts` (lines 106–108)

The GET handler validates the token **only if one is provided**. If the `token` query parameter is omitted, the request proceeds to suppress the email without verification. Any actor who knows or guesses an email address can add it to the suppression list, blocking legitimate communications.

### 🟠 H-3: Weak Unsubscribe Token Secret (erie-pro)

**File:** `erie-pro/src/app/api/unsubscribe/route.ts` (line 23)

Falls back to `"default-unsubscribe-secret"` if `UNSUBSCRIBE_SECRET` and `NEXTAUTH_SECRET` are both unset. Also references `NEXTAUTH_SECRET` while the project uses NextAuth v5 which expects `AUTH_SECRET`.

### 🟠 H-4: Hardcoded Email in Operator Auth Allowlist (public runtime)

**File:** `lead-os-hosted-runtime-wt-public/src/lib/operator-auth.ts` (line 29)

`"polycarpohu@gmail.com"` is hardcoded as a fallback operator email. This acts as a permanent backdoor if `LEAD_OS_OPERATOR_EMAILS` is not explicitly set. Should be removed or moved to an environment variable.

### 🟠 H-5: Auth Secret Fallback Chain (public runtime)

**File:** `lead-os-hosted-runtime-wt-public/src/lib/operator-auth.ts` (lines 21–23)

```typescript
function getAuthSecret() {
  return process.env.LEAD_OS_AUTH_SECRET ?? process.env.CRON_SECRET ?? embeddedSecrets.cron.secret;
}
```

If `LEAD_OS_AUTH_SECRET` is unset, `CRON_SECRET` is used for signing session tokens. This conflates two different security domains — cron job authentication and operator session signing. If the cron secret is leaked or weak, operator sessions can be forged.

### 🟡 M-1: In-Memory Rate Limiting (neatcircle-beta)

**File:** `neatcircle-beta/src/lib/request-guards.ts`

Rate limiting uses an in-memory `Map` that resets on each serverless cold start. Ineffective against distributed or persistent abuse. Consider Redis-backed rate limiting (Upstash is already documented in erie-pro's `.env.example`).

### 🟡 M-2: CSP Uses `unsafe-inline` (erie-pro, hybrid)

Both `erie-pro/next.config.ts` and `lead-os-hosted-runtime-wt-hybrid/src/middleware.ts` use `unsafe-inline` for `script-src` and `style-src`. This weakens XSS protection. A TODO exists to implement nonce-based CSP.

### 🟡 M-3: Intelligence Endpoints Lack Authentication (neatcircle-beta)

`/api/intelligence/analyze` and `/api/intelligence/manifest` are not included in the middleware matcher. Anyone can POST to trigger analysis (and server-side fetch via SSRF). Rate limiting is the only protection.

---

## Dependency Audit

### neatcircle-beta — 11 vulnerabilities

| Severity | Count | Packages |
|----------|-------|----------|
| High | 8 | `undici` 7.0.0–7.23.0 (via `miniflare` → `wrangler`) — WebSocket parsing, HTTP smuggling, CRLF injection, memory DoS |
| Moderate | 3 | `yaml` 2.0.0–2.8.2 (stack overflow via deep nesting), `picomatch` |

**Fix:** `npm audit fix` resolves all; update `wrangler` to `^4.80.0`.

### erie-pro — 0 vulnerabilities

Clean audit.

### lead-os-hosted-runtime-wt-hybrid — 0 vulnerabilities

Clean audit.

### lead-os-hosted-runtime-wt-public — 1 vulnerability

| Severity | Package | Issue |
|----------|---------|-------|
| Moderate | `next` 9.5.0–15.5.13 | HTTP request smuggling in rewrites; unbounded `/next/image` disk cache |

**Fix:** Update `next` to `^15.5.14` or `^16.x`.

### Outdated Dependencies (notable)

| Project | Package | Current | Latest | Risk |
|---------|---------|---------|--------|------|
| neatcircle-beta | `next` | ^15.3.3 | ^16.2.2 | Major version |
| neatcircle-beta | `wrangler` | ^4.31.0 | ^4.80.0 | Security fixes |
| neatcircle-beta | `typescript` | 5.9.3 | 6.0.2 | Major version |
| erie-pro | `next` | ^15.5.12 | ^16.2.2 | Major version |
| erie-pro | `stripe` | ^21.0.1 | ^22.0.0 | Major version |
| erie-pro | `tailwindcss` | ^3.4.19 | ^4.2.2 | Major version |
| public runtime | `next` | ^15.5.12 | ^16.2.2 | Major + vuln fix |

---

## Architecture & Code Quality

### Strengths

- **TypeScript strict mode** enabled across all main projects
- **Zod validation** used extensively in erie-pro and hybrid runtime for input validation
- **Structured logging** via custom logger module (JSON in production, pretty in dev)
- **Clear separation** of concerns: `lib/`, `components/`, `app/api/`
- **Prisma schema** is well-structured with proper relations, indexes, and migrations
- **Middleware-based API protection** in neatcircle-beta and hybrid runtime
- **Environment validation** at startup (erie-pro `instrumentation.ts`)
- **CORS and security headers** applied in hybrid middleware
- **Cookie security** — `httpOnly`, `secure`, `sameSite: "lax"` on session cookies

### Weaknesses

- **No ESLint config file** in neatcircle-beta or erie-pro — ESLint is listed as a dependency but has no configuration file. `next lint` will use defaults, but custom rules and consistency are missing.
- **Silent error swallowing** — Multiple fire-and-forget fetches use `.catch(() => {})` (e.g., AITable writes in `track`). Failures are completely invisible.
- **Mixed authentication strategies** — neatcircle-beta uses Bearer tokens + middleware, erie-pro uses NextAuth v5, public runtime uses magic links + custom JWT. No shared auth layer.
- **No workspace tooling** — Each project manages its own `node_modules` independently. No Turborepo, pnpm workspaces, or Nx for shared dependency management, deduplication, or coordinated builds.
- **Generated Prisma client committed** — `erie-pro/src/generated/prisma/` appears in the repo (though `.gitignore` lists it). Verify it's actually excluded.

### Error Handling

| Pattern | Projects | Assessment |
|---------|----------|------------|
| `try/catch` + JSON response | All | Good — consistent |
| `logger.error` on catch | erie-pro, hybrid | Good |
| `console.error` fallback | neatcircle-beta (some routes) | Mixed |
| `subscribe` route: catch without logging | neatcircle-beta | Gap — silent 500 |
| `.catch(() => {})` on side-effect fetches | neatcircle-beta | Gap — invisible failures |

### TODO/FIXME/HACK Comments

Only **2 TODOs** found in production code:
1. CSP nonce implementation (erie-pro `next.config.ts`)
2. CSP nonce implementation (hybrid `middleware.ts`)

No FIXMEs or HACKs in production code — good discipline.

---

## Configuration Audit

### TypeScript

| Project | `strict` | `skipLibCheck` | Extra Flags | Assessment |
|---------|----------|----------------|-------------|------------|
| neatcircle-beta | ✅ | ✅ | None | Good base |
| erie-pro | ✅ | ✅ | None | Missing `noUnusedLocals`, `noUnusedParameters` |
| hybrid | ✅ | ✅ | None | Good base |
| public | ✅ | ✅ | None | Good base |

All projects exclude test files from the main `tsconfig.json` — tests may have different type strictness unless a separate `tsconfig.test.json` exists.

### Next.js Configs

| Project | `poweredByHeader` | Security Headers | Image Optimization | `standalone` |
|---------|--------------------|-----------------|---------------------|-------------|
| neatcircle-beta | Default (true) | None | None | No |
| erie-pro | `false` ✅ | HSTS, CSP, etc. ✅ | AVIF/WebP ✅ | No |
| hybrid | `false` ✅ | Full set ✅ | None | `standalone` ✅ |
| public | `false` ✅ | None ❌ | None | No |

**Gap:** `neatcircle-beta` and `public` runtime lack security headers in their Next.js config. The public runtime has **no middleware** and no security headers — API routes are unprotected at the edge.

### Tailwind

| Project | Version | Config | Assessment |
|---------|---------|--------|------------|
| neatcircle-beta | v4.1.7 | Via PostCSS (v4 style) | Modern ✅ |
| erie-pro | v3.4.19 | `tailwind.config.ts` | Outdated, shadcn-compatible |
| hybrid | v3.4.19 | `tailwind.config.ts` | Same as erie-pro |
| public | N/A | No Tailwind | Minimal CSS |

Two different Tailwind major versions across the monorepo.

---

## CI/CD & DevOps

### Current CI Pipeline (`.github/workflows/ci.yml`)

| Job | Project | Steps | Assessment |
|-----|---------|-------|------------|
| typecheck | hybrid | `npm ci` → `tsc --noEmit` | ✅ Good |
| test | hybrid | `npm ci` → `npm run test:ci` | ✅ Good |
| build-hybrid | hybrid | `npm ci` → `npm run build` | ✅ Good |
| build-edge | neatcircle-beta | `npm ci` → `npm run build` | ✅ Good |

**Gaps:**
- **erie-pro** has no CI job — no typecheck, test, or build verification
- **public runtime** has no CI job
- No **lint** step in any job
- No **security scanning** (npm audit, CodeQL, secret scanning)
- No **Prisma migration validation** for erie-pro
- No **coverage reporting** or thresholds
- No **Playwright/E2E** tests in CI
- GitHub Actions versions are pinned to SHAs (good security practice ✅)

### Deployment

| Project | Platform | Config |
|---------|----------|--------|
| neatcircle-beta | Vercel + Cloudflare Workers | `vercel.json`, `wrangler.toml`, `open-next.config.ts` |
| erie-pro | Vercel | `vercel.json` with crons, redirects, headers |
| hybrid | Vercel | `vercel.json` (region `iad1`) |
| public | Railway | `railway.json` with health check |

Multiple deployment targets with no unified deployment documentation or runbook.

---

## Performance Observations

### Positive
- Next.js Image optimization configured in erie-pro (AVIF/WebP)
- Standalone output in hybrid runtime for smaller deployments
- Static asset caching headers in erie-pro `vercel.json`
- `NEXT_TELEMETRY_DISABLED` set in neatcircle-beta Cloudflare worker

### Concerns
- **No bundle analysis** tooling configured in any project
- **No Core Web Vitals** monitoring setup visible (PostHog is optional in erie-pro)
- **BullMQ** in hybrid runtime with no Redis configuration documented — queue processing may silently fail
- **Database connection pooling** — erie-pro uses `@prisma/adapter-pg` but connection pool settings are not explicitly configured
- **No caching strategy** beyond static assets — no Redis/in-memory caching for API responses
- Vercel crons in erie-pro (`sla-checker`, `check-grace-periods`, `archive-stale-leads`, `process-deletions`, `cleanup`) run without documented runbook or failure alerting

---

## Recommendations

### Immediate (do now)

1. **Rotate ALL compromised credentials** — Stripe keys, all API keys in `neatcircle-beta/.env.local`
2. **Purge secrets from git history** using BFG Repo-Cleaner
3. **Fix `.gitignore`** in all sub-projects to include `.env*` patterns
4. **Remove `neatcircle-beta/.env.local` from tracking** — `git rm --cached`
5. **Block SSRF** in `/api/intelligence/analyze` — validate URL against allowlist, block private IP ranges
6. **Require token in unsubscribe GET** — reject requests with missing `token` parameter
7. **Remove forgeable auth bypass headers** — require a proper secret for internal smoke tests

### Short-Term (next sprint)

8. **Add erie-pro and public runtime CI jobs** — typecheck, test, build
9. **Add ESLint configurations** to neatcircle-beta and erie-pro
10. **Remove hardcoded email** from public runtime operator auth
11. **Separate auth secrets** — use dedicated `LEAD_OS_AUTH_SECRET`, don't fall back to `CRON_SECRET`
12. **Replace `"default-unsubscribe-secret"`** with a required env var
13. **Add security headers** to neatcircle-beta and public runtime Next.js configs
14. **Implement nonce-based CSP** (TODO already documented)

### Medium-Term (next quarter)

15. **Adopt workspace tooling** — pnpm workspaces or Turborepo for shared deps and coordinated builds
16. **Implement Redis-backed rate limiting** — replace in-memory Maps
17. **Add npm audit** to CI pipeline
18. **Add secret scanning** (GitHub secret scanning, GitLeaks)
19. **Standardize authentication** — shared auth library or consistent pattern across projects
20. **Add bundle analysis** and performance budgets
21. **Document deployment runbooks** for each project/platform
22. **Configure database connection pooling** explicitly in erie-pro
23. **Add error monitoring** (Sentry integration is optional but not configured)

---

## Remediation Status

The following issues have been fixed as part of this audit:

| # | Finding | Severity | Status |
|---|---------|----------|--------|
| C-1 | Secrets in git (`neatcircle-beta/.env.local`, `_n8n_sources/.env`) | 🔴 Critical | ✅ Removed from tracking. **Rotate all exposed keys manually.** |
| C-2 | Incomplete `.gitignore` in sub-projects | 🔴 Critical | ✅ Fixed — all sub-projects now exclude `.env*`, OS files, debug logs |
| C-3 | SSRF in `/api/intelligence/analyze` | 🔴 Critical | ✅ Fixed — blocks private IPs, metadata, non-http, redirects; 10s timeout, 2MB limit |
| H-1 | Forgeable auth bypass headers | 🟠 High | ✅ Fixed — internal smoke bypass restricted to localhost only |
| H-2 | Unsubscribe GET without token | 🟠 High | ✅ Fixed — token is now required |
| H-3 | Weak default unsubscribe secret | 🟠 High | ✅ Fixed — removed `"default-unsubscribe-secret"`, uses `AUTH_SECRET` |
| H-4 | Hardcoded operator email | 🟠 High | ✅ Fixed — removed from public runtime allowlist |
| H-5 | Auth secret fallback chain | 🟠 High | ✅ Fixed — `LEAD_OS_AUTH_SECRET` required (both hybrid + public) |
| M-1 | In-memory rate limiting | 🟡 Medium | ⏳ Remaining — requires Redis integration |
| M-2 | CSP `unsafe-inline` | 🟡 Medium | ⏳ Remaining — requires Next.js nonce infrastructure |
| M-3 | Intelligence endpoints lack auth | 🟡 Medium | ⏳ Remaining — SSRF blocked, but rate limiting is still only protection |
| — | Missing security headers (neatcircle, public) | 🟡 Medium | ✅ Fixed — HSTS, X-Content-Type-Options, X-Frame-Options, etc. |
| — | No ESLint config (neatcircle, erie-pro) | 🟡 Medium | ✅ Fixed — `eslint.config.mjs` added |
| — | CI gaps (erie-pro, public runtime missing) | 🟡 Medium | ✅ Fixed — typecheck, test, build, lint, audit jobs added |
| — | Silent error swallowing | 🔵 Low | ✅ Fixed — `.catch(() => {})` replaced with logged warnings |
| — | Subscribe route silent 500 | 🔵 Low | ✅ Fixed — error now logged |
| — | npm vulnerabilities (12 total) | 🟡 Medium | ✅ Fixed — 0 vulnerabilities across all 4 projects |

### Verification

All fixes verified:
- `tsc --noEmit` passes on all 4 projects
- 4187/4187 tests pass (hybrid), 89/89 tests pass (erie-pro)
- `npm audit` returns 0 vulnerabilities across all projects
- `npm run build` succeeds for neatcircle-beta

---

## Files Audited

- **neatcircle-beta:** `package.json`, `tsconfig.json`, `next.config.ts`, `middleware.ts`, `postcss.config.mjs`, `wrangler.toml`, `vercel.json`, `.env.sample`, `.env.local`, all `src/app/api/**/route.ts`, `src/lib/*`, `src/middleware.ts`
- **erie-pro:** `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `vitest.config.ts`, `vercel.json`, `prisma.config.ts`, `.env.example`, `src/lib/auth.ts`, `src/lib/db.ts`, `src/lib/env.ts`, `src/middleware.ts`, `src/app/api/**/route.ts`
- **lead-os-hosted-runtime-wt-hybrid:** `package.json`, `tsconfig.json`, `next.config.mjs`, `tailwind.config.ts`, `vercel.json`, `.gitignore`, `src/middleware.ts`, `src/lib/operator-auth*.ts`
- **lead-os-hosted-runtime-wt-public:** `package.json`, `tsconfig.json`, `next.config.mjs`, `railway.json`, `.gitignore`, `src/lib/operator-auth.ts`, `src/lib/operator-auth-core.ts`, `src/lib/tenant.ts`
- **Root:** `.gitignore`, `.github/workflows/ci.yml`, `README.md`, `AGENTS.md`
- **_n8n_sources:** All `package.json` files, `tsconfig.json` files (per-project)
