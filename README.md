# Lead OS

Programmable, multi-tenant lead generation infrastructure. One runtime, many niches -- add a new vertical in hours with config, not forks.

Lead OS captures visitor intent through embeddable widgets, scores and routes leads through configurable funnel graphs, orchestrates multi-channel follow-up (email, SMS, WhatsApp, chat, voice), and syncs outcomes to your CRM and automation bus.

## Architecture Overview

```
                    +----------------------------+
                    |       Edge Layer           |
                    |   (neatcircle-beta)         |
                    |   Next.js 15 + Tailwind     |
                    |   Vercel / Cloudflare       |
                    +-------------+--------------+
                                  |
                    +-------------+--------------+
                    |      Kernel Runtime        |
                    | (lead-os-hosted-runtime)   |
                    |   Next.js 15 + PostgreSQL   |
                    |   Railway                   |
                    +-------------+--------------+
                                  |
          +-----------+-----------+-----------+
          |           |           |           |
     +----+----+ +----+----+ +----+----+ +----+----+
     |   CRM   | |  Email  | |  Auto   | |  Docs   |
     |SuiteDash| | Emailit | |  n8n    | |Docmentro|
     +---------+ +---------+ +---------+ +---------+
```

| Layer | Package | Role |
|-------|---------|------|
| Edge Layer | `neatcircle-beta` | Marketing site, behavioral tracking, experience personalization, widget orchestration |
| Kernel Runtime | `lead-os-hosted-runtime-wt-hybrid` | Intake, scoring, funnel decisioning, provider orchestration, operator dashboard, n8n provisioning |
| Automation Layer | n8n + cron jobs | Durable multi-step workflows, retries, milestone-driven sequences |
| CRM Layer | SuiteDash | Contact management, deals, pipeline stages, human workflow |

## Tech Stack

| Category | Technology | Version |
|----------|-----------|---------|
| Framework | Next.js (App Router) | 15.x |
| Language | TypeScript | 5.9 |
| Frontend | React, Tailwind CSS | 19.x, 4.x |
| Database | PostgreSQL (via `pg`) | 15+ |
| Hosting (Runtime) | Railway (Nixpacks) | -- |
| Hosting (Edge) | Vercel or Cloudflare Workers | -- |
| CRM | SuiteDash | -- |
| Email | Emailit | -- |
| WhatsApp | WBizTool | -- |
| SMS | EasyTextMarketing, SMSit | -- |
| Chat AI | Insighto | -- |
| Voice AI | Thoughtly | -- |
| Automation | n8n | -- |
| Booking | Trafft, Lunacal | -- |
| Documents | Documentero, Crove | -- |
| Commerce | ThriveCart | -- |
| Referral | Partnero, UpViral | -- |
| Ledger | AITable | -- |
| Alerts | Discord Webhooks, Telegram Bot | -- |

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 15+ (or use the in-memory fallback for development)
- npm

### Install and Run

```bash
# Clone the repository
git clone https://github.com/pinohu/lead-os.git
cd lead-os

# --- Kernel Runtime ---
cd lead-os-hosted-runtime-wt-hybrid
npm install
cp .env.sample .env         # Edit with your values
npm run dev                  # Starts on http://localhost:3000

# --- Edge / Marketing (separate terminal) ---
cd ../neatcircle-beta
npm install
cp .env.sample .env.local   # Edit with your values
npm run dev                  # Starts on http://localhost:3001
```

### Verify

```bash
curl http://localhost:3000/api/health
```

A successful response returns `{ "success": true, "service": "lead-os-hosted-runtime", ... }`.

## Project Structure

