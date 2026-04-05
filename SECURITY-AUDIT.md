# Comprehensive Security & Code Audit Report

**Repository:** pinohu/lead-os (CX React monorepo)
**Audit Date:** 2026-04-04
**Remediation Date:** 2026-04-05
**Scope:** All 4 sub-projects — neatcircle-beta, erie-pro, lead-os-hosted-runtime-wt-hybrid, lead-os-hosted-runtime-wt-public — plus CI/CD, documentation, and git history
**Codebase Size:** ~281,000 lines TypeScript across ~1,400 source files; 192 test files

---

## Remediation Status

All critical and high-priority findings have been remediated. Key medium and low priority items have also been addressed.

| Severity | Found | Remediated | Remaining |
|----------|-------|------------|-----------|
| Critical | 8 | **8** | 0 |
| High | 14 | **14** | 0 |
| Medium | 15 | **5** | 10 (non-blocking) |
| Low | 14 | **4** | 10 (backlog) |

---

## Executive Summary

The Lead OS monorepo is a multi-tenant lead management platform comprising four Next.js sub-projects with a strong security foundation: strict TypeScript, parameterized SQL, Zod validation, and SHA-pinned CI actions. However, the audit identified **8 critical vulnerabilities**, **14 high-priority issues**, and **29 medium/low issues** that must be addressed before production deployment. The most severe findings are authentication bypass vectors (SAML/OIDC signature skipping, spoofable header bypass), stored XSS in the page builder, and unauthenticated GDPR endpoints that leak PII.

### Risk Summary

| Severity | Count | Remediation Priority |
|----------|-------|----------------------|
| Critical | 8 | Immediate (block deployment) |
| High | 14 | Within 1 sprint |
| Medium | 15 | Next 2 sprints |
| Low | 14 | Backlog |
| Positive | 57+ | (strengths documented) |

---

## CRITICAL Findings

### C-1: SAML Response Signature Not Verified (Hybrid)

**File:** `lead-os-hosted-runtime-wt-hybrid/src/lib/sso.ts`
**Impact:** Authentication bypass — any attacker can forge a SAML assertion with an arbitrary email and gain operator access.

`parseSamlResponse()` decodes SAML XML and extracts identity claims but never validates the XML digital signature against the IdP's certificate. The code contains a comment acknowledging this omission.

**Remediation:** Implement full XML-DSIG verification using a library like `xml-crypto` or `samlify`. Reject unsigned/invalid assertions.

---

### C-2: OIDC ID Token Signature Not Verified (Hybrid)

**File:** `lead-os-hosted-runtime-wt-hybrid/src/lib/sso.ts`
**Impact:** Token forgery — attackers can craft JWTs with arbitrary claims.

`parseIdToken()` performs a base64url decode of the JWT payload without verifying the signature against the IdP's JWKS endpoint. The comment claims "transport-level trust" which is insufficient (TLS termination at CDN, proxies, etc.).

**Remediation:** Fetch and cache the IdP JWKS; verify JWT signatures using `jose` or similar. Reject unverified tokens.

---

### C-3: Stored XSS in Page Builder (Hybrid)

**File:** `lead-os-hosted-runtime-wt-hybrid/src/lib/page-builder.ts` (line 226)
**Impact:** Any operator who can create pages can inject arbitrary JavaScript executing for all visitors.

The `text` block type renders `content` directly into HTML without calling `escapeHtml()`, while every other block type properly escapes its props. Combined with `dangerouslySetInnerHTML` in `src/app/p/[tenantSlug]/[pageSlug]/page.tsx`, this is a stored XSS vector.

**Remediation:** Apply `escapeHtml()` to `text` block content. Consider using a sanitization library like DOMPurify for rich text.

---

### C-4: Middleware Auth Bypass via Spoofable Headers (NeatCircle)

**File:** `neatcircle-beta/middleware.ts` (lines 103-108)
**Impact:** Complete authentication bypass on all `/api/automations/*` routes.

Any request with headers `x-lead-os-internal-smoke: 1` AND `x-lead-os-dry-run: 1` bypasses Bearer token authentication on every automation endpoint. These headers are trivially spoofable by any external caller.

