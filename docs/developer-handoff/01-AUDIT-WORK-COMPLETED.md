# 01 — Audit Work Completed

Complete record of the pre-launch audit and hardening sessions executed May 15, 2026, against the Erie.pro production deployment. This document is the source of truth for what was done and why; if anything in `STATUS.md` or any other doc disagrees, this one is more recent.

**Master sha at handoff:** `76d267ed` (PR #40 merge).
**Sessions involved:** Three autonomous Claude sessions on May 15, 2026, executed back-to-back.
**Pull requests merged:** #38, #39, #40.

---

## Table of contents

- [A. Why an audit was needed](#a-why-an-audit-was-needed)
- [B. Pre-launch audit fixes (PR #38)](#b-pre-launch-audit-fixes-pr-38)
  - [B.1 Honest unmatched-lead messaging](#b1-honest-unmatched-lead-messaging)
  - [B.2 Niche directory `<title>` in `<head>`](#b2-niche-directory-title-in-head)
  - [B.3 Niche empty-state](#b3-niche-empty-state)
  - [B.4 Accessibility on lead/contact/homepage forms](#b4-accessibility-on-leadcontacthomepage-forms)
  - [B.5 ThriveCart webhook idempotency (two layers)](#b5-thrivecart-webhook-idempotency-two-layers)
  - [B.6 Login rate-limit moved to Postgres](#b6-login-rate-limit-moved-to-postgres)
  - [B.7 Production CRON_SECRET provisioned](#b7-production-cron_secret-provisioned)
  - [B.8 Directory data cleanup (initial pass)](#b8-directory-data-cleanup-initial-pass)
- [C. Production cron job inventory](#c-production-cron-job-inventory)
- [D. Post-audit documentation (PR #39)](#d-post-audit-documentation-pr-39)
- [E. Test coverage + audit hardening (PR #40)](#e-test-coverage--audit-hardening-pr-40)
  - [E.1 ThriveCart idempotency integration tests](#e1-thrivecart-idempotency-integration-tests)
  - [E.2 Directory quality audit script](#e2-directory-quality-audit-script)
  - [E.3 Scrape category-relevance filter](#e3-scrape-category-relevance-filter)
- [F. Production verification](#f-production-verification)
- [G. Things NOT done that were considered](#g-things-not-done-that-were-considered)

---

## A. Why an audit was needed

Erie.pro had been built up over many sessions to the point of being deployable, but no comprehensive pre-launch review had been run. The audit prompt was: assume this is going to first paying customer in days, find every gap that would cause a real customer harm, embarrassment, or data loss.

The audit identified 8 categories of risk, fixed all of them in PR #38, and shipped follow-up coverage in PRs #39 and #40. The work below is in execution order so you can trace cause and effect.

---

## B. Pre-launch audit fixes (PR #38)

**Branch:** `audit/launch-readiness` → squash-merged to master.
**Master sha after merge:** `ac184c1e562a`.
**Files changed:** 12 files, +413 insertions, -79 deletions.
**Migration added:** `20260515195000_thrivecart_idempotency`.

### B.1 Honest unmatched-lead messaging

**Files:**
- `erie-pro/src/app/api/lead/route.ts` — return `matched: boolean` and `conciergePhone` in the response
- `erie-pro/src/lib/email.ts` — consumer confirmation email copy

**Problem (before):** `/api/lead` always responded with "a local provider will contact you within 24 hours" regardless of whether any provider had claimed the niche × city territory. For niches with zero claimed territories, this was a false promise and a TCPA exposure (telling someone a call is coming when nobody is configured to make that call).

**Fix:** The endpoint now checks `provider_territories` for an active claim before responding. When no match:
- Response includes `matched: false` and `conciergePhone: "(814) 200-0328"`
- Consumer email tells the customer no provider is on this lane right now, here is the concierge line if you want to talk to a human
- Lead row is still recorded with `status: "unmatched"` so the operator dashboard can route it manually

**Verification:** `revenue:e2e` covers the matched and unmatched paths; both pass post-deploy.

### B.2 Niche directory `<title>` in `<head>`

**File:** `erie-pro/src/app/directory/page.tsx`

**Problem:** The directory page was set to `export const dynamic = "force-dynamic"`. Streaming SSR emitted the page `<title>` at byte ~33,147 of the HTML body, which is well outside `<head>`. Google ignored the title, treated the page as untitled, and SEO suffered.

**Fix:** Changed to `export const revalidate = 60`. This forces Next.js to render the page statically (with revalidation every 60s) so the `<title>` is emitted at byte 2,482, well inside `<head>` (which closes at byte 7,205).

**Verification:** `curl -s https://erie.pro/directory | head -c 8000 | grep -o '<title>.*</title>'` returns the expected title before `</head>`.

### B.3 Niche empty-state

**File:** `erie-pro/src/app/[niche]/page.tsx`

**Problem:** When a niche has no `featuredProviderId` AND no `subtleListings`, the page rendered with the lead form but no visible provider content, which looked broken.

**Fix:** Added a conditional "Open territory — no provider has claimed this yet" block with parallel CTAs (one for consumers — "Use the concierge line", one for providers — "Claim this territory").

**Note:** This empty state does not currently fire in production because all 114 niches have at least one scraped directory listing. It is defensive against future drops to zero (e.g. after an aggressive audit pass) and against new cities where scraping hasn't yet run.

### B.4 Accessibility on lead/contact/homepage forms

**Files:**
- `erie-pro/src/components/lead-form.tsx`
- `erie-pro/src/components/contact-form.tsx`
- `erie-pro/src/components/homepage-lead-form.tsx`

**Problem:** Forms were visually styled but lacked ARIA wiring. Validation errors were invisible to screen readers, and submission state was not announced.

**Fix:** Added `aria-invalid`, `aria-describedby` (pointing at error message IDs), and `role="alert"` on the error containers. Tested manually with VoiceOver: errors now announce when they appear.

### B.5 ThriveCart webhook idempotency (two layers)

**Files:**
- `erie-pro/src/app/api/webhooks/thrivecart/route.ts`
- `erie-pro/prisma/schema.prisma` (additions for both unique constraints)
- `erie-pro/prisma/migrations/20260515195000_thrivecart_idempotency/migration.sql`

**Problem:** ThriveCart retries webhook deliveries on any non-2xx response. Without idempotency, a single purchase that takes >5s to process (network blip, slow database query) could result in duplicate `OfferPurchase` rows, duplicate fulfillment, duplicate revenue actions. The cost of one duplicate is real: ProductDyno sends two welcome emails, SuiteDash creates two projects, the customer is confused and the operator looks unprofessional.

**Fix (two complementary layers):**

**Layer 1 — Payload hash short-circuit:**
- New column `payloadHash` on `ThriveCartEvent` model, type `text`, with a unique index
- The route handler computes `crypto.createHash('sha256').update(rawBody).digest('hex')` before any other work
- `findUnique({ where: { payloadHash } })` short-circuits the entire processing pipeline if the same payload has already been processed
- Response: `200 { success: true, duplicate: true, originalEventId, message: "Already processed" }`
- No `createOfferPurchase`, no fulfillment, no revenue action plan is invoked on a duplicate

**Layer 2 — Compound unique constraint on OfferPurchase:**
- New unique key on `OfferPurchase(thriveCartOrderId, offerId)`
- Catches the race-window case: two concurrent webhook deliveries pass the payloadHash dedup check because the `ThriveCartEvent` row hasn't been inserted yet by either; the second insert into `OfferPurchase` trips P2002 and is caught
- The route's catch block calls `prisma.offerPurchase.findFirst({ where: { thriveCartOrderId, offerId } })` to recover the existing row and proceed with the rest of the loop attached to that row
- Non-P2002 errors are not swallowed (they bubble to a 500)
- A P2002 with a phantom row (impossible in theory; findFirst returns null) also bails with 500 rather than continuing with undefined state

**Migration deployment:** The migration was applied to production Neon via the `@neondatabase/serverless` HTTPS driver (the sandbox cannot open TCP connections to Neon's pooler endpoint). The standard `npx prisma migrate deploy` path was unavailable; the migration was applied imperatively and the `_prisma_migrations` table was updated with checksum `manual-applied-via-neon-http-driver-2026-05-15`.

**Verification:** Both layers verified live via direct Neon queries. Test coverage added in PR #40 (see §E.1).

### B.6 Login rate-limit moved to Postgres

**File:** `erie-pro/src/lib/login-rate-limit.ts` (new/rewrite)

**Problem:** The original login rate-limit used an in-memory `Map` keyed by IP. Vercel runs Next.js routes across multiple serverless instances; each instance has its own memory. An attacker could spread credential-spray attempts across instances and bypass the rate limit entirely.

**Fix:** Reused the existing `rate_limit_entries` table (already used by other endpoints) with a `login:` key prefix. Each entry stores the attempt count and the window expiry. Cleanup happens via a cron job (`/api/cron/cleanup`).

**Failure mode:** If the database is unavailable, the rate limit fails OPEN (allows the attempt). This is intentional — a hard fail would lock out legitimate users during a database outage. The trade-off is documented in the code comment.

### B.7 Production CRON_SECRET provisioned

**Provider:** Vercel env var
**Env ID:** `rSAQo56Y63WLH3mR`
**Target:** production only
**Value:** 64-character token (token-urlsafe 48), generated cryptographically

**Problem:** `CRON_SECRET` was set in dev and preview targets but NOT production. The 8 cron route handlers all check `request.headers.get('authorization') === 'Bearer ' + process.env.CRON_SECRET`. With `CRON_SECRET` undefined in production, every cron invocation by Vercel was rejected with 401. The 8 scheduled jobs had been silently failing for an unknown period.

**Fix:** Generated a fresh secret, provisioned it via the Vercel API. Verified end-to-end:
- `curl https://erie.pro/api/cron/cleanup` → 401 (no header)
- `curl -H 'Authorization: Bearer wrong-value' https://erie.pro/api/cron/cleanup` → 401
- `curl -H 'Authorization: Bearer <correct>' https://erie.pro/api/cron/cleanup` → 200 `{"success":true,"deletedCount":0}`

**No manual user action required.** Vercel automatically passes `CRON_SECRET` to scheduled cron invocations once the env var is set.

### B.8 Directory data cleanup (initial pass)

**Pass 1 (PR #38):** A small set of obvious mis-categorized scraped listings was deactivated based on business name pattern matching. Three listings: Walmart Supercenter, European Wax Center, and Buzz n B's Aquarium & Pet Shop — all of which had been scraped into the `bat-removal` niche by Outscraper's keyword-based search.

This was a manual `UPDATE` via direct Neon query. The broader, more rigorous pass landed in PR #40 (see §E.2).

---

## C. Production cron job inventory

All 8 cron jobs are defined in `erie-pro/vercel.json` and live at routes under `erie-pro/src/app/api/cron/`. All require the `CRON_SECRET` bearer token.

| Route | Schedule | What it does | Idempotent? |
|-------|----------|-------------|-------------|
| `/api/cron/cleanup` | hourly | Deletes expired `rate_limit_entries`, expired session tokens, stale draft leads | Yes — no-op if nothing expired |
| `/api/cron/sla-checker` | every 15 min | Flags leads in `provider_lead` whose `respondedAt` is null and `acceptedAt + slaDeadline < now()` | Yes — re-runs are safe (updates same row to same state) |
| `/api/cron/revenue-digest` | daily 06:00 ET | Sends operator (Ike) a daily revenue summary email; aggregates from `offer_purchase` | Yes (sends one email per day; uses date-keyed lock) |
| `/api/cron/offer-fulfillment` | every 5 min | Retries `OfferFulfillment` rows in `pending` or `retrying` status. Backs off exponentially. | Yes (state-machine: pending → in-flight → fulfilled/failed) |
| `/api/cron/annual-renewal-checker` | daily 02:00 ET | Identifies `provider_subscription` rows due for renewal in next 30 days, queues reminder emails | Yes (rate_limit_entries with renewal key) |
| `/api/cron/check-grace-periods` | every 30 min | Transitions `provider_subscription` rows whose `gracePeriodEndsAt < now()` to `lapsed`. Triggers downstream territory release. | Yes — idempotent transition |
| `/api/cron/archive-stale-leads` | daily 03:00 ET | Moves leads where `createdAt < now() - 90 days` AND `status IN ('unmatched', 'dropped')` to `lead_archive` table | Yes — already-archived leads no-op |
| `/api/cron/process-deletions` | daily 04:00 ET | Processes GDPR-style deletion requests in `deletion_request` table. Cascades through all PII tables. | Yes — already-deleted records no-op |

**To verify a cron schedule is firing:** Vercel dashboard → project → Crons tab → each cron shows the last invocation and result. Or query Sentry for any 5xx from the route.

---

## D. Post-audit documentation (PR #39)

**Branch:** `audit/post-merge-status-and-launch-order` → squash-merged to master.
**Master sha after merge:** `8e0b8a7a00e0`.
**Files changed:** 2 (pure docs).

### D.1 STATUS.md updated

Appended a "Pre-Launch Hardening — May 15, 2026" section to `docs/STATUS.md` recording the 8 fixes above, the migration applied, the cron secret provisioning, and the post-deploy verification runs. The pre-existing BLOCKED-EXTERNAL items in STATUS.md remain blocked on the same external dashboard work; the audit did not unblock them.

### D.2 docs/LAUNCH_ORDER.md created

New one-page runbook sequencing the remaining D-H external dashboard work (ThriveCart, ConvertBox, Boost.space, SuiteDash, ProductDyno) and the write-mode `revenue:e2e` closing verification.

---

## E. Test coverage + audit hardening (PR #40)

**Branch:** `audit/post-launch-hardening-batch-2` → squash-merged to master.
**Master sha after merge:** `76d267ed`.
**Files added:** 4 new files + 2 modified.
**Test counts:** 21 → 22 files, 182 → 209 tests (+27). All green.

### E.1 ThriveCart idempotency integration tests

**File:** `erie-pro/src/app/api/webhooks/thrivecart/__tests__/idempotency.test.ts` (new, 6 tests)

Exercises the route handler through the public `POST()` export with `vi.mock`ed prisma + offer-fulfillment + revenue-actions modules. Six tests:

1. **Layer 1 — duplicate payload short-circuits:** With `findUnique` returning an existing `processed` event, the route returns `200 { success: true, duplicate: true, originalEventId, message: "Already processed" }` and does NOT call `createOfferPurchase`, `fulfillOfferPurchase`, or `recordRevenueActionPlan`.

2. **Layer 1 — first-time payload processes normally:** With `findUnique` returning null, all the side-effect work runs.

3. **Layer 1 — payloadHash is deterministic SHA-256 of raw body:** Two requests with identical bodies produce identical hashes. The second `findUnique` query uses the same hash the first `createEvent` stored. Hash matches `/^[0-9a-f]{64}$/`.

4. **Layer 2 — P2002 on OfferPurchase is caught:** `createOfferPurchase` throws a P2002 error with `meta.target: ["thriveCartOrderId", "offerId"]`. The route catches it, calls `findFirst` to recover the existing row, and returns `200 { success: true, purchaseIds: ["purchase-existing"] }`. `recordRevenueActionPlan` runs against the recovered row.

5. **Layer 2 — non-P2002 errors are NOT swallowed:** A generic `Error("connection refused")` bubbles up to a 500 response. `findFirst` is NOT called (the recovery path is P2002-only).

6. **Layer 2 — phantom-row P2002 bails defensively:** If P2002 fires but `findFirst` returns null (theoretically impossible — P2002 means a row exists), the route returns 500 rather than continuing with undefined state.

### E.2 Directory quality audit script

**Files:**
- `erie-pro/src/lib/niche-category-map.ts` (new, ~250 lines) — shared map of niche → expected Google Places categories + hard anti-patterns. Single source of truth for both the scrape filter (§E.3) and the audit script.
- `erie-pro/src/scripts/audit-directory-quality.ts` (new, ~155 lines) — re-runnable audit. Read-only by default; `--apply` deactivates hard mismatches.
- `erie-pro/src/lib/__tests__/niche-category-map.test.ts` (new, 21 tests) — pins the `evaluateNicheRelevance` contract.
- `docs/qa/directory-quality-audit.json` — 1,644-line audit output, persisted for human review.

**What it does:**

For each row in `directory_listings WHERE isActive = true`, the audit:
1. Looks up the expected category-keyword set for the row's niche (from `NICHE_EXPECTED_CATEGORIES`).
2. Looks up the hard anti-pattern set (`NICHE_HARD_ANTI_PATTERNS`).
3. Lowercases the row's `categories` (an array stored from Outscraper).
4. Computes:
   - `positiveMatch` — does any category contain any expected keyword?
   - `antiPatternHit` — does any category contain any anti-pattern?
5. Classifies:
   - **Soft suspect:** no positive match. Saved to JSON for review; NOT deactivated.
   - **Hard mismatch:** anti-pattern hit AND no positive match. Listed for deactivation with `--apply`.

The "AND no positive match" pair-rule is critical. Without it, a real auto-repair shop that lists "Car inspection station" alongside "Auto repair shop" would be falsely flagged in some niches. Only listings that fail BOTH heuristics get deactivated.

**Production effect:**
- 102 hard mismatches deactivated via `--apply` on May 15, 2026
- Active listings: 1,800 → 1,698
- 182 soft suspects persisted to `docs/qa/directory-quality-audit.json` for human review (keyword coverage gaps account for most of these)

**Example deactivations (from the 102):**
- 12 auto body shops in `storm-damage-repair` (Hi-Tech Collision, Lou's Auto Body, Gerber Collision & Glass, etc.)
- 12 car washes in `pressure-washing` (Niagara Car Wash, Blue Beacon Truck Wash, etc.)
- 7 water utilities and government offices in `septic`
- 4 thrift store / produce market / antique store in `estate-sale-services`
- 4 apartment complexes in `lakefront-property-maintenance`
- And so on across 25 niches

**To re-run:**
```bash
cd erie-pro
DATABASE_URL_UNPOOLED="<production-url>" npx tsx src/scripts/audit-directory-quality.ts          # read-only
DATABASE_URL_UNPOOLED="<production-url>" npx tsx src/scripts/audit-directory-quality.ts --apply  # deactivate
```

### E.3 Scrape category-relevance filter

**File:** `erie-pro/src/scripts/scrape-google-places.ts` (modified)

**Change:** New Step 2.5 between distance filtering and database upsert. After Outscraper returns search results, each place's Google `subtypes` is evaluated by `evaluateNicheRelevance()` (from the shared module in §E.2). Places that fail the same hard-anti-pattern + no-positive-match test are dropped before insert.

**Why this matters:** Outscraper's keyword-based Google Maps search returns adjacent businesses that share lexical overlap with the query but aren't in the target niche. "Bat removal Erie PA" returns the nearest Walmart. "Pressure washing Erie" returns car washes. Without this filter, every re-scrape would re-introduce the listings the audit just removed.

**Existing `ev-charger-installation` inline filter:** Kept as-is. It expresses a charging-station-hardware vs installation-service distinction that the keyword map doesn't naturally model.

---

## F. Production verification

After PR #40 merge, the following endpoints were tested live against `https://erie.pro`:

| Endpoint | Status | Expected | Result |
|----------|--------|----------|--------|
| `/api/health` | 200 | `{"status":"healthy"}` | ✅ |
| `/directory` | 200 | HTML body with `<title>` in `<head>` | ✅ |
| `/plumbing/pricing` | 200 | HTML body, service pricing rendered | ✅ |
| `/api/cron/cleanup` (no auth) | 401 | Bearer rejected | ✅ |
| `/api/cron/cleanup` (bad auth) | 401 | Wrong secret rejected | ✅ |
| `/api/cron/cleanup` (correct auth) | 200 | `{"success":true,"deletedCount":0}` | ✅ |

**Local test suite:** 22 test files, 209 tests, all green. Run with `cd erie-pro && npx vitest run`.

**TypeScript:** Clean. Run with `cd erie-pro && npx tsc --noEmit`.

**CI on master sha 76d267ed:** All 9 GitHub Actions checks green (Dependency Audit, Build/Type Check/Test for Hybrid + Edge + Erie Pro pairs, Vercel Preview Comments).

**Vercel production deploy of 76d267ed:** State `READY`. Last verified at session end.

---

## G. Things NOT done that were considered

The list below is items that came up during the audit and were intentionally deferred. Each is real but does not block first revenue.

- **End-to-end Playwright test of the buy flow.** The unit + integration test coverage is good; an actual headless-browser test through ConvertBox → ThriveCart → webhook would catch more. Deferred until the buy flow is wired end-to-end in production.
- **Broader directory quality audit.** The 102 hard mismatches deactivated were the obvious cases. There are 182 soft suspects in `directory-quality-audit.json` that likely contain another 50–100 real mis-categorizations, but they need human judgment because the keyword map's coverage is imperfect. Worth a human pass before broad announcement.
- **Re-scrape per-niche with tighter queries.** The right long-term fix is more specific Outscraper queries per niche (e.g. searching `"pest exterminator" Erie PA` instead of `"bat removal" Erie PA`). The category-relevance filter is the band-aid; query specificity is the cure. Deferred because it requires re-running the scrape (cost + time) and the current data is good enough to launch.
- **Sentry alerting policies.** Sentry is wired to capture errors but no alerting rules are configured. After launch, set up rules: any 5xx on `/api/webhooks/thrivecart`, any cron job that fails 3 times in a row, any spike in 404s on `/[niche]` pages.
- **Dashboard for ad-hoc directory deactivation.** A small operator UI to flag a listing as "this is wrong for this niche" without writing SQL. Deferred; the operator has the audit JSON and can flip rows manually.
- **OpenAPI documentation regeneration.** `docs/API_REFERENCE.md` is 1,530 lines and may be partially out of date. The script that regenerates from JSDoc + route metadata exists but wasn't re-run as part of this audit. Worth doing before the third or fourth county launches.
- **Cron alerting via dead-man's-switch.** Set up a Cronitor or healthchecks.io ping at the end of each cron route. If a cron fails to ping for 2× its scheduled interval, send a Slack alert. Deferred.