```
lead-os/
  docs/                                   # Architecture docs, libraries
  lead-os-hosted-runtime-wt-hybrid/       # Kernel runtime (system of record)
    src/
      app/
        api/                              # API routes
          auth/request-link/              # Operator magic link auth
          automations/health/             # Automation health check
          automations/smoke/              # Smoke test runner
          config/health/                  # Configuration status
          cron/nurture/                   # Nurture sequence cron
          dashboard/                      # Operator dashboard data
          decision/                       # Funnel routing decisioner
          embed/manifest/                 # Embed widget manifest
          health/                         # System health check
          intake/                         # Lead intake endpoint
          n8n/manifest/                   # n8n workflow catalog
          n8n/provision/                  # n8n workflow provisioning
          n8n/workflows/[slug]/           # n8n workflow JSON export
          runtime-config/                 # Operator runtime config
          widgets/boot/                   # Widget boot config
          scoring/                        # Lead scoring API
          experiments/                    # A/B experiment CRUD
          experiments/[id]/               # Single experiment + analysis
          experiments/[id]/assign/        # Variant assignment
          experiments/[id]/convert/       # Conversion recording
          attribution/                    # Multi-touch attribution
          lead-magnets/                   # Lead magnet catalog + delivery
          lead-magnets/[slug]/            # Single lead magnet by slug
          tracking/pixel/                 # Email open tracking pixel
          tracking/click/                 # Email click tracking redirect
          dashboard/analytics/            # Funnel analytics dashboard
          dashboard/scoring/              # Lead scoring dashboard
          dashboard/radar/                # Hot lead radar
        auth/                             # Auth pages (sign-in, verify)
        dashboard/                        # Operator dashboard UI
      lib/
        automation.ts                     # Nurture sequences, recipes
        attribution.ts                    # Multi-touch attribution models
        catalog.ts                        # Niche catalog
        cors.ts                           # CORS header builder
        dashboard.ts                      # Dashboard snapshot builder
        email-tracking.ts                 # Email open/click tracking
        experience.ts                     # Experience manifest builder
        experiment-engine.ts              # A/B experiment engine (PostgreSQL)
        experiment-store.ts               # A/B experiment in-memory store
        funnel-library.ts                 # Funnel graph definitions
        intake.ts                         # Lead intake processing
        lead-magnet-engine.ts             # Lead magnet catalog + recommendations
        n8n-client.ts                     # n8n API client
        n8n-starter-pack.ts              # Pre-built n8n workflows
        operator-auth.ts                  # Operator auth (magic link)
        orchestrator.ts                   # Funnel routing decisions
        personalization-engine.ts         # Personalization rules
        providers.ts                      # Provider integrations
        runtime-config.ts                 # Operational config management
        runtime-schema.ts                 # Type definitions
        runtime-store.ts                  # PostgreSQL + in-memory store
        scoring-engine.ts                 # Lead scoring engine
        tenant.ts                         # Tenant configuration
        trace.ts                          # Correlation IDs, events
        visitor-tracking.ts               # Visitor session tracking
    tests/                                # Node.js native test runner
  neatcircle-beta/                        # Edge / marketing layer
    src/
      app/
        api/                              # Edge API routes
          automations/                    # Niche automation endpoints
          contact/                        # Contact form handler
          cron/nurture/                   # Edge nurture cron
          dashboard/metrics/              # Dashboard metrics (AITable)
          decision/                       # Experience decisioner
          intake/                         # Edge lead intake
          intelligence/analyze/           # Website analysis
          intelligence/manifest/          # LeadOS manifest generator
          subscribe/                      # Newsletter subscribe
          track/                          # Behavioral event tracker
        assess/[niche]/                   # Assessment quiz pages
        calculator/                       # ROI calculator
        control-center/                   # Funnel control center
        dashboard/                        # Edge dashboard
        services/                         # Service pages
      components/                         # React components
      lib/                               # Shared libraries
  Funnel Blueprints/                      # Funnel blueprint documents
  _n8n_sources/                           # n8n workflow sources
  make-scenarios/                         # Make.com scenario exports
```

## Features

### Lead Capture
- Multi-source intake (forms, assessments, chat, calculators, exit intent, webhooks)
- Idempotent lead processing with deduplication via lead keys
- CORS-safe cross-origin widget embedding
- Behavioral event tracking (page views, scroll depth, CTA clicks, chat messages)

### Funnel Decisioning
- 10 funnel families: lead-magnet, qualification, chat, webinar, authority, checkout, retention, rescue, referral, continuity
- Signal-based routing (intent, source, score, preferred channel)
- Configurable funnel graphs with typed nodes and edges
- A/B experiment assignment with variant tracking

### Lead Scoring
- Multi-dimensional scoring: intent, fit, engagement, urgency, composite
- Source-weighted factors (referral, organic, paid, direct, social, email)
- Behavioral signal aggregation
- Hot lead detection and escalation

### A/B Experimentation
- Full experiment lifecycle: create, assign, convert, analyze
- Weighted variant assignment with sticky visitor bucketing
- Statistical significance detection via z-score and confidence intervals
- Experiment status management (draft, running, paused, completed)

### Multi-Touch Attribution
- Five attribution models: first-touch, last-touch, linear, time-decay, position-based
- Touchpoint recording with channel, source, medium, campaign, and referrer tracking
- Credit distribution that always sums to 1.0 across all touchpoints
- Channel performance reporting

### Email Tracking
- Open tracking via 1x1 transparent pixel
- Click tracking with safe URL redirect (blocks javascript: and data: protocols)
- Email metrics computation (open rate, click rate, bounce rate)

### Lead Magnets
- Catalog-driven lead magnet library with 60+ magnet types
- Recommendation engine with niche, funnel, source, and interest scoring
- Delivery tracking (pending, delivered, opened, failed)
- Dynamic form field generation from capture mechanism specs

### Multi-Channel Orchestration
- Email via Emailit
- WhatsApp via WBizTool
- SMS via EasyTextMarketing / SMSit
- AI Chat via Insighto
- AI Voice via Thoughtly
- Alerts via Discord webhooks and Telegram bot

