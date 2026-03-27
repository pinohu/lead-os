# Pest Control Launch Checklist

> Step-by-step operator guide from zero to first revenue. Each phase builds on the previous one. Do not skip steps.

---

## Day 0: System Setup

- [ ] Clone the repo and run `npm install`
- [ ] Copy `.env.sample` to `.env`
- [ ] Configure `DATABASE_URL` (PostgreSQL connection string, or leave blank for in-memory SQLite)
- [ ] Configure `EMAILIT_API_KEY` (required for email sends — get from emailit.com dashboard)
- [ ] Configure `BASE_URL` (your deployment domain, e.g., `https://leads.yourdomain.com`)
- [ ] Run `npm run dev` and confirm the app starts without errors
- [ ] Verify: `GET /api/health` returns `200 OK` with `{ status: "healthy" }`
- [ ] Verify: Dashboard loads at `http://localhost:3000/dashboard`

## Day 0: Niche Activation

- [ ] `POST /api/niche-generator` with body `{ "name": "pest-control" }`
  - Confirm response includes niche ID and default configuration
- [ ] `POST /api/design-spec` with the contents of `DESIGN.md` from this directory
  - Confirm response includes design spec ID
- [ ] `POST /api/design-spec/[id]/apply` to activate scoring rules, routing logic, and funnel configuration
  - Confirm response shows all rules applied successfully
- [ ] `POST /api/testbed/run` with body `{ "niche": "pest-control", "sampleSize": 50 }`
  - Wait for calibration to complete (may take 30-60 seconds)
- [ ] Review calibration report:
  - Route distribution: ~30% high intent, ~45% medium intent, ~25% low intent
  - Scoring distribution: bell curve centered around 45-55
  - No leads stuck in "unrouted" state
  - Follow-up sequences triggered correctly for each route

## Day 1: Pages Live

- [ ] `POST /api/distribution/programmatic` with the 25 city pages from `pages.json`
  - Confirm all 25 pages created successfully
- [ ] Spot-check 5 pages render correctly at `/p/[tenant]/[slug]`:
  - [ ] Houston: `/p/pest-control/emergency-pest-control-houston-tx`
  - [ ] Miami: `/p/pest-control/emergency-pest-control-miami-fl`
  - [ ] Phoenix: `/p/pest-control/emergency-pest-control-phoenix-az`
  - [ ] Atlanta: `/p/pest-control/emergency-pest-control-atlanta-ga`
  - [ ] New Orleans: `/p/pest-control/emergency-pest-control-new-orleans-la`
- [ ] Verify each page has:
  - [ ] Correct H1 heading
  - [ ] Unique meta title and description (view source or browser dev tools)
  - [ ] Lead capture form visible above the fold
  - [ ] City-specific local content rendered (not template placeholders)
  - [ ] Mobile-responsive layout (test at 375px width)
- [ ] Generate and verify sitemap at `/sitemap.xml` includes all 25 pages
- [ ] Submit sitemap to Google Search Console
- [ ] Set up analytics:
  - [ ] Google Analytics 4 or Plausible tracking code installed
  - [ ] Conversion event configured for form submissions
  - [ ] Goal configured for phone number clicks

## Day 1: Provider Pipeline

- [ ] Research and list 10 pest control companies for each of the top 5 cities:
  - [ ] Houston (10 companies)
  - [ ] Phoenix (10 companies)
  - [ ] Miami (10 companies)
  - [ ] Atlanta (10 companies)
  - [ ] Dallas (10 companies)
- [ ] For each company, record:
  - Company name, owner/manager name, phone, email
  - Google rating and review count
  - State license number (verify on state licensing board)
  - Service area (zip codes)
- [ ] Send initial outreach email using the template in `provider-outreach.md`
- [ ] Schedule follow-up calls for Day 2-3
- [ ] Goal: 3-5 providers across all cities willing to receive free test leads

## Day 2-3: Lead Capture Active

- [ ] Submit a test lead through each city page's intake form
  - Use test data, not real contact information
- [ ] Verify the full pipeline for each test lead:
  - [ ] Lead appears in `POST /api/intake` logs
  - [ ] Scoring engine assigns correct score based on input signals
  - [ ] Routing engine selects correct funnel path (high/medium/low intent)
  - [ ] Follow-up automation triggers (SMS and/or email based on score)
  - [ ] Lead appears on `/dashboard/pipeline` in correct stage
- [ ] Test edge cases:
  - [ ] Lead with phone only (no email) — should still process
  - [ ] Lead with email only (no phone) — should still process, lower score
  - [ ] Lead with "emergency" and "today" language — should score > 70
  - [ ] Lead from city not in the 25 pages — should still accept and route
- [ ] Monitor `/dashboard/pipeline` for any leads stuck in a stage
- [ ] Monitor `/dashboard/radar` to confirm hot leads (score > 70) are flagged
- [ ] Verify no test leads were sent to real providers (test mode should be active)

## Day 3-5: Revenue Activation

- [ ] Deactivate test mode: confirm system is ready for real leads
- [ ] Route first real leads to test providers (free — this is their trial period)
  - [ ] Confirm providers receive lead via their preferred channel (call/text/email)
  - [ ] Confirm providers receive lead within 2 minutes of submission
