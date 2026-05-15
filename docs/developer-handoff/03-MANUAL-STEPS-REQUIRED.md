# 03 — Manual Steps Required

Every action that cannot be performed by Claude or by a CI pipeline. Every step requires either Ike personally or a delegated developer/operator with the right credentials.

Steps are grouped by **when** they apply: one-time pre-launch, per-Erie.pro-launch, per-new-county-launch, and per-product-launch. The grouping matters because most steps are NOT recurring — they happen once for Erie and again for each new county.

**Legend:**
- 🔴 **Blocking** — first revenue cannot happen until this is done
- 🟡 **Important** — blocking for full functionality but not first dollar
- 🟢 **Nice-to-have** — quality-of-life or scaling

---

## SECTION A — One-time pre-launch (for ALL of lead-os, do once ever)

These have already been completed for Erie.pro. They do NOT need to be redone for new counties.

| # | Status | Step | Notes |
|---|--------|------|-------|
| A.1 | ✅ Done | Register `pinohu/lead-os` GitHub repo as the monorepo | Already public; PRs go through CI |
| A.2 | ✅ Done | Provision Neon Postgres shared cluster `ep-broad-grass-anm3zcv9-pooler` | Used by all county DBs |
| A.3 | ✅ Done | Set up Vercel team `team_fuTLGjBMk3NAD32Bm5hA7wkr` with Pro plan | Per-county projects all live under this team |
| A.4 | ✅ Done | Establish OHU Family Living Trust → PNR Holdings LLC → operating entities | Legal structure for receiving revenue |
| A.5 | ✅ Done | Purchase AppSumo lifetime licenses for SuiteDash, ConvertBox, Boost.space, ProductDyno, ThriveCart, Outscraper | All used across all counties |
| A.6 | ✅ Done | Set up Resend account for transactional email | Shared across counties |
| A.7 | ✅ Done | Configure Anthropic API account | Shared key across counties |
| A.8 | ✅ Done | Set up Sentry org + project | Per-county projects can be added |

---

## SECTION B — Pre-launch for Erie.pro (the prototype county)

**Status as of master sha `76d267ed`:** These are the items I (Claude, across three audit sessions on May 15) shipped or that the user must still do before first paying customer.

### B.1 — What Claude has shipped (no further action required) ✅

| # | Status | Item | Reference |
|---|--------|------|-----------|
| B.1.1 | ✅ Done | PR #38 — 8 pre-launch audit fixes (idempotency, accessibility, CRON_SECRET, etc.) | `01-AUDIT-WORK-COMPLETED.md` §B |
| B.1.2 | ✅ Done | PR #39 — STATUS.md + LAUNCH_ORDER.md updates | `01-AUDIT-WORK-COMPLETED.md` §D |
| B.1.3 | ✅ Done | PR #40 — ThriveCart idempotency tests + directory quality audit + scrape category filter | `01-AUDIT-WORK-COMPLETED.md` §E |
| B.1.4 | ✅ Done | Production `CRON_SECRET` provisioned and verified working | `01-AUDIT-WORK-COMPLETED.md` §B.7 |
| B.1.5 | ✅ Done | Directory data cleanup — 105 mis-categorized listings deactivated (3 obvious + 102 systematic) | `01-AUDIT-WORK-COMPLETED.md` §B.8 + §E.2 |
| B.1.6 | ✅ Done | All migrations applied to production Neon | Including `20260515195000_thrivecart_idempotency` |
| B.1.7 | ✅ Done | Production smoke tests pass | `01-AUDIT-WORK-COMPLETED.md` §F |

### B.2 — What you (Ike) must still do — the D-H dashboard work 🔴

These are the items in `docs/LAUNCH_ORDER.md`. Reproduced here for completeness because they are blocking first revenue. Each must be done from the respective vendor's dashboard.

#### B.2.D — ThriveCart products + checkout pages 🔴

**Estimated time:** 1–2 hours.
**Why blocking:** Without ThriveCart products configured, there is literally no checkout. First paying customer cannot happen.

