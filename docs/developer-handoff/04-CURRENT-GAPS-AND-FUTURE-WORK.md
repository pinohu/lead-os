# 04 — Current Gaps and Future Work

Honest accounting of what is incomplete in the codebase as of master sha `76d267ed`. Prioritized so the next developer (or future Claude session) can pick up the highest-leverage items first.

The list is exhaustive — if it's not here, it's either done or out of scope. If you find something missing, append it.

---

## Categories

- 🔴 **Blocks first revenue** — must be done before Erie.pro's first paying customer
- 🟡 **Blocks confident scaling** — must be done before launching county #2 / county #3
- 🟢 **Quality of life** — improves operations once running but not strictly required
- 🔵 **New capabilities** — features that aren't yet in scope but have been mentioned

---

## A. Blocks first revenue 🔴

### A.1 — D-H external dashboard work

**What:** ThriveCart products, ConvertBox boxes, Boost.space scenarios, SuiteDash objects, ProductDyno destinations. See `03-MANUAL-STEPS-REQUIRED.md` §B.2 for the full procedure.

**Status:** Not started in dashboards. The code is ready and waiting. The setup-package JSON files in `docs/external-setup/` are the canonical specs.

**Effort:** 3–4 hours of Ike's time across the five dashboards.

**Why it's blocking:** Without ThriveCart products, there is no checkout. Without ConvertBox boxes, there is no lead capture. The other three (Boost, SuiteDash, ProductDyno) can be done in parallel with the first conversions.

### A.2 — First-paying-customer verification

**What:** Run `REVENUE_QA_WRITE=1 npm run revenue:e2e` after A.1 is partially complete. Expected: 7/7 pass.

**Status:** Read-only mode runs 5/7 today. Write mode requires A.1 to flow through.

**Effort:** 15 minutes after A.1 is done.

**Why it's blocking:** This is the closing verification that the entire revenue spine works end-to-end. Without it, the first sale could fail silently.

---

## B. Blocks confident scaling 🟡

### B.1 — CLI generator for new counties

**What:** A script `scripts/new-city.ts` that does Phases 2–6 of the replication playbook in one command.

**Current state:** Each phase is manual. A senior developer following the playbook takes ~4–6 hours per county.

**Target state:** `npx tsx scripts/new-city.ts --slug=meadville --state=PA --population=13388 --lat=41.6412 --lng=-80.1517` provisions:
- The city-registry entry (or asks for a PR)
- The Vercel project (via Vercel API)
- The Neon database (via Neon API)
- The DNS records (via Cloudflare API)
- The env-var population (via Vercel CLI)
- The migrations (via Prisma)
- The seed scripts

Each external API exists; this is integration work, not new architecture.

**Effort:** 2–3 days for a senior dev. Should land before county #3.

**Why it's important:** Manual replication doesn't scale to 3,143 counties. Even at 10 counties, the per-county manual time is the binding constraint on launch velocity.

### B.2 — Wildcard ConvertBox targeting + global Boost.space scenarios

**What:** Move from per-county boxes/scenarios to wildcard/dynamic ones.

**Status:** Currently per-county. Each new county requires duplicating boxes and scenarios in two dashboards.

**Target:** ConvertBox boxes target `https://*.pro/*` instead of `https://erie.pro/*`. Boost.space scenarios read a `county` field from inbound payloads and dynamically route.

**Effort:** 30 minutes for ConvertBox; 2–3 hours for Boost.space (the existing scenarios need to be redesigned with a router node).

**Why it's important:** Eliminates the per-county dashboard tax — saves 45–90 minutes per county replication.

### B.3 — Per-county Sentry projects

**What:** Each new county gets its own Sentry project so errors are tagged by county.

**Current state:** All counties (currently just Erie) report into one Sentry project.

**Target:** A Sentry org-level setup automation that creates a new project per `CITY_SLUG`. Or accept that all errors go to one project and filter by URL tag.

**Effort:** 2 hours for automation; 0 if accepting tag-based filtering.

**Why it's important:** Without per-county tagging, error volume aggregates and it's hard to tell which county is having problems.