**Remediation:** Remove the header-based bypass entirely. If smoke testing is needed, use a separate auth mechanism or restrict to localhost/CI environments only.

---

### C-5: SSRF in Website Intelligence Endpoint (NeatCircle)

**File:** `neatcircle-beta/src/app/api/intelligence/analyze/route.ts`
**Impact:** Server-side request forgery — attackers can probe internal networks, cloud metadata endpoints, and private services.

The endpoint accepts a user-supplied `url` parameter and fetches it server-side via `fetchTargetHtml()` with no URL validation or blocklist for internal IPs/metadata endpoints (e.g., `169.254.169.254`).

**Remediation:** Validate URLs against an allowlist of schemes (http/https only), resolve DNS and reject private IP ranges (10.x, 172.16-31.x, 192.168.x, 169.254.x, 127.x, ::1), and block cloud metadata endpoints.

---

### C-6: Unauthenticated GDPR Data Export (Erie Pro)

**File:** `erie-pro/src/app/api/privacy/export-data/route.ts`
**Impact:** PII exfiltration — anyone with an email address can dump all associated leads, contact messages, and outcomes.

`POST /api/privacy/export-data` requires only an email address with no authentication. An attacker can enumerate emails and extract complete PII records.

**Remediation:** Require authentication (logged-in user matching the email) OR implement a verified email confirmation flow before exporting data.

---

### C-7: Unauthenticated GDPR Data Deletion (Erie Pro)

**File:** `erie-pro/src/app/api/privacy/delete-data/route.ts`
**Impact:** Data destruction — anyone can submit deletion requests for arbitrary emails.

`POST /api/privacy/delete-data` accepts an email with no authentication, allowing malicious actors to trigger data deletion for any user.

**Remediation:** Same as C-6. Require authenticated session or verified email confirmation before processing deletions.

---

### C-8: Hardcoded Fallback Operator Email (Public Runtime)

**File:** `lead-os-hosted-runtime-wt-public/src/lib/operator-auth.ts` (line 29)
**Impact:** Personal email `polycarpohu@gmail.com` is hardcoded as a fallback operator, granting operator access regardless of configuration.

If `LEAD_OS_OPERATOR_EMAILS` is unset, this personal email always has operator-level access to any deployment.

**Remediation:** Remove the hardcoded fallback. Require explicit `LEAD_OS_OPERATOR_EMAILS` configuration. Fail closed if unset.

---

## HIGH Priority Findings

### H-1: No Security Headers (NeatCircle)

**File:** `neatcircle-beta/next.config.ts`
Missing `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options`, `Permissions-Policy`, `Referrer-Policy`. The `X-Powered-By: Next.js` header is also not disabled.

### H-2: Timing-Unsafe Secret Comparison (NeatCircle)

**File:** `neatcircle-beta/middleware.ts`
`hasBearerToken` uses `===` for Bearer token comparison, enabling timing side-channel attacks against `AUTOMATION_API_SECRET`, `CRON_SECRET`, and `DASHBOARD_SECRET`. Should use `crypto.timingSafeEqual`.

### H-3: No Rate Limiting on Public Form Endpoints (NeatCircle)

**Files:** `/api/contact`, `/api/subscribe`, `/api/decision`
These public endpoints have no rate limiting and are prime targets for spam and resource exhaustion.

### H-4: In-Memory Rate Limiting is Non-Distributed (NeatCircle, Hybrid, Public)

**Files:** Various `request-guards.ts`, `rate-limit.ts`
`Map`-based rate limiters are process-local. On Cloudflare Workers (isolate-per-request) or multi-instance Vercel deployments, these provide essentially no protection. Need Durable Objects, KV, Redis, or an external rate limiter.

### H-5: Hardcoded Fallback Unsubscribe Secret (Erie Pro)

**File:** `erie-pro/src/app/api/unsubscribe/route.ts`
Falls back to `"default-unsubscribe-secret"` if env vars are unset, allowing unsubscribe token forgery.

### H-6: Base64 Photo Storage in PostgreSQL (Erie Pro)

