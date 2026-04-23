# CX React — Hosted Runtime

CX React is a white-label, multi-tenant lead generation, scoring, nurturing, and monetization platform deployable for **any business niche**. It is a complete revenue engine that replaces 15-20 separate SaaS products by unifying lead capture, scoring, AI content generation, multi-channel nurturing, CRM sync, experiment optimization, automated prospecting, competitive analysis, booking, analytics, and billing into a single deployable runtime.

## By the Numbers

| Metric | Count |
|--------|-------|
| Total source files | 1,004 |
| Lines of code | 210,000+ |
| API endpoints | 498 |
| UI pages | 60 |
| Dashboard pages | 29 |
| Provider integrations | 137 |
| Lib modules | 233 |
| Test files | 333 |
| Test cases | 4,151 |
| Test pass rate | 100% |

## Architecture

```text
WordPress site / external site
  -> loads lead-os-embed.js
  -> opens chat/form/assessment widget
  -> posts data to hosted runtime

Hosted runtime (Next.js 16.2 + PostgreSQL)
  -> /api/widgets/boot         # Widget configuration
  -> /api/decision             # Next-step routing
  -> /api/intake               # Lead capture
  -> /api/discovery            # Business scouting
  -> /api/prospects            # Prospect pipeline
  -> /api/experiments          # A/B experiment engine
  -> /api/competitors          # Competitive analysis
  -> /api/gmb/ingest           # GMB listing ingestion
  -> /lp/[slug]                # Auto-generated landing pages
  -> /assess/[slug]            # Dynamic assessments
  -> /calculator               # ROI calculators
  -> /dashboard/*              # 27-page operator dashboard
```

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2.1 (App Router) |
| Language | TypeScript 5.9.3 (strict mode) |
| Runtime | Node.js 20+ |
| Database | PostgreSQL (pg 8.20) + in-memory fallback |
| Payment | Stripe (stripe 21.0.1) |
| Validation | Zod 4.3.6 |
| Queue | BullMQ 5.71.1 |
| UI | React 19.1.0 |

## Core Capabilities

### Lead Capture & Scoring
- Multi-source capture: embedded widgets, GMB landing pages, assessments, calculators, chat, voice, API, web scraping
- **GMB-to-Landing-Page pipeline**: Ingest any Google Business Profile → auto-generate SEO-optimized landing page with JSON-LD, reviews, hours, FAQ, and lead capture
- **Content quality scoring**: Per-section quality analysis with SEO scoring, accessibility flags, and remediation recommendations
- **AI content enrichment**: LLM-powered improvement of headlines, descriptions, and FAQ answers with confidence scoring
- **GBP sync scheduler**: Automated re-ingestion with change detection, failure tracking, and cron-based scheduling
- 4D scoring: intent, fit, engagement, urgency with niche-specific weights
- Temperature classification: cold/warm/hot/burning with auto-escalation

### Automated Prospecting Engine
- **Discovery Scout**: Finds businesses via web scraping, scores digital presence gaps
- **Opportunity Classifier**: 4-way classification (managed-service, white-label, affiliate, referral-partner)
- **Pipeline Ingestion**: Auto-creates prospects, generates personalized outreach templates
- **Cron Scheduling**: Multi-niche automated scouting on recurring schedules
- **Dashboard**: Full prospect management with filters, stats, and outreach tools

### A/B Experiment Engine (Autoresearch)
- Statistical evaluation using z-test for proportions
- Early stopping for severe degradation (auto-rollback)
- Auto-promotion of clear winners at 95% confidence
- 5 optimization surfaces: email-subject, CTA copy, lead-magnet offers, scoring weights, funnel-step order
- Email sender integration for subject line A/B testing

### Competitive Analysis & Design Ingestion
- Scrape and analyze competitor websites
- Extract design tokens, funnel patterns, and copy signals
- Marketing artifact pipeline for creative differentiation
- Competitor tracking dashboard

### Multi-Channel Nurturing
- Email (Sinosend, Groove, SendFox, tinyEmail, Acumbamail, VBOUT, SalesNexus, SMTP)
- SMS (EasyText, SMS-iT, Acumbamail), WhatsApp (WBizTool, SMS-iT), Voice (Thoughtly, Novocall)
- Chat (Pickaxe, Insighto, Chatbase), Social (Vista Social)
- AI-personalized outreach (Autobound), Marketing automation (VBOUT)
- Temperature-aware content sequencing
- AI-powered content generation (10+ angles per topic, 12 platform variants)

### Data Enrichment & Verification
- Email verification (Reoon) — deliverability scoring, bulk verification, bounce prevention
- Contact/company enrichment (Databar) — firmographic, technographic, and social data
- B2B contact search (LeadRocks, Clodura.AI) — LinkedIn enrichment, org charts
- Visitor de-anonymization (Happierleads) — identify anonymous website visitors
- Behavioral scoring (Salespanel) — visitor tracking, lead scoring, segmentation