### B.4 — Outscraper cost optimization

**What:** Tighter Outscraper queries per niche so initial scrapes return fewer adjacent businesses and use less API budget.

**Current state:** Queries are `"<niche-display> <city> <state>"`. Cost per county: $3–$8.

**Target:** Niche-specific query templates that return narrower results. E.g. for `bat-removal`, use `"pest exterminator wildlife removal <city>"` instead of `"bat removal <city>"`. Should drop the adjacent-business hit rate and let us scrape with `--skip-reviews=false` for fewer dollars.

**Effort:** 2–3 hours; mostly research and per-niche query crafting.

**Why it's important:** At 3,143 counties × $3–$8 per county, the total is $9k–$25k. Cutting this in half saves real money.

---

## C. Quality of life 🟢

### C.1 — Operator dashboard for ad-hoc listing deactivation

**What:** A small UI under `/dashboard/directory` where the operator can mark a listing as wrong-for-niche without writing SQL.

**Current state:** Audit script catches systematic issues. One-off cases require manual `UPDATE directory_listings SET "isActive" = false WHERE id = '...'`.

**Effort:** 4–8 hours for a competent React/Next.js developer.

### C.2 — Sentry alerting policies

**What:** Configure Sentry to send Slack/email alerts on:
- Any 5xx on `/api/webhooks/thrivecart`
- Any cron job that fails 3 times in a row
- Spikes in 404s on `/[niche]` pages
- New error types appearing for the first time

**Current state:** Errors captured; no alerts.

**Effort:** 1–2 hours.

### C.3 — Cron dead-man's-switch

**What:** Each cron route pings Cronitor/healthchecks.io at the end of a successful run. If the ping is missed for >2× the schedule, Cronitor alerts.

**Current state:** Cron failures are silent except in Vercel logs.

**Effort:** 1 hour wiring + 30 min Cronitor account setup.

### C.4 — API reference regeneration

**What:** Re-run the OpenAPI generator so `docs/API_REFERENCE.md` matches current routes.

**Current state:** The 1,530-line doc is partially stale.

**Effort:** 30 minutes (find and run the existing script).

### C.5 — Production data backup verification drill

**What:** Test restoring a Neon point-in-time backup to a scratch database, verify the data is intact.

**Current state:** Backups exist; never tested.

**Effort:** 2 hours including cleanup.

### C.6 — Provider-side Sentry / analytics

**What:** Provider portal events (login, claim territory, accept lead) tracked via Plausible or PostHog.

**Current state:** Server-side traffic logged; no funnel analytics.

**Effort:** 4 hours.

### C.7 — A11y audit

**What:** Run axe-core or Wave against the top 20 pages and address findings.

**Current state:** PR #38 fixed the three lead/contact/homepage forms. The rest of the site has not been audited.

**Effort:** 6–8 hours including fixes.

---

## D. New capabilities (mentioned but not in scope) 🔵

### D.1 — Vertical expansion (legal, real estate, etc.)

**What:** Beyond county replication, replicate to different verticals (lawyers, real estate agents, contractors at scale).

**Current state:** Erie.pro is a general professional-services directory. The 114 niches are home-services-heavy. A legal vertical would be a different niche set, different routing, different SLA expectations.

**Effort:** 2–4 weeks for the first vertical. Each subsequent vertical is faster as the abstraction matures.

**Why not in scope yet:** County replication has to prove out first. Vertical expansion compounds risk.

### D.2 — Provider self-serve onboarding flow

**What:** A provider can sign up, claim a territory, and pay for a subscription without operator involvement.

**Current state:** Provider signup is partially manual — Ike adds them to the system after a sales call.

**Effort:** 2–3 weeks.

**Why not in scope yet:** Hand-holding the first 50 providers per county is the right move for quality. Self-serve makes sense after the product has been validated.

### D.3 — Lead scoring + dynamic SLA

**What:** Inbound leads scored by intent (urgency keywords, budget mentioned, contact-method preference). High-intent leads go to top providers with tighter SLAs.

**Current state:** All leads are equal. SLA is fixed at 24 hours per niche tier.