### Automation
- 7-stage nurture sequence (day 0 through day 30)
- Three-visit milestone framework (lead milestones + customer milestones)
- n8n workflow provisioning and management (starter pack with intake fanout, milestone touches, referral loops)
- Cron-driven nurture progression

### Booking and Commerce
- Trafft integration with OAuth token management and service mapping
- Lunacal booking fallback
- ThriveCart checkout integration
- Document generation via Documentero and Crove (proposals, agreements, onboarding)

### Operator Tools
- Magic link authentication for operators
- Runtime configuration management (Trafft, Documentero, Crove settings)
- Dashboard with lead counts, event telemetry, persistence mode
- Automation health checks and smoke tests
- Configuration status summary

### Website Intelligence
- Website HTML analysis for business type, funnel strategy, and design extraction
- Automated LeadOS manifest generation from website analysis
- Environment variable template generation

### Referral Programs
- Partnero integration for affiliate/referral tracking
- UpViral for viral referral campaigns

## API Endpoints

### Kernel Runtime (`lead-os-hosted-runtime-wt-hybrid`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | None | System health check with tenant, funnel, and telemetry info |
| POST | `/api/intake` | CORS | Accept lead submissions from widgets and forms |
| POST | `/api/decision` | CORS | Determine next funnel step for a visitor signal |
| GET | `/api/embed/manifest` | CORS | Full embed manifest with niches, widgets, funnels, experience |
| GET | `/api/widgets/boot` | CORS | Lightweight widget boot config for embed scripts |
| GET | `/api/dashboard` | Operator | Dashboard snapshot with leads, events, framework |
| GET | `/api/runtime-config` | Operator | Read operational runtime config |
| POST | `/api/runtime-config` | Operator | Update operational runtime config |
| GET | `/api/automations/health` | None | Provider and channel health status |
| POST | `/api/automations/smoke` | Operator | Run smoke test against configured providers |
| GET | `/api/config/health` | Operator | Configuration completeness summary |
| GET | `/api/cron/nurture` | Cron secret | Process nurture sequence for eligible leads |
| POST | `/api/auth/request-link` | None | Request operator magic link |
| GET | `/api/n8n/manifest` | None | n8n starter workflow catalog |
| GET | `/api/n8n/provision` | Operator | Check n8n provisioning status |
| POST | `/api/n8n/provision` | Operator | Provision n8n starter workflows |
| GET | `/api/n8n/provision/:slug` | Operator | Check single workflow provision status |
| POST | `/api/n8n/provision/:slug` | Operator | Provision single n8n workflow |
| GET | `/api/n8n/workflows/:slug` | None | Download n8n workflow JSON |
| POST | `/api/scoring` | CORS | Compute lead scores (behavioral, demographic, intent, engagement, composite) |
| GET | `/api/experiments` | CORS | List A/B experiments (filter by `?status=`) |
| POST | `/api/experiments` | CORS | Create a new A/B experiment |
| GET | `/api/experiments/:id` | CORS | Get experiment details with analysis |
| PATCH | `/api/experiments/:id` | CORS | Update experiment (status, name, description) |
| POST | `/api/experiments/:id/assign` | CORS | Assign a visitor to an experiment variant |
| POST | `/api/experiments/:id/convert` | CORS | Record a conversion for an assigned visitor |
| GET | `/api/attribution` | CORS | Attribution report for a lead (`?leadKey=&model=`) |
| POST | `/api/attribution` | CORS | Record an attribution touchpoint |
| GET | `/api/lead-magnets` | CORS | List lead magnets (filter by `?niche=`, `?category=`, `?recommend=true`) |
| GET | `/api/lead-magnets/:slug` | CORS | Get a single lead magnet by slug or ID |
| POST | `/api/lead-magnets` | CORS | Record a lead magnet delivery |
| GET | `/api/tracking/pixel` | None | Email open tracking pixel (1x1 GIF) |
| GET | `/api/tracking/click` | None | Email click tracking redirect |
| GET | `/api/dashboard/analytics` | Operator | Funnel analytics (stages, scores, channels, niches) |
| GET | `/api/dashboard/scoring` | Operator | Lead scoring dashboard with temperature distribution |
| GET | `/api/dashboard/radar` | Operator | Hot lead radar with recent high-intent events |