1. Open `docs/external-setup/thrivecart.md` (overview) and `docs/external-setup/thrivecart/master-setup.json` (product catalog).
2. For each product slug in the JSON, create the matching product in ThriveCart:
   - **Critical:** product slug must match the JSON exactly. The code looks up products by slug.
   - Price must match the JSON value. Currency USD.
   - Webhook URL: `https://erie.pro/api/integrations/thrivecart/webhook` (this is the existing wired endpoint that already has the May 15 two-layer idempotency).
   - Success URL: `https://erie.pro/thank-you/{{ product_slug }}` (or a generic `/thank-you?order={{ order_id }}`).
   - Fulfillment: per product type. For PDFs, use ThriveCart native delivery. For subscriptions, leave fulfillment to the webhook-triggered ProductDyno flow.
3. In ThriveCart → Settings → API, copy the API key and verify it matches the value in Vercel's `THRIVECART_API_KEY` env var. If they differ, update Vercel.
4. Run the existing setup script to register the webhook:
   ```bash
   cd erie-pro && npx tsx src/scripts/setup-thrivecart.ts
   ```
   This subscribes each product to send events to `/api/integrations/thrivecart/webhook`.
5. **Verification — test purchase:** Use a $1 test product or apply a 100%-off coupon to a real product. Walk through the checkout. Verify:
   - The purchase appears in `offer_purchases` table (`SELECT * FROM offer_purchases ORDER BY "createdAt" DESC LIMIT 1`).
   - Re-sending the same webhook payload via ThriveCart's "Resend webhook" button does NOT create a duplicate row (Layer 1 idempotency working).
   - The `thrivecart_events` table has the event with a populated `payloadHash`.

#### B.2.E — ConvertBox boxes + targeting 🔴

**Estimated time:** 30–60 minutes.
**Why blocking:** Without ConvertBox active, lead capture moments on niche pages don't fire. Visitors come, browse, and bounce.

1. Open `docs/external-setup/convertbox.md` and `docs/external-setup/convertbox/placement-matrix.json`.
2. For each box in the matrix, in the ConvertBox dashboard:
   - Activate the box (default is paused).
   - Apply the targeting rules from the matrix. Targeting reads `ConvertBoxPageContext` which the Erie.pro pages emit client-side via `src/components/convertbox-page-context.tsx`. The contexts must match the matrix verbatim.
3. After all boxes are active, verify placement:
   ```bash
   cd erie-pro && npx tsx src/scripts/verify-convertbox-placement.ts
   ```
   The script hits 5 smoke pages on production and asserts each expected box ID is present in the response HTML.

#### B.2.F — Boost.space scenarios 🟡

**Estimated time:** 30–60 minutes.
**Why important but not strictly blocking:** Without Boost.space, lead capture works (ConvertBox → Erie.pro) and payment works (ThriveCart → Erie.pro), but the in-between orchestration is missing — leads don't auto-route, revenue actions don't trigger downstream notifications.

1. Open `docs/external-setup/boostspace.md` and `docs/external-setup/boostspace/revenue-action-scenarios.json` (this is a direct scenario export).
2. In Boost.space, create a workspace token (or use the existing one).
3. Import each scenario from the JSON. The destination endpoint must be the live `/api/integrations/boostspace/revenue-actions`.
4. Run one scenario manually and confirm it succeeds. The callback writes to `revenue_actions` table; verify with:
   ```sql
   SELECT * FROM revenue_actions ORDER BY "createdAt" DESC LIMIT 5;
   ```

#### B.2.G — SuiteDash object confirmation 🟡

**Estimated time:** 30–60 minutes.

1. Open `docs/external-setup/suitedash.md` and `docs/external-setup/suitedash/operational-sync-package.json`.
2. In SuiteDash, verify each object (project type, portal template, support pipeline, task template) exists with the slug listed in the package JSON. Create any missing ones.
3. No code work needed — the retrying/idempotent SuiteDash client (`src/lib/suitedash.ts`) handles the rest.

#### B.2.H — ProductDyno destination connections 🟡

**Estimated time:** ~30 minutes.

1. Open `docs/external-setup/offer-fulfillment.md` and `docs/external-setup/offer-fulfillment/fulfillment-channel-map.json`.
2. In ProductDyno, create each product/connection to match the channel map.
3. Copy the ProductDyno webhook URL into Vercel as the appropriate `PRODUCTDYNO_*` env var if not already present.
4. Send one test fulfillment via the existing `/api/cron/offer-fulfillment` cron route (manual trigger) and confirm delivery.

### B.3 — Closing verification 🟡

After B.2.D AND at least one of B.2.E / B.2.F / B.2.G is complete:

1. Pull production env to local:
   ```bash
   cd erie-pro
   vercel env pull .env.local --environment=production --yes
   ```