**Effort:** 1–2 weeks. Requires Claude API integration for classification + a UI to display the score in the dashboard.

### D.4 — Multi-county provider memberships

**What:** A provider operating across 3 counties can pay once and serve all 3, with automatic split-routing of leads.

**Current state:** Each county is a separate deployment; a multi-county provider would need 3 subscriptions.

**Effort:** 1–2 weeks. Requires a cross-county lookup layer in the kernel.

### D.5 — Operator mobile app

**What:** iOS/Android app for the operator to claim/route/dismiss leads on the go.

**Current state:** Operator dashboard is web-only.

**Effort:** 4–6 weeks for a basic Expo app.

**Why not in scope yet:** Volume doesn't justify it. Single operator with desktop access is enough for the first 100 leads/day.

### D.6 — Public API

**What:** Documented public API for third-party integrations (e.g. an external CRM pulling leads, a chatbot platform submitting leads).

**Current state:** Routes exist and are documented internally; no rate-limited public auth or developer portal.

**Effort:** 1–2 weeks plus ongoing maintenance.

### D.7 — White-label deployment

**What:** Re-skin Erie.pro for a partner brand (e.g. a local chamber of commerce wants its own version).

**Current state:** No tenancy model beyond `CITY_SLUG`. White-labeling would require additional theming and admin role customization.

**Effort:** 2–3 weeks for the first one; faster after.

---

## E. Things that look like gaps but are not

These are items that may seem like obvious gaps but are intentionally not done. Don't be surprised.

### E.1 — No Stripe integration

**Why:** Payment goes through ThriveCart, which handles Stripe (and PayPal, and others) on the back end. Building a parallel Stripe integration would be duplicate code.

### E.2 — No mobile app

**Why:** Mobile traffic to local-services pages converts well via mobile web. An app would be premature. (See D.5.)

### E.3 — No 24/7 chat support

**Why:** Concierge phone covers the high-touch cases. An LLM chat for the rest is on the post-launch roadmap but not blocking.

### E.4 — No multi-language

**Why:** Erie is English-speaking. Per-county expansion may eventually require Spanish in some markets (Phoenix, Miami), but it's not a Phase-1 requirement.

### E.5 — No legal review of SLA / privacy policy

**Why:** Standard templates are in `/legal/`. A full legal review is appropriate before the third or fourth county to ensure compliance across multiple states.

---

## F. The behavioral footnote

User memory explicitly flags: "He has a consistent behavioral pattern toward over-engineering (building extensive infrastructure before first paying customer) that has been explicitly flagged and should be redirected toward shipping and revenue first."

The current directive ("over-engineering is allowed because this will be replicated to every county") explicitly overrides that flag **for the first iteration only**. The reasoning: getting the foundation right at iteration #1 prevents 3,143 future replications from inheriting wrong choices.

Items in this doc that **respect** the override (i.e. they're worth doing well now because they propagate to every county):

- B.1 (CLI generator) — does propagate
- B.2 (wildcard targeting) — does propagate
- B.3 (per-county Sentry) — does propagate
- B.4 (Outscraper cost) — does propagate
- C.1, C.2, C.3 (ops tooling) — propagates

Items that **respect the original flag** (i.e. defer until proven needed):

- D.1–D.7 (new capabilities) — premature
- C.4, C.5, C.6, C.7 — operational hygiene that should follow real usage signals

The first paying customer for Erie.pro should still be the priority. The replication work in B can start after A is done.

---

## Priority queue (recommended execution order)

If a developer has one week to spend, do these in order:

1. **A.1** (D-H dashboard work) — Ike, 3–4 hours.
2. **A.2** (closing verification) — 15 min after A.1.
3. **B.1** (CLI generator) — 2–3 days. Highest leverage for future counties.
4. **B.2** (wildcard ConvertBox + global Boost.space) — 1 day.
5. **C.2** (Sentry alerts) — 1–2 hours. Low effort, high comfort gain.
6. **B.3** (per-county Sentry) — 2 hours.
7. **C.3** (cron dead-man) — 1 hour.

Total: roughly one focused week of senior engineering after A is done.
