# 02 — County Replication Playbook

How to clone the running Erie.pro deployment to any new county in the United States. This is the procedure that will be executed ~3,143 times if the system is replicated nationally.

**Estimated time per new county:** 6–10 hours for the first replication after the procedure is fully automated; 30–60 minutes once a CLI generator exists. As of master sha `76d267ed`, automation is partial; manual work fills the gaps. This playbook tracks which steps are automated and which require human action.

**Cost per new county (recurring, US dollars):**

| Line item | Monthly | Notes |
|-----------|---------|-------|
| Domain (`.pro` or `.com`) | ~$1 | One-time ~$20/yr |
| Vercel project | $0 | Free tier covers small counties; Pro plan at $20/team is shared across all counties |
| Neon database | $0 | Free tier (0.5 GB storage, 100 hr compute) covers a single small county; larger or higher-traffic counties may need the $19/mo Launch plan |
| Cloudflare / DNS | $0 | Free |
| Outscraper Google Places scrape | ~$3–$8 one-time | Initial scrape: 114 niches × ~20 places each × $0.001 per place. Re-scrapes optional and infrequent. |
| Subtotal recurring per county | $0–$20 | |

**Cost per new county (variable):**

| Line item | When charged | Estimate |
|-----------|-------------|----------|
| Resend transactional email | Per-send | Free tier 100/day; $20/mo for 50k. Shared across all counties. |
| ThriveCart / SuiteDash / ConvertBox / Boost.space / ProductDyno | Already paid | Lifetime AppSumo licenses; no per-county incremental cost. |
| Anthropic Claude API | Per-call | Lead matching + document classification; estimated $0.01–$0.05 per lead in well-trafficked counties. |

---

## Phase 0 — Decide which county to launch next

Not technical, but it determines what gets configured. The factors that have historically mattered:

1. **Population.** Below ~25k there isn't enough demand to drive recurring lead flow; above ~500k Erie's playbook (10–15 directly-onboarded providers per niche) becomes too small to dominate organic search.
2. **Operator presence.** Does Ike (or a future delegate) have boots-on-the-ground relationships in this county? The first 5–10 provider conversations are warm if there is local context, cold if not.
3. **Competitive density.** If Yelp + Google Local Services Ads + Angi all rank in the top 3 for `"<niche> near me"` in this metro, organic SEO will be a year-long fight. Mid-sized counties (Erie at 95k is the sweet spot) have shallower competitive moats.
4. **State business filing complexity.** Some states (CA, NY) require qualified entities for substantive in-state lead generation. The OHU Family Living Trust → PNR Holdings → operating LLC structure already handles PA; adding new states means new LLC filings (or accepting that providers contract directly).

Once chosen, gather:

- City name (canonical), state, state code (PA, OH, etc.)
- 2020 census population
- County name (single county per deployment is the norm)
- Latitude/longitude of the city center (Google Maps right-click)
- Service area (list of contiguous suburbs/townships covered by leads)
- Coverage ZIPs (the actual postal codes the deployment serves)
- A tagline (Erie's is "One pro. No bidding. Always Erie.")
- Domain — preferably `.pro` (e.g. `meadville.pro`, `bingenton.pro`); fallback `<city>local.com`

Save these in a one-page "launch packet" doc. Used as input for Phase 2.

---

## Phase 1 — Domain + DNS

**Manual. ~15 min.**

1. Register the domain at the registrar of choice (Cloudflare, Namecheap, Porkbun all work). Use the same registrar each time so all county domains are managed in one place.
2. Set the nameservers to Cloudflare (or whatever DNS provider you've standardized on).
3. In Cloudflare:
   - Create the zone
   - **Leave the apex A/AAAA records empty for now** — Vercel will tell us what to point at after Phase 3
   - Set proxy mode to **DNS only** (gray cloud), not proxied, until you decide whether to layer Cloudflare in front of Vercel. Default Erie.pro is unproxied.
4. Note the domain in your launch packet doc. It will be entered into the `city-registry.ts` config in Phase 2.

**Verification:** `dig <newcounty>.pro NS` shows the Cloudflare nameservers. `whois <newcounty>.pro | grep "Registry Expiry"` shows a date 12+ months out.

---

## Phase 2 — Add the city to the city-registry

**Code change. ~10 min. Single file.**

The file `erie-pro/src/lib/city-registry.ts` is the single source of truth for which cities the kernel knows about. Adding a new city is one entry in the `CITIES` array.

**Steps:**

1. Branch off master: `git checkout -b feat/launch-<newcounty>`.
2. Open `erie-pro/src/lib/city-registry.ts`.
3. Find the `CITIES` array. The format is documented inline. Add an entry following the Erie shape exactly. Example for hypothetical Meadville, PA:

```typescript
{
  slug: "meadville",                   // URL-safe city identifier; matches CITY_SLUG env var
  name: "Meadville",                   // Display name
  state: "Pennsylvania",
  stateCode: "PA",
  domain: "meadville.pro",
  population: 13388,                   // 2020 census
  coordinates: { lat: 41.6412, lng: -80.1517 },
  serviceArea: [
    "Meadville", "Vernon", "Saegertown", "Cochranton",
    "Conneaut Lake", "Conneautville", "Linesville",
  ],
  tagline: "One pro. No bidding. Always Meadville.",
  timezone: "America/New_York",
  pricingMultiplier: 0.85,             // 15% below Erie base rates; Meadville is smaller market
  metroArea: "Crawford County",
  counties: ["Crawford County"],
  coverageZips: [
    "16335",  // Meadville
    "16403",  // Cambridge Springs (overlap)
    "16327",  // Guys Mills
    // ... etc., comprehensive list
  ],
  overlapAreas: [
    // Cross-state if any
  ],
  pilotCategories: [
    // 4-6 niches to feature on homepage during launch
    "plumbing", "hvac", "electrical", "roofing", "landscaping",
  ],
}
```

4. **Verify type-check:** `cd erie-pro && npx tsc --noEmit`.
5. **Verify unit tests:** `cd erie-pro && npx vitest run src/lib/__tests__/city-registry.test.ts` should pass. The test suite asserts each registered city has a unique slug + domain and that all required fields are present.
6. Commit. Push. Open PR. Merge to master after CI green.

**Result:** The new city is now recognizable by `getCityBySlug("meadville")` everywhere in the codebase. Components that use `cityConfig` will render the right city if the deployment is built with `CITY_SLUG=meadville`.

---

## Phase 3 — Vercel project for the new county

**Manual + Vercel CLI / dashboard. ~15 min.**

Each county deployment is a separate Vercel project, even though they share one git repo. This is so:
- The `CITY_SLUG` env var can differ
- Each project has its own production domain
- Deploys can be promoted/rolled back independently
- Per-county usage analytics work

**Steps:**

1. In the Vercel dashboard, click **New Project**. Choose **Import** from GitHub. Select `pinohu/lead-os`.
2. **Framework preset:** Next.js (auto-detected).
3. **Root directory:** `erie-pro`. (Critical — the repo root is the monorepo; the territory app lives at this subdirectory.)
4. **Build command:** `npm run build` (default).
5. **Install command:** `npm install` (default).
6. **Project name:** `<newcounty>-pro` (e.g. `meadville-pro`). Lowercase, hyphenated.
7. Click **Environment Variables** and set:

   | Var | Value | Target |
   |-----|-------|--------|
   | `CITY_SLUG` | `<newcounty>` (matches the registry slug) | Production, Preview, Development |
   | `DATABASE_URL` | Pooled URL for the new Neon DB (set in Phase 4) | Production, Preview |
   | `DATABASE_URL_UNPOOLED` | Direct URL for the new Neon DB | Production, Preview |
   | `DIRECT_URL` | Same as `DATABASE_URL_UNPOOLED` | Production, Preview |
   | `THRIVECART_API_KEY` | Same value used by Erie.pro | Production, Preview |
   | `THRIVECART_WEBHOOK_TOKEN` | New value per county OR same; new is safer | Production, Preview |
   | `CONVERTBOX_API_KEY` | Same as Erie.pro | Production, Preview |
   | `BOOSTSPACE_TOKEN` | Same as Erie.pro | Production, Preview |
   | `SUITEDASH_PUBLIC_ID` | Same as Erie.pro | Production, Preview |
   | `SUITEDASH_SECRET_ID` | Same as Erie.pro | Production, Preview |
   | `PRODUCTDYNO_API_KEY` | Same as Erie.pro | Production, Preview |
   | `OUTSCRAPER_API_KEY` | Same as Erie.pro | Production, Preview |
   | `ANTHROPIC_API_KEY` | Same as Erie.pro | Production, Preview |
   | `RESEND_API_KEY` | Same as Erie.pro | Production, Preview |
   | `LEAD_OS_AUTH_SECRET` | New value per county (operator dashboard signing key) | Production, Preview |
   | `LEAD_OS_OPERATOR_EMAILS` | Comma-separated emails of authorized operators | Production, Preview |
   | `NEXT_PUBLIC_BASE_URL` | `https://<newcounty>.pro` | Production, Preview |
   | `CONCIERGE_PHONE` | County-specific phone number (Twilio number, Google Voice, etc.) | Production, Preview |

   For Production only (after Phase 5):

   | Var | Value | Target |
   |-----|-------|--------|
   | `CRON_SECRET` | Fresh 64-char token (token-urlsafe 48) per county | Production only |

8. Click **Deploy**. The first build will fail because the database isn't ready. Don't worry; it'll work after Phase 4.
9. Note the Vercel project ID and team ID from the dashboard URL. You'll need them for Vercel CLI work later. (Erie.pro's are: project `prj_ZrLsCE8EKeas6mpWaUSWPgFdcatp`, team `team_fuTLGjBMk3NAD32Bm5hA7wkr`.)

---

## Phase 4 — Neon database for the new county

**Manual via Neon dashboard. ~15 min.**

Each county is its own logical database in the shared Neon project. The shared cluster is `ep-broad-grass-anm3zcv9-pooler`. Whether you spin up a new project or a new database within the existing project is a cost decision: a new Neon project gives you fully isolated compute (better for scaling); a new database in the existing project shares compute (cheaper).

**Default approach: separate logical DB in the existing project.**

**Steps:**

1. Neon dashboard → existing project → **Databases** tab → **+ New database**.
2. Database name: `<newcounty>_pro` (lowercase, underscored). Example: `meadville_pro`.
3. Owner role: same as existing (`neondb_owner` or whatever you use).
4. Click **Create**.
5. After creation, click into the database, go to **Connection details**. Copy:
   - **Pooled connection string** (uses `-pooler` in hostname). Paste this into Vercel as `DATABASE_URL`.
   - **Unpooled (direct) connection string**. Paste this into Vercel as both `DATABASE_URL_UNPOOLED` and `DIRECT_URL`.
6. Apply migrations:
   ```bash
   cd erie-pro
   DATABASE_URL="<unpooled-url>" npx prisma migrate deploy
   ```
   This runs all 45+ migrations in `prisma/migrations/` in chronological order, leaving the new DB schema-identical to Erie.pro.
7. **Verification:** `psql "<unpooled-url>" -c "\dt"` should list all the same tables Erie.pro has. Run `psql "<unpooled-url>" -c "SELECT COUNT(*) FROM _prisma_migrations"` and verify the count matches Erie.pro's.

**Alternative approach: new Neon project for full isolation.**

Use this for high-traffic counties (population >500k) or if you want truly separated billing per county. Procedure is the same but starts at Neon → **+ New Project** instead.

---

## Phase 5 — Domain attachment + production deploy

**Vercel + DNS. ~15 min.**

1. Vercel project → **Settings** → **Domains** → **Add**. Enter the apex `<newcounty>.pro` and the `www` subdomain.
2. Vercel will tell you what DNS records to create. Typically:
   - Apex: `A` record pointing at `216.150.16.1` (or whatever Vercel's current edge IP is)
   - `www`: `CNAME` to `cname.vercel-dns.com`
3. In Cloudflare (or your DNS provider), create those records. Keep proxy mode **DNS only** (gray cloud).
4. Back in Vercel, wait for the green checkmark on each domain (usually 30 seconds, can take up to 5 minutes for DNS propagation).
5. Provision the production `CRON_SECRET`:
   ```bash
   # Generate
   python3 -c "import secrets; print(secrets.token_urlsafe(48))"
   # Set in Vercel (use Vercel CLI or the dashboard)
   vercel env add CRON_SECRET production
   ```
6. Trigger a fresh production deploy: Vercel dashboard → Deployments → **Redeploy** with the latest master sha.
7. **Verification:**
   - `curl https://<newcounty>.pro/api/health` → 200 `{"status":"healthy"}`
   - `curl -s https://<newcounty>.pro/ | head -c 1000` → HTML with the new city's name + tagline
   - `curl -H "Authorization: Bearer <CRON_SECRET>" https://<newcounty>.pro/api/cron/cleanup` → 200

---

## Phase 6 — Seed the database with niche + service-area data

**Scripts. ~10 min.**

The schema is empty after migration. The kernel needs:
- `niches` table populated with all 114 niches
- `service_areas` table populated with the city's ZIPs + bordering towns

Both come from seed scripts in `erie-pro/src/scripts/`.

```bash
cd erie-pro
CITY_SLUG=<newcounty> DATABASE_URL_UNPOOLED="<unpooled>" npx tsx src/scripts/seed-niches.ts
CITY_SLUG=<newcounty> DATABASE_URL_UNPOOLED="<unpooled>" npx tsx src/scripts/seed-service-areas.ts
```

**Verification:**

```sql
-- After seeding
SELECT COUNT(*) FROM niches;          -- expect 114
SELECT COUNT(*) FROM service_areas;   -- expect 8-15 depending on the county
```

---

## Phase 7 — Outscraper directory scrape (initial pass)

**Scripts + paid API. ~30 min + cost.**

This is what populates the city's `directory_listings` table with real local businesses scraped from Google Maps. Without it, the directory pages show empty states everywhere and SEO is non-existent.

**Cost:** Approximately $3–$8 per county. 114 niches × ~20 places per niche × $0.001–$0.004 per place depending on Outscraper plan tier.

**Steps:**

```bash
cd erie-pro
CITY_SLUG=<newcounty> \
DATABASE_URL_UNPOOLED="<unpooled>" \
OUTSCRAPER_API_KEY="<key>" \
npx tsx src/scripts/scrape-google-places.ts --all-niches
```

The script:
1. For each of 114 niches, builds an Outscraper search query like `"<niche-display-name> <city> <state>"`.
2. Hits the Outscraper Google Maps API.
3. Filters returned places by distance from the city's `coordinates.lat/lng` (default radius: 50km).
4. **Step 2.5 — Category-relevance filter (added PR #40):** drops places whose Google `subtypes` contain a hard anti-pattern for the niche AND no positive keyword match. See `src/lib/niche-category-map.ts`.
5. For each remaining place, fetches reviews (paid, can skip with `--skip-reviews` on cost-sensitive counties).
6. Upserts into `directory_listings` keyed by `googlePlaceId`.

**Verification after scrape:**

```sql
SELECT niche, COUNT(*) FROM directory_listings
WHERE "isActive" = true AND "googlePlaceId" IS NOT NULL
GROUP BY niche
ORDER BY niche;
```

Should show ~10–30 listings per niche for a county the size of Erie. Smaller counties (Meadville) may have 3–10 per niche; some niches may be empty entirely (e.g. `marina-boat-winterization` only applies in lake-adjacent counties).

**Then run the audit script to clean any obvious mis-categorizations:**

```bash
CITY_SLUG=<newcounty> DATABASE_URL_UNPOOLED="<unpooled>" \
  npx tsx src/scripts/audit-directory-quality.ts --apply
```

This applies the same niche-category-map filter post-scrape, catching anything the scrape-time filter missed.

---

## Phase 8 — ThriveCart product setup (per-county)

**Manual via ThriveCart dashboard. ~30–45 min.**

ThriveCart products exist once but funnel to per-county checkout pages. The product slugs in `docs/external-setup/thrivecart/master-setup.json` are referenced in code — do NOT improvise slugs.

**For a new county, the steps depend on which products are county-specific:**

Some products are global (sold across all counties from one product):
- The SuiteDash Operator's Library PDFs
- Provider subscription tiers (Bronze, Silver, Gold)
- One-off lead packages

Some products may be county-specific (different domain on checkout success URL, different fulfillment email reply-to):
- Local-launch packages
- Sponsored category listings

**Steps for the global products (already exist for Erie):**

1. Add the new county's domain to ThriveCart's allowed redirect URLs.
2. Update the success-URL template if it includes the county domain (typically `https://<newcounty>.pro/thank-you?order={{order_id}}`).
3. No new product creation needed.

**Steps for county-specific products:**

1. Open `docs/external-setup/thrivecart/master-setup.json`. Each product entry has a slug.
2. In ThriveCart dashboard → Products → **Duplicate** the corresponding Erie product.
3. Rename it `<slug>-<county>` (e.g. `local-launch-pkg-meadville`).
4. Update price if `pricingMultiplier` for this county is not 1.0 (see registry entry).
5. Update success URL, webhook URL (still `https://<newcounty>.pro/api/webhooks/thrivecart`), and fulfillment.
6. Save and copy the new product's cart URL.

**Then seed an `Offer` row in the new county's DB so the webhook handler knows about it:**

```bash
CITY_SLUG=<newcounty> DATABASE_URL_UNPOOLED="<unpooled>" \
  npx tsx src/scripts/seed-offers.ts
```

(See script for the canonical offer list per county.)

---

## Phase 9 — ConvertBox capture forms (per-county)

**Manual via ConvertBox dashboard. ~20–30 min.**

ConvertBox boxes have targeting rules that key on the page URL. For each new county, you either (a) duplicate the Erie boxes and update their targeting, or (b) use wildcard targeting that matches all counties.

**Recommended approach: wildcard targeting.**

1. In ConvertBox, open each box defined in `docs/external-setup/convertbox/placement-matrix.json`.
2. In Targeting, change the URL match from `https://erie.pro/*` to `https://*.pro/*` (or use a regex that matches all county domains).
3. Save. Verify each box still fires on Erie.pro and now also fires on `<newcounty>.pro`.

**If wildcard targeting is not viable (e.g. you want county-specific copy):**

1. Duplicate each Erie box in ConvertBox dashboard.
2. Rename `<box-name>-<county>`.
3. Update targeting to `https://<newcounty>.pro/*`.
4. Update copy to reference the new county name (e.g. headline goes from "Looking for plumbing services in Erie?" to "Looking for plumbing services in Meadville?").
5. Save.

Either way, run the verification script:

```bash
cd erie-pro
CITY_SLUG=<newcounty> npx tsx src/scripts/verify-convertbox-placement.ts
```

It hits each major page on the new county domain and asserts the expected box IDs are present in the response HTML.

---

## Phase 10 — Boost.space scenarios (per-county)

**Manual via Boost.space. ~15–30 min.**

Boost.space runs the polling and revenue-action callbacks. Scenarios reference the lead-os domain by URL.

1. In Boost.space, open each scenario defined in `docs/external-setup/boostspace/revenue-action-scenarios.json`.
2. Most scenarios reference `https://erie.pro/api/integrations/boostspace/revenue-actions` directly. Two options:
   - **Option A — One scenario per county:** Duplicate each scenario, update the endpoint to `https://<newcounty>.pro/api/integrations/boostspace/revenue-actions`. Multiple scenarios fire in parallel; cost adds up.
   - **Option B — One global scenario with dynamic routing:** Modify the scenario to read a `county` field from the inbound webhook payload and dynamically route the callback URL. More work upfront, cheaper at scale.

Until 5+ counties are launched, Option A is fine. Switch to Option B for the 6th county onwards.

---

## Phase 11 — SuiteDash object cloning (per-county)

**Manual via SuiteDash. ~15–30 min.**

SuiteDash has project types, portal templates, support pipelines, and task templates that the code expects. For each new county:

1. Open `docs/external-setup/suitedash/operational-sync-package.json`. Each section lists the object slug and the fields.
2. In SuiteDash, **Cobrands** allow per-county portals. Create a new Cobrand for the new county if you want true white-labeling per county; otherwise reuse the Erie Cobrand and override per-client.
3. For project types, support pipelines, and task templates: these are typically global. Verify each slug from the JSON exists in SuiteDash.
4. Code expectation: the SuiteDash API client (`src/lib/suitedash.ts`) uses the slugs to find the right objects. Mismatched slugs cause silent failures (the code logs a warning and moves on).

---

## Phase 12 — Soft launch + provider acquisition

**Operational, not technical. ~ongoing.**

Once Phases 1–11 are done, the new county is technically live. Now the operational work:

1. **Internal smoke test.** Submit a test lead through `/api/lead` on the new county domain. Verify it lands in the operator dashboard at `/dashboard/leads` and triggers the unmatched-lead concierge flow.
2. **Identify the 5–10 highest-leverage providers per top-priority niche.** Cold outreach via email or phone to introduce the platform. Goal: 3 providers signed up in the top 3 niches before any public marketing.
3. **Run the `revenue:e2e` write-mode test against the new county:**
   ```bash
   CITY_SLUG=<newcounty> REVENUE_QA_WRITE=1 npm run revenue:e2e
   ```
   Should produce 7 passed / 0 skipped / 0 failed. This is the end-to-end verification that the entire revenue spine (ConvertBox → ThriveCart → webhook → SuiteDash → fulfillment) is wired correctly for this county.
4. **Public soft launch.** Press release to local newspapers, post on local subreddits and Facebook groups. Goal: 100 unique consumer visitors in the first week. Lead volume signals where to focus next.
5. **First paying provider conversion.** Convert one of the cold-introduced providers from Step 2 into a paid subscription. This is the first dollar from the new county; the playbook is validated.

---

## Phase 13 — Post-launch monitoring + 30-day check-in

After the first month:

1. **Run the directory quality audit on the new county:**
   ```bash
   CITY_SLUG=<newcounty> DATABASE_URL_UNPOOLED="<unpooled>" \
     npx tsx src/scripts/audit-directory-quality.ts
   ```
   Review the soft suspects in `docs/qa/directory-quality-audit-<newcounty>.json`. Deactivate as needed.
2. **Review cron job health.** Vercel dashboard → Crons → confirm all 8 jobs are firing on schedule.
3. **Review Sentry error rates.** Compare to Erie.pro's baseline.
4. **Audit revenue actuals.** Provider subscriptions vs lead volume; compute revenue-per-lead and revenue-per-active-provider.

---

## What's automated and what isn't (as of master sha `76d267ed`)

| Phase | Automation status | Manual time | Notes |
|-------|------------------|-------------|-------|
| 0. Decide county | Manual research | 30–60 min | Could be partly automated with a Census API + competitive-density crawler |
| 1. Domain + DNS | Manual (registrar UI) | 15 min | Cloudflare API call to create the zone is scriptable |
| 2. Add to city-registry | Manual code edit | 10 min | A CLI generator (`scripts/new-city.ts`) is a clear opportunity |
| 3. Vercel project | Manual (Vercel UI) | 15 min | Vercel CLI `vercel projects add` + env-set is scriptable |
| 4. Neon database | Manual (Neon UI) | 15 min | Neon API can create databases programmatically; we have an `audit-neon.ts` already |
| 5. Domain attachment + production deploy | Manual (Vercel UI) + scripted CRON_SECRET | 15 min | Combine with Phase 3 if scripted |
| 6. Seed niches + service areas | Scripted | 10 min | Already automated; just needs the env vars |
| 7. Outscraper scrape | Scripted | 30 min runtime | Already automated; PR #40 added the category filter |
| 8. ThriveCart products | Manual (ThriveCart UI) | 30–45 min | ThriveCart API exists; partially used in `setup-thrivecart.ts` |
| 9. ConvertBox boxes | Manual (ConvertBox UI) | 20–30 min | ConvertBox does not have a public API for box creation |
| 10. Boost.space scenarios | Manual (Boost.space UI) | 15–30 min | Boost.space API exists but scenario CRUD is partial |
| 11. SuiteDash objects | Manual (SuiteDash UI) | 15–30 min | SuiteDash API does NOT support project-type CRUD as of May 2026 |
| 12. Soft launch | Operational | ongoing | Not automatable |
| 13. Post-launch monitoring | Scripted (cron + audit) | 30 min per check-in | Already automated where possible |

**Total per-county manual time at master sha 76d267ed:** 4–6 hours.
**Total per-county manual time after the highest-leverage automation work:** 30–60 minutes. The biggest wins are: (a) a CLI generator that does Phases 2–6 in one command (covered in `04-CURRENT-GAPS-AND-FUTURE-WORK.md` §H), and (b) wildcard ConvertBox + global Boost.space scenarios (Phases 9–10) which eliminate the per-county dashboard tax.

---

## Replication anti-patterns (things that have gone wrong before, do not repeat)

1. **Forgetting to set `CITY_SLUG` in Vercel.** Without it, the build uses `slug = "erie"` and the new county deploys as a copy of Erie. Always verify before first deploy: `curl https://<newcounty>.pro/ | head -c 5000 | grep -oE 'Erie|<newcounty>'`.
2. **Pointing the new Vercel project at the Erie Neon database.** The connection string typo is hard to catch and leads to the new county writing into Erie's data. Always: separate database, distinct connection strings, verify with a write.
3. **Using the same `LEAD_OS_AUTH_SECRET` across counties.** This is a magic-link signing secret; sharing it means an operator authorized for Erie can sign in to any county's dashboard. Generate fresh per county.
4. **Sharing `CRON_SECRET` across counties.** Same risk as above for cron auth.
5. **Skipping the post-scrape audit pass.** Outscraper returns adjacent businesses; the audit catches them. If you don't run it, the new county's directory has the same kind of mis-categorizations Erie had before PR #40 (Walmart in `bat-removal`, etc.).
6. **Launching publicly before signing up the first 3–5 providers.** The lead form works regardless of provider claims, but unmatched leads go to the concierge phone — a high-cost manual fallback. Pre-onboard providers in the top 3 niches before the press release.