### Edge Layer (`neatcircle-beta`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/intake` | Rate limited | Edge lead intake with rate limiting |
| POST | `/api/contact` | None | Contact form submission |
| POST | `/api/subscribe` | None | Newsletter subscription |
| POST | `/api/track` | Rate limited | Behavioral event tracking |
| POST | `/api/decision` | None | Experience personalization decision |
| GET | `/api/dashboard/metrics` | Dashboard secret | Dashboard metrics from AITable |
| POST | `/api/intelligence/analyze` | None | Analyze a website for LeadOS deployment |
| POST | `/api/intelligence/manifest` | None | Generate LeadOS manifest from analysis |
| GET | `/api/automations/health` | None | Integration health and automation catalog |
| POST | `/api/automations/smoke` | None | Run automation smoke tests |
| POST | `/api/automations/convert` | None | Convert lead to client (SuiteDash + email + AITable) |
| GET | `/api/cron/nurture` | Cron secret | Process nurture sequences |
| POST | `/api/automations/:niche` | None | Niche-specific automation endpoints |

## Environment Variables

See `.env.sample` in each package for the full list. Key categories:

| Category | Variables | Required |
|----------|----------|----------|
| Database | `LEAD_OS_DATABASE_URL`, `DATABASE_URL` | Yes (for PostgreSQL mode) |
| Tenant | `LEAD_OS_TENANT_ID`, `NEXT_PUBLIC_BRAND_NAME`, `NEXT_PUBLIC_SITE_URL` | Recommended |
| CRM | `SUITEDASH_PUBLIC_ID`, `SUITEDASH_SECRET_KEY` | Yes |
| Email | `EMAILIT_API_KEY` | Yes |
| WhatsApp | `WBIZTOOL_API_KEY`, `WBIZTOOL_INSTANCE_ID` | Optional |
| SMS | `EASY_TEXT_MARKETING_API_KEY` | Optional |
| Chat AI | `INSIGHTO_API_KEY` | Optional |
| Voice AI | `THOUGHTLY_API_KEY` | Optional |
| Automation | `N8N_BASE_URL`, `N8N_API_KEY` | Optional |
| Booking | `TRAFFT_API_URL`, `TRAFFT_CLIENT_ID`, `TRAFFT_CLIENT_SECRET` | Optional |
| Documents | `DOCUMENTERO_API_KEY` | Optional |
| Commerce | `THRIVECART_API_KEY` | Optional |
| Referral | `PARTNERO_PROGRAM_ID` | Optional |
| Alerts | `DISCORD_WEBHOOK_URL`, `TELEGRAM_BOT_TOKEN` | Optional |
| Auth | `LEAD_OS_OPERATOR_EMAILS`, `LEAD_OS_AUTH_SECRET` | Recommended |
| Safety | `LEAD_OS_ENABLE_LIVE_SENDS` | Recommended |

## Deployment

### Kernel Runtime (Railway)

The runtime includes a `railway.json` with Nixpacks build configuration:

```bash
cd lead-os-hosted-runtime-wt-hybrid

# Railway CLI
railway login
railway link
railway up
```

Railway configuration:
- Build: `npm install && npm run build`
- Start: `npm run start` (binds to `0.0.0.0:$PORT`)
- Health check: `/api/health`
- Restart policy: on failure (max 5 retries)

### Edge Layer (Vercel)

```bash
cd neatcircle-beta

# Vercel CLI
vercel login
vercel --prod
```

### Edge Layer (Cloudflare Workers)

```bash
cd neatcircle-beta

npm run cf:build
npm run cf:deploy
```

### Database Setup

Create a PostgreSQL database and set `LEAD_OS_DATABASE_URL`:

```bash
createdb lead_os
# Set LEAD_OS_DATABASE_URL=postgresql://user:pass@localhost:5432/lead_os
```

The runtime auto-creates tables on first access. No manual migrations are required. To use in-memory storage for development, set `LEAD_OS_USE_AITABLE_PERSISTENCE=false`.

## Testing

Both packages use the Node.js native test runner with TypeScript support:

```bash
# Kernel runtime tests
cd lead-os-hosted-runtime-wt-hybrid
npm test

# Edge layer tests
cd neatcircle-beta
npm test
```

Tests run with `LEAD_OS_USE_AITABLE_PERSISTENCE=false` and `LEAD_OS_ENABLE_LIVE_SENDS=false` to avoid external calls.

## Contributing

1. Create a feature branch from `main`: `git checkout -b feature/your-feature`
2. Make changes in the appropriate package (runtime vs edge)
3. Run tests: `npm test`
4. Check types: `npx tsc --noEmit`
5. Commit with conventional commits: `feat(intake): add phone validation`
6. Open a pull request with a description of what changed and why

### Key Principles

- **Niche = config, not fork.** New verticals are added via configuration, not code duplication.
- **Runtime is the system of record.** Funnel decisions, experiment assignments, and milestone tracking belong in the kernel runtime.
- **Providers are pluggable.** Add a new channel by implementing it in `providers.ts` and adding it to the integration map.
- **Dry-run by default.** Set `LEAD_OS_ENABLE_LIVE_SENDS=true` only in production to prevent accidental external calls.

## License

MIT