2. Run the write-mode end-to-end test:
   ```bash
   REVENUE_QA_WRITE=1 npm run revenue:e2e
   ```
3. Expected: **7 passed / 0 skipped / 0 failed.** (Currently runs 5 passed / 2 skipped because the synthetic ConvertBox submit and synthetic ThriveCart webhook need the dashboard config to flow through.)
4. Results land in `docs/qa/revenue-e2e-results.json`. If all green, the BLOCKED-EXTERNAL items in STATUS.md can be flipped to DONE-VERIFIED.

### B.4 — Optional follow-up work 🟢

| # | Item | Why optional |
|---|------|--------------|
| B.4.1 | Run broader directory quality review on the 182 soft suspects in `docs/qa/directory-quality-audit.json` | The 102 obvious ones are deactivated. The remaining are keyword-coverage gaps; human judgment needed. |
| B.4.2 | Configure Sentry alerting rules | Errors are captured; alerts not yet wired |
| B.4.3 | Set up dead-man's-switch cron monitoring (Cronitor or healthchecks.io) | Cron failures are silent today; logs visible in Vercel but no alert |
| B.4.4 | Regenerate `docs/API_REFERENCE.md` from JSDoc | The 1,530-line doc is partially stale; regeneration script exists but wasn't re-run |

---

## SECTION C — Per-new-county launch (every replication)

These steps repeat for every new county. The full procedure is in `02-COUNTY-REPLICATION-PLAYBOOK.md`; this section is the explicit manual-action subset.

### C.1 — Decide which county 🔴

1. Pick a county by Phase-0 criteria in the replication playbook (population, operator presence, competitive density).
2. Build the launch packet doc (city name, state, lat/lng, ZIPs, service area, tagline, domain).
3. Confirm Ike has bandwidth to do 5–10 cold provider outreach calls in this county. If not, defer.

### C.2 — Domain + DNS 🔴

1. Register `<county>.pro` at the registrar (Cloudflare/Namecheap/Porkbun).
2. Set nameservers to Cloudflare.
3. Create the Cloudflare zone. Leave apex A record empty until Vercel domain attachment.
4. Cost: ~$20/yr.

### C.3 — Add to city-registry 🔴

1. Branch off master.
2. Add the city entry to `erie-pro/src/lib/city-registry.ts` per the playbook §Phase 2 schema.
3. Run `cd erie-pro && npx tsc --noEmit && npx vitest run src/lib/__tests__/city-registry.test.ts` locally to verify.
4. Push, open PR, get CI green, merge.

### C.4 — Create Vercel project 🔴

1. Vercel dashboard → New Project → Import `pinohu/lead-os`.
2. Set root directory to `erie-pro`.
3. Set all the env vars listed in playbook §Phase 3.
4. Deploy (first attempt will fail because DB doesn't exist yet; that's expected).

### C.5 — Create Neon database 🔴

1. Neon dashboard → existing project → New database `<county>_pro`.
2. Copy pooled + unpooled connection strings.
3. Paste pooled into Vercel `DATABASE_URL`; paste unpooled into Vercel `DATABASE_URL_UNPOOLED` and `DIRECT_URL`.
4. Apply migrations from your local shell:
   ```bash
   cd erie-pro
   DATABASE_URL="<unpooled-url>" npx prisma migrate deploy
   ```

### C.6 — Attach domain in Vercel 🔴

1. Vercel project → Settings → Domains → Add `<county>.pro` and `www.<county>.pro`.
2. Vercel shows DNS records to create.
3. Create them in Cloudflare.
4. Wait for green checkmarks.

### C.7 — Provision CRON_SECRET for this county's production 🔴

1. Generate a fresh secret:
   ```bash
   python3 -c "import secrets; print(secrets.token_urlsafe(48))"
   ```
2. Add to Vercel: production target only, env var name `CRON_SECRET`.

### C.8 — Trigger fresh production deploy 🔴

1. Vercel → Deployments → Redeploy with latest master sha.
2. Verify:
   - `curl https://<county>.pro/api/health` → 200
   - `curl -H "Authorization: Bearer <secret>" https://<county>.pro/api/cron/cleanup` → 200

### C.9 — Seed niches + service areas 🔴

```bash
cd erie-pro
CITY_SLUG=<county> DATABASE_URL_UNPOOLED="<unpooled>" \
  npx tsx src/scripts/seed-niches.ts
CITY_SLUG=<county> DATABASE_URL_UNPOOLED="<unpooled>" \
  npx tsx src/scripts/seed-service-areas.ts
```