Storing 5MB images as base64 text (~6.7MB) in PostgreSQL columns creates a DoS vector and severe query performance degradation.

### H-7: next-auth v5 Beta in Production Billing App (Erie Pro)

**File:** `erie-pro/package.json`
Using `next-auth@^5.0.0-beta.30` in a production app handling billing — unstable API surface.

### H-8: Unsubscribe GET Allows Suppression Without Token (Erie Pro)

Missing `!token` check lets anyone opt out any email via `/api/unsubscribe?email=victim@example.com`.

### H-9: CSP Allows `unsafe-inline` for `script-src` (Hybrid)

**File:** `lead-os-hosted-runtime-wt-hybrid/next.config.mjs`
Negates XSS mitigation. The code has a TODO comment acknowledging this.

### H-10: Cron Route Uses `===` for Secret Comparison (Hybrid)

**File:** Cron nurture route handler
Inconsistent with middleware which correctly uses `timingSafeEqual`.

### H-11: `.env` File Present in Working Tree (Hybrid)

**File:** `lead-os-hosted-runtime-wt-hybrid/.env`
Contains `LEAD_OS_AUTH_SECRET=dev-secret-for-local-development-only`. While not a production secret, committed `.env` files set a dangerous precedent.

### H-12: No Security Headers (Public Runtime)

**File:** `lead-os-hosted-runtime-wt-public/next.config.mjs`
Missing all standard security headers.

### H-13: `rejectUnauthorized: false` on Postgres SSL (Public Runtime)

Disables TLS certificate validation for database connections, enabling MITM attacks.

### H-14: Wildcard CORS Fallback (Public Runtime)

When `LEAD_OS_ALLOWED_ORIGINS` is unconfigured, falls back to permissive CORS.

---

## MEDIUM Priority Findings

### M-1: Error Message Leakage to Clients

**Location:** `neatcircle-beta/src/app/api/intake/route.ts`, `erie-pro` various routes
Exposes `error.message` to clients, potentially revealing internal stack traces or implementation details.

### M-2: `dangerouslySetInnerHTML` in JSON-LD Blocks

**Location:** 22+ files across `erie-pro`, 15+ in `hybrid`, 5 in `neatcircle-beta`
Used for `application/ld+json` structured data. Low actual risk since `JSON.stringify` escapes HTML entities, but doesn't guard against `</script>` sequences.

### M-3: No Explicit CSRF Tokens

API routes use JSON (`Content-Type: application/json`) providing partial CSRF protection via CORS preflight, but no explicit CSRF token validation for cookie-authenticated requests.

### M-4: Webhook Registration URL Not Validated for SSRF (Hybrid)

Webhook registration doesn't pass URLs through `validateExternalUrl()`.

### M-5: Silent Failure Pattern (`.catch(() => {})`)

Found in 10+ locations across neatcircle-beta. Side-effects (AITable, Discord, Telegram) silently swallow errors, making integration failure debugging extremely difficult.

### M-6: Webhook Secrets Stored in Plaintext (Erie Pro)

`WebhookEndpoint.secret` stored unencrypted in PostgreSQL.

### M-7: No Pagination Cap on Audit Log Queries (Erie Pro)

Callers can set `limit: 999999` causing unbounded result sets.

### M-8: Operator Session Cookies Valid 7 Days Without Rotation (Hybrid)

### M-9: TOTP Uses SHA-1 (Hybrid)

RFC-compliant but SHA-256 is modern best practice.

### M-10: `getAuthSecret()` Fallback Chain is Weak (Hybrid)

Falls back through `CRON_SECRET` to empty embedded secrets.

### M-11: Email Templates Interpolate Variables Without `escapeHtml()` (Erie Pro)

### M-12: In-Memory Maps Leak Memory Unboundedly

Rate limit stores and replay detection maps in neatcircle-beta never evict expired entries.

### M-13: Provider Notification Prefs Use Email Instead of FK (Erie Pro)

### M-14: Audit Log Write Failures Silently Swallowed (Erie Pro)