- [ ] Follow up with each test provider within 24 hours:
  - "Did you receive the leads?"
  - "Were you able to reach the homeowner?"
  - "How did the quality compare to other lead sources?"
- [ ] Based on provider feedback, adjust:
  - [ ] Scoring thresholds (if leads are too low quality, raise minimum score for routing)
  - [ ] Lead format (add/remove fields based on what providers need)
  - [ ] Response timing (if providers want leads at specific hours only)
- [ ] Set pricing per provider based on pest type:
  - Standard pests (roaches, ants, spiders): $35/lead
  - Rodents: $45/lead
  - Emergency same-day: $50/lead
  - Bed bugs: $60/lead
  - Termites: $75/lead
- [ ] Set up billing:
  - Option A: Stripe checkout for automated per-lead billing
  - Option B: Manual invoicing (weekly or bi-weekly)
- [ ] Send first invoice or activate Stripe billing for paying providers

## Day 5-7: Optimization Loop

- [ ] Review `/dashboard/revenue`:
  - Total leads generated
  - Leads routed to providers
  - Revenue collected
  - Revenue per lead (actual vs. target of $45)
- [ ] Review `/dashboard/feedback`:
  - System performance insights
  - Lead quality scores
  - Provider response times
  - Conversion rates by city and pest type
- [ ] Run optimization cycle: `POST /api/adaptive-loop/cycle`
  - Review strategy recommendations
  - Apply recommended changes to scoring or routing
- [ ] Identify top and bottom performing pages:
  - Top 5 pages by conversion rate — allocate more resources
  - Bottom 5 pages by conversion rate — diagnose and fix or pause
- [ ] Check SEO performance:
  - Google Search Console: impressions, clicks, average position per page
  - Identify pages not yet indexed — request indexing
  - Identify pages with high impressions but low CTR — improve meta descriptions

## Week 2: Scale

- [ ] Expand provider network:
  - [ ] Send outreach to remaining 20 cities (10 companies each)
  - [ ] Onboard 10+ total providers across all active cities
  - [ ] Ensure each active city has at least 2 providers (redundancy)
- [ ] Expand page coverage:
  - [ ] Add 25 more city pages (total: 50 cities)
  - [ ] Add pest-specific landing pages: "termite treatment [city]", "bed bug removal [city]"
- [ ] Start paid acquisition (if organic volume is insufficient):
  - [ ] Google Ads campaigns for top 5 converting cities
  - [ ] Budget: $20/day per city ($100/day total)
  - [ ] Target CPA: $15-20 per qualified lead
- [ ] Revenue target: $50-100/day in lead sales

## Week 3-4: Mature Operations

- [ ] Automate provider billing (move all providers to Stripe if not already)
- [ ] Set up provider dashboard (self-service lead history, invoices, settings)
- [ ] Implement provider quality scoring:
  - Response time tracking
  - Conversion rate tracking
  - Customer satisfaction feedback
- [ ] Add upsell: Annual Pest Protection Plan referrals ($29/month, recurring commission)
- [ ] Revenue target: $100-200/day in lead sales
- [ ] Begin documenting playbook for next vertical deployment

---

## Key Metrics to Track Daily

| Metric | Target | Where to Check |
|--------|--------|---------------|
| Leads generated | 10-20/day | `/dashboard/pipeline` |
| Lead score distribution | Bell curve, median 45-55 | `/dashboard/pipeline` |
| Response time (score > 60) | < 2 minutes | `/dashboard/radar` |
| Provider acceptance rate | > 90% | `/dashboard/feedback` |
| Lead-to-booking rate | 25% | Provider feedback |
| Revenue per lead | $45 average | `/dashboard/revenue` |
| Daily revenue | $50-100 by Week 2 | `/dashboard/revenue` |
| Page conversion rate | 8% | Analytics |
| Cost per lead (paid) | < $25 | Google Ads |

## Emergency Procedures

### System is down
1. Check `GET /api/health` — identify which component failed
2. Check deployment logs on Railway
3. If database is down, leads will queue in memory (up to 100)
4. Restart the service: `railway up` or redeploy from dashboard

### Provider is not responding to leads
1. Check provider's response time on `/dashboard/feedback`
2. Send warning: "You have 3 unanswered leads. Leads will be paused in 24 hours."
3. After 24 hours with no response, pause lead delivery
4. Redistribute leads to backup provider in the same service area

### Lead quality complaints from providers
1. Review the specific leads in question on `/dashboard/pipeline`
2. Check scoring breakdown — was the score accurate?
3. If scoring error: adjust thresholds and rerun calibration
4. If valid lead but poor fit: adjust provider's pest type or area filters
5. Offer credit for genuinely bad leads (wrong number, out of area)

### Revenue below target
1. Check traffic: are pages getting impressions and clicks?
2. Check conversion: are visitors submitting forms? (analytics funnel)
3. Check routing: are leads reaching providers? (`/dashboard/pipeline`)
4. Check providers: are they converting leads to bookings? (provider feedback)
5. Identify the bottleneck and address that specific stage