### C.10 — Outscraper scrape (initial pass) 🔴

```bash
cd erie-pro
CITY_SLUG=<county> \
DATABASE_URL_UNPOOLED="<unpooled>" \
OUTSCRAPER_API_KEY="<key>" \
npx tsx src/scripts/scrape-google-places.ts --all-niches
```

Cost: ~$3–$8 in Outscraper credits.

### C.11 — Post-scrape directory audit 🟡

```bash
CITY_SLUG=<county> DATABASE_URL_UNPOOLED="<unpooled>" \
  npx tsx src/scripts/audit-directory-quality.ts --apply
```

### C.12 — ThriveCart, ConvertBox, Boost.space, SuiteDash, ProductDyno (per-county adjustments) 🟡

See playbook §Phases 8–11 for details. Most products are global; county-specific configs are minimal.

### C.13 — Provider outreach + soft launch 🔴

This is the ongoing operational work. 5–10 cold provider calls per county before any public marketing. No code involved.

### C.14 — Production smoke + revenue:e2e 🔴

```bash
CITY_SLUG=<county> REVENUE_QA_WRITE=1 npm run revenue:e2e
```

Expected: 7/7 green.

---

## SECTION D — Per-product launch (each PDF / package / subscription)

These steps apply to launching a new digital product. The first instance is **the $47 SuiteDash PDF** — see also `05-SUITEDASH-PDF-RELEASE.md`.

### D.1 — Source-repo visibility 🔴

If the product's source material is in a public repo (the SuiteDash PDF source is at `pinohu/SuiteDash`), make that repo private before launching.

1. Go to `https://github.com/pinohu/SuiteDash/settings`.
2. Scroll to Danger Zone → Change visibility → Make private.
3. Confirm by typing the repo name.

### D.2 — ThriveCart product creation 🔴

1. ThriveCart → Products → Create new.
2. Use the exact configuration from the product's launch spec (e.g. `docs/developer-handoff/05-SUITEDASH-PDF-RELEASE.md` §ThriveCart).
3. Upload the PDF file to ThriveCart's native file delivery.
4. Set the success URL on the new county domain (`erie.pro/thank-you/suitedash` for the first PDF).
5. Set the webhook URL only if you want the erie.pro DB to capture this purchase. For v1 PDFs, ThriveCart native delivery is enough and the webhook can be skipped.
6. Generate the cart URL. Save it.

### D.3 — Post-purchase + abandonment email copy 🔴

1. In ThriveCart → Product → Email options:
   - Successful purchase email: paste the copy from the product's launch spec.
   - Cart abandonment email: paste the abandoner copy. Enable after-4-hours trigger.

### D.4 — Sales page 🔴

1. Build the sales page at the chosen URL (e.g. `erie.pro/suitedash`).
2. Use the copy from the product's launch spec verbatim. Don't improvise.
3. Wire the primary CTA button to the ThriveCart cart URL.

### D.5 — ConvertBox capture (optional) 🟡

If the product's marketing strategy uses ConvertBox capture:

1. Create the boxes per the product's launch spec.
2. Set targeting rules.
3. Wire the capture-success redirect to the ThriveCart cart URL with `passthrough_email` populated.

### D.6 — Test purchase 🔴

1. Use a 100%-off coupon or a $1 test product variant.
2. Walk through the full flow: sales page → cart → checkout → success page → email delivery.
3. Verify the file downloads from the email link.

### D.7 — Soft launch 🔴

1. Post on r/<relevant-subreddit> with the social-referral ConvertBox variant link.
2. Post on the relevant Facebook group.
3. Reply to AppSumo product page comments for related products.
4. **Do not broadcast until you have 5–10 early buyers and at least 1–2 testimonials.**

### D.8 — Broader announcement 🟢

After 5–10 buyers and ≥1 positive review:

1. Indie Hackers post.
2. Twitter/X thread.
3. LinkedIn post (Ike's authority site already has `ikeohu.com` with the Six-Lane Authority Strategy live).
4. Add to ikeohu.com `/resources` or `/products` page.

---

## SECTION E — Recurring operational tasks (after launch)

These tasks recur indefinitely after a county is launched.

### E.1 — Weekly 🟢

| Task | How | Why |
|------|-----|-----|
| Review lead volume per niche | `SELECT niche, COUNT(*) FROM leads WHERE "createdAt" > now() - interval '7 days' GROUP BY niche ORDER BY 2 DESC` | Identify which niches deserve more provider acquisition |
| Review unmatched leads | Operator dashboard at `/dashboard/leads?status=unmatched` | These need concierge attention; failure to follow up hurts the brand |
| Check Vercel cron health | Vercel dashboard → project → Crons tab | Catch silent failures |

### E.2 — Monthly 🟡

| Task | How | Why |
|------|-----|-----|
| Re-run directory quality audit | `npx tsx src/scripts/audit-directory-quality.ts` | Deactivate any new mis-categorizations |
| Refresh top-N niches' Google Places data | `npx tsx src/scripts/scrape-google-places.ts --niches=plumbing,hvac,electrical` (top revenue niches) | Keep ratings and review counts current |
| Review Sentry error rates | Sentry dashboard | Spot trends before they become problems |
| Reconcile ThriveCart revenue vs `offer_purchase` table | SQL: `SELECT SUM(amount) FROM offer_purchase WHERE "purchasedAt" > date_trunc('month', now())` vs ThriveCart dashboard | Catch missed webhook deliveries |

### E.3 — Quarterly 🟢

| Task | How | Why |
|------|-----|-----|
| Run broader audit work review | This handoff `04-CURRENT-GAPS-AND-FUTURE-WORK.md` | Re-prioritize backlog |
| Renew or extend Outscraper credits | Outscraper dashboard | Cheaper in bulk |
| Backup verification | Test restore from a Neon point-in-time backup | Hope you never need it |

---

## SECTION F — Emergency / on-call procedures

### F.1 — Production is down 🔴

1. Check `https://erie.pro/api/health`. If non-200:
2. Check Vercel deployments page — any recent failed deploy?
3. If yes, **roll back** via Vercel dashboard → Deployments → previous READY deploy → "Promote to production". See `docs/ROLLBACK.md` for full procedure.
4. Notify Ike via Signal or text.

### F.2 — Cron jobs are not firing 🔴

1. Check Vercel dashboard → Crons. Each cron shows last invocation.
2. If `Last run` is older than the schedule by 2x:
3. Check the cron route directly: `curl -H "Authorization: Bearer <CRON_SECRET>" https://erie.pro/api/cron/cleanup`. Should return 200.
4. If 401, the CRON_SECRET in Vercel env doesn't match what Vercel is sending. Regenerate via Phase 5 / Phase C.7 procedure.
5. If 500, check Sentry for the underlying error.

### F.3 — Webhook deliveries failing 🔴

1. Check ThriveCart → Webhooks → recent deliveries. Look for non-2xx responses.
2. Investigate the failing URL directly: `curl -X POST <webhook-url> -d <payload>`.
3. If the issue is on Erie.pro side, check Vercel logs for that route. Roll back if a recent deploy broke it.

### F.4 — Database is down 🔴

1. Neon status page: `https://neon.tech/status` (or whatever the current URL is).
2. If Neon is up but the app can't reach it: check the connection string in Vercel env vars hasn't been corrupted.
3. The login rate-limit fails OPEN intentionally; other operations will 500. Roll back is rarely the answer here; wait for Neon to recover.

### F.5 — Disputes / refund requests 🟡

1. For a PDF refund (within 7-day window), refund via ThriveCart → Order → Refund full amount.
2. For a subscription refund, evaluate manually; consult the offer's refund policy.
3. Record the refund reason in the operator dashboard (manual note field) for pattern analysis.

---

## Summary — what's blocking what

**Blocking first paying customer on Erie.pro:**

- B.2.D (ThriveCart products) — there is no checkout without this
- B.2.E (ConvertBox boxes) — there's no lead capture
- B.2.F (Boost.space scenarios) — orchestration in between is missing (workaround: manual)
- B.3 (closing verification) — confirms the whole path works

**Blocking first new county replication:**

- C.1 (decide which county) — operational decision
- C.2 through C.10 (technical setup) — all required
- C.13 (provider outreach) — required for sustainable launch

**Blocking SuiteDash PDF launch:**

- D.1 (make `pinohu/SuiteDash` private) — leaks source otherwise
- D.2 (ThriveCart product) — no checkout otherwise
- D.4 (sales page) — nowhere to convert
- D.6 (test purchase) — verify everything works

Everything else is "important but not blocking."