### Business Intelligence & Attribution
- Marketing attribution (OWOX BI) — multi-touch attribution, ROAS, cohort analysis
- Call tracking (CallScaler) — number provisioning, source attribution, call-to-lead conversion
- Conversion optimization (Plerdy) — heatmaps, session recordings, SEO audits, funnel analysis
- AI ad targeting (Markopolo.ai) — audience sync, campaign optimization, retargeting
- Customer data platform (Meiro) — identity resolution, event ingestion, segment building

### Web Scraping & Automation
- Google Maps scraping (Google Maps Scraper) — business data extraction, GMB ingestion pipeline
- Web scraping automation (Hexomatic) — templates, scheduled automations, data export

### Additional Integrations
- CRM (SuiteDash, Flowlu, SalesNexus) — contacts, deals, pipelines, drip sequences
- Subscription billing (Chargebee) — customers, subscriptions, invoicing, usage metering
- Review management (More Good Reviews) — review solicitation, response, widgets
- Form-based capture (Formaloo) — form builder, submissions, analytics, embed codes
- Callback widgets (Novocall) — click-to-call, scheduling, lead conversion

### Revenue & Monetization
- 4 revenue models: managed service, white-label SaaS, implementation + retainer, lead marketplace
- Stripe billing with checkout, portal, webhooks, usage tracking
- 8 pricing plans with feature gating

### Multi-Tenant Infrastructure
- Tenant isolation with per-plan quotas and RLS policies
- Self-service onboarding wizard (6 steps)
- 13-step automated provisioning with subdomain + landing page deployment
- 137 provider integrations (all with dry-run fallback)

### Runtime, pricing autopilot, and control plane
- **Web vs worker:** `src/instrumentation.ts` calls `startPricingRuntimeWeb()` — with `REDIS_URL` set it **does not** embed BullMQ workers in Next.js; run **`npm run worker`** (`src/runtime/worker-entry.ts`) or Docker **`--target worker`**. Memory fallback runs on the **web** process only in **non-production** when Redis is absent.
- **Queues & DLQ:** BullMQ queues (`leados-pricing-*`) plus **persisted** dead letters in Postgres (`dead_letter_jobs`).
- **Billing:** Migration `007` adds plans/subscriptions and `operator_audit_log`. `LEAD_OS_BILLING_ENFORCE=true` gates pricing ticks on active subscriptions, plan flags, and node counts (see `src/lib/billing/entitlements.ts`).
- **Observability:** `/api/health`, `/api/health/deep`, `/api/system` (includes billing snapshot), `/api/queue` (cron secret or authenticated operator/API identity).
- **Operator UI:** `/dashboard/control-plane` — flags, billing, queue stats, nodes, recommendations, outcomes, DLQ rows, and **confirmed actions** (`POST /api/operator/actions`).
- **Tenant alignment for mutations:** new operator routes use `requireOperatorApiSession` plus `requireAlignedTenant` from `src/lib/api-mutation-guard.ts` (API-key tenant header must match `LEAD_OS_TENANT_ID`).
- **Documentation:** [Operator runbook](./docs/OPERATOR_RUNBOOK.md), [Deployment guide](./docs/DEPLOYMENT.md), [System hardening](./docs/SYSTEM-HARDENING.md).

## Quick Start

```bash
# Clone and install
git clone https://github.com/pinohu/lead-os.git
cd lead-os/lead-os-runtime
npm install

# Start development server (no env vars needed)
npm run dev
# Server starts at http://localhost:3000

# Run tests
npm test
# 4,151 tests, 100% pass rate

# Type check
npx tsc --noEmit
# 0 errors
```

No environment variables are required for local development. The system runs entirely in-memory with dry-run mode for all external integrations.

**Erie.pro directory demo (Postgres + billing + routing):** see [docs/ERIE-PRO.md](./docs/ERIE-PRO.md) and `.env.erie.example`.

**Revenue use cases (1–10):** [docs/GO-TO-MARKET-USE-CASES.md](./docs/GO-TO-MARKET-USE-CASES.md) · `src/config/gtm-use-cases.ts`

### GTM execution (CLI + operator dashboard)

- **CLI:** `npm run gtm:print` prints every row from `GTM_USE_CASES` (add `--json`, `--id=1`, or `--slug=erie-plumbing` / canonical slugs). Exits non-zero if the config fails validation.
- **Dashboard:** `/dashboard/gtm` (operator session required) shows all plays, **week-one launch checklist**, derived execution links, env keys, and editable **rollout status** + notes stored in Postgres (`db/migrations/011_gtm_use_case_statuses.sql`).
- **API:** `GET /api/operator/gtm` returns merged config + status; `PATCH` or `POST` with `{ slug, status?, notes? }` updates persistence. Mutations require aligned tenant headers when present and append **`operator_audit_log`** + API mutation audit rows.

