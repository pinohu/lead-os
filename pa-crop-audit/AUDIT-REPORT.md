# PA CROP Services — Full Audit Report (2026-04-04)

## Overview

Comprehensive security, code quality, accessibility, SEO, and infrastructure audit of [pinohu/pa-crop-services](https://github.com/pinohu/pa-crop-services). All fixes are included in the accompanying patch file.

## How to Apply

```bash
cd pa-crop-services
git am pa-crop-audit/pa-crop-services-audit.patch
# Or apply manually:
git apply pa-crop-audit/pa-crop-services-audit.patch
```

---

## Critical Fixes Applied

### 1. Stripe Webhook Signature Verification (CRITICAL)
**File:** `api/stripe-webhook.js`
- `timingSafeEqual` was called with `Buffer.from(hexString)` which treats hex digits as UTF-8 bytes, not hex — causing buffer length mismatches that could crash or falsely reject valid webhooks
- Added null guards for missing `t=` timestamp and `v1=` signatures
- Now compares hex strings as UTF-8 buffers of equal length

### 2. SMS Sends to Email Address (HIGH)
**File:** `api/stripe-webhook.js`
- `invoice.payment_failed` handler sent SMS with `custEmail` (email address) in the `to` field instead of a phone number
- Changed to use email notification endpoint instead of SMS

### 3. Auth Route Hardening (HIGH)
**File:** `api/auth/index.js`
- Legacy `/api/auth` endpoint lacked `requireJson`, `rejectOversizedBody`, and `isValidEmail` checks present in the newer `/api/auth/login` route
- Added all three guards to match the security posture of `auth/login.js`

### 4. CORS Origin Reflection Tightened (MEDIUM)
**File:** `api/services/auth.js`
- Preview/development CORS allowed ANY origin to be reflected
- Now restricted to `*.vercel.app` origins only in preview mode

### 5. Notifications Data Shape Bug (MEDIUM)
**File:** `api/services/notifications.js`
- `processPending()` accessed `notif.organizations?.legal_name` and `notif.obligations?.filing_method` but the SQL query returns flat columns, not nested objects
- Fixed to use `notif.org_name`, `notif.legal_name`, `notif.filing_method` directly

---

## Code Quality Fixes

### 6. Hardcoded N8N URLs Centralized
**Files:** 11 API files
- Replaced all hardcoded `https://n8n.audreysplace.place/webhook` with `N8N_BASE` from `_config.js`
- Affects: `stripe-webhook.js`, `intake.js`, `provision.js`, `subscribe.js`, `voice-recording.js`, `setup-guide.js`, `retarget.js`, `reset-code.js`, `partner-intake.js`, `entity-intake.js`, `entity-request.js`, `admin/index.js`

### 7. Duplicate Test Directory Removed
- Deleted `test/` directory (stale copy of `tests/`)
- Ported unique `tryDeterministicAnswer` tests from `test/guardrails.test.js` into `tests/guardrails.test.js`
- CI, npm scripts, and pre-commit hooks all reference `tests/` only

### 8. Provision.js Cleanup
**File:** `api/provision.js`
- Removed unused `generateAccessCode as _genCode` import
- Removed redundant `await import('crypto')` when `randomBytes` was already statically imported
- Moved Acumbamail `list_id` from hardcoded `'1267324'` to `process.env.ACUMBAMAIL_LIST_ID` with fallback

### 9. Missing Error Logging
**File:** `api/auth/session.js`
- Added `createLogger` import and error logging in catch block (was silently returning 500)

### 10. CI Lint Enforcement
**File:** `.github/workflows/ci.yml`
- Removed `|| true` from lint step so ESLint failures now break the build

### 11. Stale Test Comments
**File:** `tests/compliance.test.js`
- Removed misleading Jest reference comment
- Fixed 0-indexed month comments (September=8, June=5, December=11)

---

## Accessibility Fixes

### 12. FAQ Keyboard Accessibility (23 pages)
- All FAQ accordion `div.faq-q` elements now have `role="button"`, `tabindex="0"`, `aria-expanded`
- Added `Enter` and `Space` keydown handlers
- `aria-expanded` now toggles dynamically on open/close
- Affected all 10 city pages, 8 article pages, and 5 comparison pages

### 13. Partners Form Error Handling
**File:** `public/partners.html`
- `submitPartnerForm()` showed success message even on HTTP 4xx/5xx responses
- Added `if(!res.ok) throw` before showing success

### 14. About Page JSON-LD
**File:** `public/about.html`
- Changed `mainEntity` from `@type: Person` to `@type: Organization` (PA CROP Services is not a person)

---

## Issues Identified (Not Fixed — Require Product Decisions)

### Navigation Inconsistency
- `index.html` nav includes Partners, FAQ, About
- City/article pages omit About and Partners from nav
- Footer links vary across pages
- **Recommendation:** Standardize nav/footer across all pages

### Missing OG Meta Tags
- Several pages missing `og:url`, `twitter:title`, `twitter:description`, `og:image:alt`
- `portal.html` and `admin.html` have minimal OG tags (intentionally `noindex`)
- **Recommendation:** Add complete OG/Twitter tags to all public-facing pages

### Missing `og-image.jpg` in Repository
- Many pages reference `https://www.pacropservices.com/og-image.jpg`
- The file is not in the `public/` directory (may be served by CDN)
- **Recommendation:** Add the image to `public/` or verify CDN delivery

### Mobile Menu `aria-expanded` Static on Some Pages
- `about.html`, `404.html`, `partners.html` have static `aria-expanded="false"` on hamburger
- `welcome.html` and `portal.html` update it correctly
- **Recommendation:** Unify hamburger toggle script across all pages

### Redis Session Revocation Fail-Open
- `verifySession()` fails open when Redis is unavailable (revoked tokens still work)
- This is documented and intentional (avoids locking out all users)
- **Risk:** Acknowledged; mitigated by short TTL (1h) and rate limiting

### Database Schema Divergence
- Three incompatible migration paths: `infrastructure/migrations/`, `schema/`, `migrations/`
- `schema/schema.prisma` doesn't model `client_organizations` table
- `infrastructure/migrations/002_seed_rules.sql` only works with `001_schema.sql`'s `rules` table shape
- **Recommendation:** Unify into a single ordered migration system

### Docker Compose
- `version: "3.8"` is obsolete in modern Compose (harmless warning)
- No healthchecks on services
- No app database service defined

---

## Test Results

```
# tests 136
# suites 26
# pass 136
# fail 0
# cancelled 0
# skipped 0
```

ESLint: 0 errors, 113 warnings (all pre-existing; none introduced by audit changes)