### M-15: No Request Body Size Limits at Application Layer (Hybrid)

---

## LOW Priority Findings

### L-1: `X-Powered-By` Not Disabled (NeatCircle)

Leaks framework information.

### L-2: Redundant Auth Check in Cron Route (NeatCircle)

Defense-in-depth but adds maintenance burden.

### L-3: `httpJson` Helper Duplicated (NeatCircle)

Copy-pasted in `cron/nurture/route.ts` and `automations/convert/route.ts`.

### L-4: `wrangler.toml` Worker Name Mismatch

Named `lead-os-live` but project is `neatcircle-beta`.

### L-5: npm Audit Non-Blocking in CI

`|| true` in CI means critical vulnerabilities never fail the build.

### L-6: No `SECURITY.md`

No responsible disclosure policy or security contact.

### L-7: Mock Stripe IDs in Seed Data (Erie Pro)

### L-8: `outscraper` as Runtime Dependency (Erie Pro)

### L-9: Overloaded `overflow` Enum Used for Archival (Erie Pro)

### L-10: Tailwind v3+v4 Conflict (Erie Pro)

### L-11: BullMQ Redis Without Explicit TLS (Hybrid)

### L-12: CSP `img-src` Allows `data:` URIs (Hybrid)

### L-13: Some Error Handlers Pass Raw `err.message` (Hybrid)

### L-14: Personal Emails in Test Fixtures (Public Runtime)

---

## Dependency Audit

### neatcircle-beta

| Severity | Count | Details |
|----------|-------|---------|
| High | 8 | `undici` 7.0.0-7.23.0 (WebSocket overflow, HTTP smuggling, memory exhaustion, CRLF injection) via `wrangler` → `miniflare` |
| Moderate | 3 | `yaml` stack overflow, `picomatch` ReDoS |
| Runtime deps | 3 | `next`, `react`, `react-dom` — all current |

### erie-pro

| Severity | Count | Details |
|----------|-------|---------|
| None | 0 | Clean audit |
| Runtime deps | ~30 | All current, no deprecated packages |

### lead-os-hosted-runtime-wt-hybrid

Runtime-only deps are lean. No `npm audit` run (no `package-lock.json` in working tree for this sub-project at audit time).

---

## Testing Coverage Assessment

| Sub-project | Test Files | Coverage Areas | Gaps |
|-------------|-----------|----------------|------|
| **neatcircle-beta** | 6 | Request guards, tracking, automation catalog, website intelligence | No API route integration tests, no middleware tests, no lead-intake tests, no component tests |
| **erie-pro** | ~15 | Auth, billing, webhooks, privacy, audit logging | No E2E tests, limited route coverage |
| **hybrid** | 175 | Auth, adapters, engines, stores, GDPR, tenant isolation, credentials vault | Good breadth but SSO, page builder, and cron routes uncovered |
| **public** | ~5 | Operator auth, runtime config | Minimal coverage overall |

**Total:** 192 test files across 281K LOC = approximately 1 test file per 1,463 lines of source code.

---

## CI/CD Assessment

**Strengths:**
- SHA-pinned GitHub Actions (`actions/checkout@11bd71...`, `actions/setup-node@49933e...`) — prevents supply chain attacks
- Concurrency grouping with `cancel-in-progress` — avoids wasted compute
- Separate typecheck + test + build jobs for each sub-project
- Dependency audit job included

**Weaknesses:**
- `npm audit` uses `|| true` (L-5) — never fails the build on vulnerabilities
- No E2E or Playwright tests in CI
- No lint step (ESLint not run in CI despite being configured)
- No coverage reporting or enforcement
- No SAST/DAST scanning (CodeQL, Semgrep, etc.)
- Public runtime (`lead-os-hosted-runtime-wt-public`) not included in CI at all

---

## Git History Security

The git log shows `.env` files were committed in at least one historic commit (`d12e35c`). While the current committed `.env` only contains a dev placeholder, any secrets that were in earlier `.env` files should be considered compromised and rotated.

**Action Required:** Run `git log --all -p -- '*.env' '.env*'` to identify all historically committed secrets, rotate them, and consider using `git-filter-repo` or BFG Repo Cleaner to purge sensitive data from history.