## Environment Variables

```bash
# Database (enables persistent storage)
DATABASE_URL=postgresql://user:pass@host:5432/leados

# Authentication
LEAD_OS_OPERATOR_EMAILS=admin@example.com

# Billing (Stripe)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# AI (at least one)
AI_API_KEY=sk-...
AI_PROVIDER=openai  # or anthropic

# Communication (optional, dry-run without)
SINOSEND_API_KEY=...          # Email
EASY_TEXT_API_KEY=...         # SMS

# Integrations (optional)
FIRECRAWL_API_KEY=...        # Web scraping
ACTIVEPIECES_API_KEY=...     # Workflow automation
N8N_BASE_URL=...             # n8n workflows
SUITEDASH_API_KEY=...        # CRM

# Cron Protection
CRON_SECRET=your-random-secret
```

## LeadOS Core Runtime (Vercel + Postgres)

This repository now includes a minimal production runtime under `src/app/api` and `src/lib` for health checks, authenticated operator lead visibility, and lead intake persistence to PostgreSQL.

### Required Environment Variables

```bash
DATABASE_URL=postgresql://user:password@host:5432/database
LEAD_OS_AUTH_SECRET=replace-with-a-long-random-secret
```

### Runtime API Smoke Tests

```bash
# 1) Basic health
curl -s http://localhost:3000/api/health

# 2) Deep health (checks Postgres with SELECT 1)
curl -s http://localhost:3000/api/health/deep

# 3) Lead intake
curl -s -X POST http://localhost:3000/api/intake \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","firstName":"Demo","message":"Need a quote"}'

# 4) Operator leads (auth required)
curl -s http://localhost:3000/api/operator/leads \
  -H "x-auth-secret: ${LEAD_OS_AUTH_SECRET}"
```

## Deployment

### Railway (recommended)

Preconfigured with [`railway.json`](./railway.json):

1. Create a new Railway project from this GitHub repo
2. Add environment variables from [`.env.example`](./.env.example)
3. Point your subdomain to Railway
4. Verify at `/api/health`

### Vercel

```bash
npm i -g vercel && vercel --prod
```

### Docker

```bash
docker build -t lead-os . && docker run -p 3000:3000 lead-os
```

## Key URLs

| URL | Purpose |
|-----|---------|
| `/` | Public landing page |
| `/onboard` | Client self-service signup |
| `/auth/sign-in` | Operator login (magic link) |
| `/dashboard` | Operator dashboard |
| `/dashboard/control-plane` | Runtime, queues, pricing, nodes, DLQ (read-only) |
| `/dashboard/prospects` | Prospect discovery and management |
| `/dashboard/experiments` | A/B experiment management |
| `/dashboard/competitors` | Competitive analysis |
| `/lp/[slug]` | Auto-generated GMB landing pages |
| `/marketplace` | Public lead marketplace |
| `/api/health` | System health check |
| `/api/health/deep` | Deep health (DB, Redis, pricing runtime, DLQ) |
| `/api/system` | Public system snapshot (flags, no secrets) |
| `/api/queue` | Queue metrics (cron secret or operator session) |
| `/api/operator/control-plane` | Control plane JSON (authenticated) |
| `POST /api/operator/actions` | Operator mutations (DLQ, nodes, pricing) |
| `/api/intake` | Lead intake endpoint |
| `/api/gmb/ingest` | GMB listing ingestion & LP generation |
| `/api/gmb/ingest/[slug]` | Landing page CRUD (GET/PATCH/DELETE) |
| `/api/gmb/ingest/[slug]/quality` | Content quality scoring |
| `/api/gmb/ingest/[slug]/enrich` | AI content enrichment |
| `/api/gbp-sync` | GBP sync job management |
| `/api/gbp-sync/due` | Cron-triggered due job polling |

## Operator Dashboard Pages (27)

Dashboard, Agents, Analytics, Attribution, Billing, Bookings, Competitors, Creative, Credentials, Distribution, Documents, Experiments, Feedback, Health, Joy, Lead Magnets, Leads, Leads Detail, Marketing Ingestion, Marketplace, Pipeline, Prospects, Providers, Radar, Revenue, Scoring, Settings, Tenants, Workflows

## WordPress Pairing

Use the companion repo [lead-os-embed-widgets](https://github.com/pinohu/lead-os-embed-widgets) on the WordPress site.

## Related Repositories

- [lead-os-embed-widgets](https://github.com/pinohu/lead-os-embed-widgets) — Embeddable widgets and WordPress plugin
- [lead-os-hosted-runtime](https://github.com/pinohu/lead-os-hosted-runtime) — Public hosted runtime
- [SmartClaude](https://github.com/pinohu/SmartClaude) — Claude Code command center

## License

Private. All rights reserved.
