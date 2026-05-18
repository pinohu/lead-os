# PA CROP Services — Full Audit & Remediation Report (2026-04-04)

## Overview

Comprehensive production-readiness audit and remediation of [pinohu/pa-crop-services](https://github.com/pinohu/pa-crop-services). Multi-agent audit council identified 40+ issues across 7 disciplines. All critical, high, and medium issues have been fixed.

## How to Apply

```bash
cd pa-crop-services
git am pa-crop-audit/pa-crop-services-audit.patch
```

---

## Security Fixes (Critical + High)

| # | Issue | Severity | File(s) |
|---|-------|----------|---------|
| 1 | `/api/chat` had NO authentication — public LLM abuse | CRITICAL | `api/chat.js` |
| 2 | `/api/document-upload` had NO authentication — anyone could impersonate any user | CRITICAL | `api/document-upload.js` |
| 3 | Stripe webhook `timingSafeEqual` buffer length mismatch | CRITICAL | `api/stripe-webhook.js` |
| 4 | `provision.js` returned `accessCode`, `hostingPassword` in API response | CRITICAL | `api/provision.js` |
| 5 | `sanitize()` only stripped tags, no HTML entity encoding | HIGH | `api/_validate.js` |
| 6 | SMS endpoint received email addresses in `to` field | HIGH | `api/stripe-webhook.js`, `api/document-upload.js` |
| 7 | Auth/index.js used `===` instead of timing-safe compare | HIGH | `api/auth/index.js` |
| 8 | Rate limiter `clear()` on 10k entries — attacker could flush all limits | HIGH | `api/_ratelimit.js` |
| 9 | Admin API keys GET returned ALL keys across ALL orgs | HIGH | `api/admin/api-keys.js` |
| 10 | CORS reflected ANY origin in preview mode | MEDIUM | `api/services/auth.js` |
| 11 | Missing `requireJson`/`rejectOversizedBody` on auth endpoints | MEDIUM | `api/auth/index.js`, `api/auth/reset-code.js` |

## Backend/Reliability Fixes

| # | Issue | Severity | File(s) |
|---|-------|----------|---------|
| 12 | Stripe webhook always returned 200 — Stripe would never retry failures | CRITICAL | `api/stripe-webhook.js` |
| 13 | No webhook idempotency — retries caused duplicate provisioning | CRITICAL | `api/stripe-webhook.js` |
| 14 | `resolveEntityType` defaulted unknown types to LLC — wrong deadlines | HIGH | `api/_compliance.js` |
| 15 | `computeObligations` null dereference on failed creation | HIGH | `api/services/obligations.js` |
| 16 | `provision.js` metadata clobber — overwrote existing metadata keys | HIGH | `api/provision.js` |
| 17 | `provision.js` bare `fetch` calls with no timeout — 20+ external calls | HIGH | `api/provision.js` |
| 18 | `evaluateObligation` returned stale status after transitions | MEDIUM | `api/services/obligations.js` |
| 19 | Health check external calls had no timeout — could hang indefinitely | MEDIUM | `api/health.js` |
| 20 | Hardcoded N8N URLs in 11 files instead of centralized config | MEDIUM | Multiple |
| 21 | Notification templates hardcoded `$7` fee — wrong for nonprofits (`$0`) | MEDIUM | `api/services/notifications.js` |
| 22 | `notifications.js` `processPending` accessed non-existent nested objects | MEDIUM | `api/services/notifications.js` |

## UX Fixes

| # | Issue | Severity | File(s) |
|---|-------|----------|---------|
| 23 | Portal mobile nav missing "Entities" tab — core section inaccessible | CRITICAL | `public/portal.html` |
| 24 | Admin dashboard accessible on network error (login bypass) | CRITICAL | `public/admin.html` |
| 25 | Portal showed fake compliance score (88) on API failure | HIGH | `public/portal.html` |
| 26 | Portal silent logout — no explanation to user | HIGH | `public/portal.html` |
| 27 | Settings claimed "auto-saved" but weren't persisted | HIGH | `public/portal.html` |
| 28 | Admin had no logout button or session management | HIGH | `public/admin.html` |
| 29 | Admin `callAPI`/`adminFetch` never checked `res.ok` | HIGH | `public/admin.html` |
| 30 | Partners form showed success on HTTP error | MEDIUM | `public/partners.html` |
| 31 | Newsletter error styling broken (wrong CSS selector) | MEDIUM | `public/index.html` |
| 32 | Pricing grid horizontal overflow on mobile | MEDIUM | `public/index.html` |

## Accessibility Fixes

| # | Issue | Severity | File(s) |
|---|-------|----------|---------|
| 33 | FAQ accordions mouse-only — no keyboard support (23 pages) | HIGH | All city/article pages |
| 34 | Hamburger menus missing `aria-expanded` | HIGH | `admin.html`, `404.html`, `about.html` |
| 35 | About page JSON-LD `@type: Person` → `@type: Organization` | MEDIUM | `public/about.html` |
| 36 | No `prefers-reduced-motion` media query | MEDIUM | `public/site.css` |

## Code Quality

| # | Issue | File(s) |
|---|-------|---------|
| 37 | Duplicate `test/` directory consolidated into `tests/` | `test/` → `tests/` |
| 38 | `tryDeterministicAnswer` tests ported from duplicate | `tests/guardrails.test.js` |
| 39 | Unused imports removed | `api/intake.js`, `api/provision.js` |
| 40 | CI lint step now enforces failures | `.github/workflows/ci.yml` |
| 41 | Stale Jest reference and wrong month comments fixed | `tests/compliance.test.js` |

---

## Test Results

```
# tests 138
# suites 26
# pass 138
# fail 0
```

ESLint: 0 errors, 115 warnings (all pre-existing)

---

## Known Items Deferred (require product decisions)

- Database schema divergence across 3 migration paths
- Redis session revocation fail-open (documented, intentional)
- Nav/footer inconsistency across marketing pages
- Missing OG meta tags on some pages
- `portal.html` is a monolithic inline SPA (~300KB)
- Welcome page onboarding gated by URL param only