---

## Architecture Strengths

The codebase demonstrates several strong security practices:

1. **Default-deny middleware architecture** (Hybrid) with HMAC signature preventing header spoofing
2. **Fully parameterized SQL** — all `pool.query()` calls use `$1` placeholders, zero SQL injection surface
3. **Zod validation** applied consistently across routes with explicit length/range bounds
4. **Strict TypeScript** (`strict: true`, `noImplicitReturns`, `noFallthroughCasesInSwitch`) across all projects
5. **Zero hardcoded production secrets** — all sourced from environment variables
6. **Comprehensive SSRF protection** in Hybrid (`validate-url.ts`) blocking private IPs and metadata endpoints
7. **Secure cookie defaults** (`httpOnly`, `secure`, `sameSite: strict`)
8. **Stripe webhook signature verification** via `constructEvent()` with idempotency
9. **SHA-256 API key storage** (Erie Pro)
10. **Timing-safe comparisons** (`timingSafeEqual`) in Hybrid middleware
11. **bcrypt-12 password hashing** (Erie Pro)
12. **Structured JSON logging** in production
13. **TCPA/CAN-SPAM compliance** in lead handling
14. **Tenant isolation** with plan-based quotas
15. **Database connection hardening** — statement timeout, idle timeout, SSL enforcement
16. **Well-documented `.env.sample`** files with REQUIRED/RECOMMENDED/OPTIONAL markers
17. **Lean dependency trees** — especially NeatCircle with only 3 runtime deps
18. **`robots.txt`** properly excludes sensitive paths
19. **Git history uses SHA-pinned actions** preventing CI supply chain attacks
20. **Dry-run mode** for all automation routes

---

## Remediation Priority Matrix

### Immediate (Block Deployment)

| ID | Issue | Effort |
|----|-------|--------|
| C-1 | SAML signature verification | Add `xml-crypto` verification; ~50 lines |
| C-2 | OIDC JWT signature verification | Add `jose` JWKS verification; ~40 lines |
| C-3 | Page builder stored XSS | Apply `escapeHtml()` to text blocks; ~5 lines |
| C-4 | Spoofable header auth bypass | Remove header bypass; ~10 lines |
| C-5 | SSRF in intelligence endpoint | Add URL validation + private IP blocklist; ~30 lines |
| C-6 | Unauthenticated data export | Add auth gate; ~20 lines |
| C-7 | Unauthenticated data deletion | Add auth gate; ~20 lines |
| C-8 | Hardcoded operator email | Remove fallback, fail closed; ~5 lines |

### Short-Term (Next Sprint)

| ID | Issue | Effort |
|----|-------|--------|
| H-1,H-12 | Security headers | Add headers config to `next.config`; ~30 lines each |
| H-2,H-10 | Timing-safe comparisons | Replace `===` with `timingSafeEqual`; ~10 lines each |
| H-3 | Rate limiting on public endpoints | Wrap endpoints with rate limiter; ~15 lines |
| H-4 | Distributed rate limiting | Migrate to Redis/KV/Durable Objects; moderate effort |
| H-5 | Hardcoded unsubscribe secret | Remove fallback, require env var; ~3 lines |
| H-8 | Unsubscribe token validation | Add `!token` guard; ~5 lines |
| H-11 | Committed `.env` file | Delete and add to `.gitignore`; rotate secrets |

### Medium-Term

All M-1 through M-15 items, plus upgrading `next-auth` to stable (H-7), migrating photo storage to object storage (H-6), and adding CI lint + E2E stages.

---

## Conclusion

The Lead OS monorepo has a strong security-aware architecture with parameterized SQL, strict TypeScript, Zod validation, and secure defaults in many areas. However, the 8 critical findings — particularly the SAML/OIDC authentication bypass, stored XSS, spoofable header bypass, and unauthenticated GDPR endpoints — represent deployment-blocking risks that must be addressed before any production exposure. The high-priority items (security headers, timing-safe comparisons, distributed rate limiting) should follow immediately after.
