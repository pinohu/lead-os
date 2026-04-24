# CX React

Programmable, multi-tenant lead generation infrastructure. One runtime, many niches — configure industries and funnels without shipping a fork for every vertical.

**New here?** Read **[`docs/START-HERE.md`](docs/START-HERE.md)** first (clone → run → Postgres → operator → production checks). It is the **novice entry** path and the reconciliation point between marketing, `/docs`, and repo truth.

**Doc–code parity (kernel):** after clone, run `npm run verify:product-surfaces` inside `lead-os-hosted-runtime-wt-hybrid/`. Scope and limits are defined in [`lead-os-hosted-runtime-wt-hybrid/docs/CLAIMS-VERIFICATION.md`](lead-os-hosted-runtime-wt-hybrid/docs/CLAIMS-VERIFICATION.md).

CX React captures visitor intent through embeddable widgets, scores and routes leads through configurable funnel graphs, orchestrates multi-channel follow-up (email, SMS, WhatsApp, chat, voice), generates AI-powered content, and syncs outcomes to your CRM and automation bus. It replaces 15-20 separate SaaS products with a single deployable runtime.

## By the numbers (verify — do not treat as warranties)

Kernel metrics and how to reproduce them live in **`lead-os-hosted-runtime-wt-hybrid/README.md`**. This table is a **high-level map** only; run `npm test`, `npm run enumerate:api-routes`, and each package’s own `npm run build` before quoting counts externally.

| Area | Pointer |
|------|---------|
| Kernel (CX React / Lead OS runtime) | `lead-os-hosted-runtime-wt-hybrid/` — primary tests, APIs, operator UI |
| Erie.pro territory app | `erie-pro/` — see that package’s README for route counts and `npm run build` output |
| NeatCircle edge / marketing | `neatcircle-beta/` |
| Public runtime variant | `lead-os-hosted-runtime-wt-public/` |
| Route & marketing truth table | `lead-os-hosted-runtime-wt-hybrid/docs/PRODUCT-SURFACES.md` and deployed `/docs` |

## Architecture

```
                    +---------------------------------+
                    |         Erie Pro                |
                    |          (erie-pro)             |
                    |  Next.js 15 + Tailwind          |
                    |  territory + niche sites (SSG)   |
                    +---------------+-----------------+
                                    |
                    +---------------+-----------------+
                    |         Edge Layer              |
                    |       (neatcircle-beta)         |
                    |  Next.js 15 + Tailwind          |
                    |  marketing / edge surfaces      |
                    +---------------+-----------------+
                                    |
                    +---------------+-----------------+
                    |        Kernel Runtime           |
                    | (lead-os-hosted-runtime-wt-hybrid)|
                    |  Next.js 16 + PostgreSQL        |
                    |  App Router + APIs (see hybrid) |
                    +---------------+-----------------+
                                    |
      +----------+----------+------+------+----------+
      |          |          |             |          |
  +---+----+ +---+----+ +---+----+ +-----+----+ +---+----+
  |  CRM   | | Email  | | Auto   | |  AI/ML   | | Social |
  |SuiteDash| |Sinosend| |Activep.| | OpenAI   | | 12     |
  |SalesNex| |Emailit | |  n8n   | | Anthropic| | Platf. |
  +--------+ +--------+ +--------+ +----------+ +--------+
```

| Layer | Package | Role |
|-------|---------|------|
| Erie Pro | `erie-pro` | Geographic territory platform (see package README for current route counts and deployment URLs) |
| Edge Layer | `neatcircle-beta` | Marketing / edge surfaces (Cloudflare Workers — see package README) |
| Kernel Runtime | `lead-os-hosted-runtime-wt-hybrid` | Intake, scoring, funnels, marketplace, billing, integrations, operator dashboard — canonical API list: `npm run enumerate:api-routes` |
| Automation Layer | Activepieces + n8n + cron jobs | Durable multi-step workflows, retries, milestone-driven sequences |
| CRM Layer | SuiteDash + SalesNexus | Contact management, deals, pipeline stages, human workflow |

## Tech Stack

| Category | Technology | Version |
|----------|-----------|---------|
| Framework | Next.js (App Router) | 16.2.1 |
| Language | TypeScript | 5.9.3 |
| Frontend | React, Tailwind CSS | 19.1.0 |
| Database | PostgreSQL (via `pg`) | 8.20 |
| Payments | Stripe | 21.0.1 |
| Validation | Zod | 4.3.6 |
| Queue | BullMQ | 5.71.1 |
| AI | OpenAI / Anthropic | via `ai-client.ts` |

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 15+ (optional -- in-memory fallback works for dev/demo)
- npm

### Install and Run

```bash
git clone https://github.com/pinohu/lead-os.git
cd lead-os/lead-os-hosted-runtime-wt-hybrid

npm install
npm run dev    # Starts at http://localhost:3000
```

No environment variables are required for local development. The system runs entirely in-memory with dry-run mode for all external integrations.

## Example deployments (URLs drift — confirm before linking)

| Site | URL (example) | Purpose |
|------|-----------------|---------|
| Lead OS Kernel | `https://lead-os-nine.vercel.app` | Public demo / staging style hostnames used in docs — **not** guaranteed permanent |
| Erie Pro | `https://erie-pro.vercel.app` | Territory app demo |
| NeatCircle | `https://neatcircle.com` | Edge / marketing |

### Verify

```bash
curl http://localhost:3000/api/health
```

Returns `{ "success": true, "service": "lead-os-hosted-runtime", ... }`.

### Access Points

| URL | Purpose |
|-----|---------|
| `/` | Public landing page |
| `/onboard` | Client self-service signup wizard |
| `/setup` | First-run setup wizard |
| `/dashboard` | Operator dashboard (multi-page; requires operator session) |
| `/marketplace` | Public lead marketplace |
| `/auth/sign-in` | Operator login (magic link) |
| `/assess/:slug` | Dynamic assessment forms |
| `/calculator` | ROI/savings calculator |
| `/api/health` | System health check |
| `/api/intake` | Lead intake endpoint |
| `/docs` | In-app documentation hub (API OpenAPI, SLA summary, repo doc links) on the hosted runtime |
| `/offers` | Index of catalog-backed offer paths (kernel deployment) |

See **`lead-os-hosted-runtime-wt-hybrid/docs/PRODUCT-SURFACES.md`** for a full public vs operator route map.

## Core Features

### Lead Capture
- Multi-source intake: forms, assessments, chat, calculators, voice, API, web scraping
- Embeddable widgets (script tag, iframe, React component, WordPress plugin)
- Idempotent deduplication via lead keys
- Behavioral event tracking (page views, scroll depth, CTA clicks, chat)

### Lead Scoring
- Four-dimensional scoring: intent (0-100), fit (0-100), engagement (0-100), urgency (0-100)
- Composite scoring with niche-specific weight biases
- Temperature classification: Cold (0-34), Warm (35-59), Hot (60-79), Burning (80+)
- AI-enhanced predictive scoring and churn risk analysis

### Lead Nurturing
- Multi-channel sequences: email (Sinosend), SMS (EasyText), WhatsApp (WBizTool), voice (Thoughtly), chat (Pickaxe)
- Temperature-aware content progression
- 7-stage nurture sequence (day 0 through day 30)
- Escalation engine for stale lead re-engagement

### AI Content Generation
- Social Asset Engine: 10+ content angles per topic with niche psychology
- 7 hook types x 12 platform variants (TikTok, IG, YouTube, LinkedIn, X, Threads, Facebook, Blog)
- PAS script generation for short-video, carousel, thread, article
- Content memory with hash fingerprinting and duplicate detection
- 4-stage DM conversion funnel (acknowledge > value > qualify > offer)
- AI copywriter for ads, emails, and landing pages via LangChain adapter

### AI Agent System
- Agent orchestrator with multi-agent coordination
- 4 pre-built agent teams: prospecting, content, outreach, full-stack
- Agent scheduler for cron-based recurring tasks
- Paperclip orchestrator for external AI team management with budget governance
- Audit logging with success rate tracking

### Funnel System
- 98 funnel node types across 8 families (lead magnet, qualification, chat, webinar, authority, checkout, retention, continuity)
- Composable nodes for custom flow creation
- A/B experiment engine with statistical significance detection

### Marketplace
- Lead listing with dynamic pricing by temperature: Cold $25, Warm $50, Hot $100, Burning $200
- Quality multiplier based on composite score
- Buyer claiming and outcome tracking (contacted, booked, converted)
- Revenue analytics by niche, temperature, and time period

### Billing & Monetization
- Stripe integration: checkout, portal, webhooks, usage tracking
- 8 pricing plans across 4 revenue models
- Plan enforcement with usage limit gating
- Affiliate/referral management via Partnero

### Multi-Tenant Infrastructure
- Tenant isolation via `tenantId` scoping and RLS policies
- Tenant resolution: header > subdomain > query param > env var
- 9-step automated provisioning sequence
- 6-step self-service onboarding wizard
- Encrypted credential vault per tenant

### Niche Configuration
- 13 industry template categories (service, legal, health, tech, construction, real estate, education, finance, franchise, staffing, faith, creative, general)
- Auto-generates scoring weights, assessment questions, nurture content, and funnel configs from any industry name
- Zero code changes to add a new niche

### Security
- Parameterized SQL everywhere
- HMAC-SHA256 token signing
- Stripe webhook signature verification
- SSRF protection with host allowlist
- HTTP security headers (HSTS, CSP, X-Frame-Options)
- Rate limiting on all public endpoints
- GDPR compliance (export, deletion, consent)
- RLS policy generator for database-level tenant isolation

### Operator Dashboard (31 pages)

| Page | Function |
|------|----------|
| Home | KPIs, three-visit framework, automation health |
| Agents | AI agent team management and audit logs |
| Analytics | Traffic, conversion rates, channel performance |
| Attribution | Multi-touch attribution reports |
| Billing | Subscription status, usage meters, invoices |
| Bookings | Appointment management and calendar |
| Creative | AI content generation and performance |
| Credentials | Provider API key management |
| Distribution | Lead routing rules and assignments |
| Documents | Contract and proposal generation |
| Experiments | A/B test management and results |
| Feedback | Customer feedback and NPS |
| Health | System health and integration status |
| Lead Magnets | Content offer management |
| Leads | Lead profiles with full history |
| Marketplace | Lead marketplace management |
| Pipeline | Sales pipeline visualization |
| Providers | Integration status and configuration |
| Radar | Real-time lead activity monitoring |
| Revenue | Revenue tracking and forecasting |
| Scoring | Score distribution and calibration |
| Settings | Tenant configuration |
| Tenants | Multi-tenant management (super-admin) |
| Workflows | Automation workflow management |
| Joy | Team morale, celebrations, and culture |
| Competitors | Competitive intelligence and tracking |
| Prospects | Prospect discovery and pipeline management |
| Marketing Ingestion | Marketing artifact analysis and competitive intelligence |

## Integration Catalog (137 providers)

All integrations operate in **dry-run mode** when their API key is not configured.

| Tier | Category | Integrations |
|------|----------|-------------|
| Core | Framework | Next.js, PostgreSQL, Stripe |
| Communication | Email | Sinosend, Emailit |
| Communication | SMS | EasyText Marketing |
| Communication | WhatsApp | WBizTool |
| Communication | Voice | Thoughtly |
| Communication | Call Tracking | CallScaler |
| AI | LLM | OpenAI, Anthropic |
| AI | Chatbot | Pickaxe |
| AI | Video | Meiro, Zebracat, Gumlet |
| AI | Browser | Skyvern |
| AI | Content | LangChain adapter (13 functions) |
| CRM | Pipeline | SuiteDash, SalesNexus |
| CRM | Data | AITable, Boost.space |
| Pages | Builder | GrapesJS, Brizy |
| Pages | Forms | Formbricks |
| Pages | Widgets | Claspo |
| Automation | Workflow | Activepieces, n8n, Flow Forge |
| Analytics | Tracking | Umami, Plerdy, Google Analytics |
| Scraping | Web | Firecrawl, Firecrawl MCP |
| Deployment | Hosting | Vercel, Cloudflare Pages, GitHub |
| Content | Sites | Authority site generator (5 niche templates) |
| Orchestration | Agents | Paperclip (budget governance, audit trails) |

## Revenue Models

| Model | Price Range | How It Works |
|-------|------------|-------------|
| Managed Service | $200-1,000/mo | You run Lead OS for clients, they get a branded dashboard |
| White-Label SaaS | $299-2,999/mo | Client gets their own branded instance, self-service |
| Territory Model | $300-1,500/mo | Erie-pro exclusive territory claim per niche per city |
| Implementation + Retainer | $5K-25K setup + $1K-5K/mo | Custom projects with ongoing management |
| Lead Marketplace | $25-500/lead | Capture leads and sell them through the marketplace |

## Deployment

### Vercel (recommended)

```bash
cd lead-os-hosted-runtime-wt-hybrid
vercel --prod
```

### Railway

```bash
cd lead-os-hosted-runtime-wt-hybrid
railway login && railway link && railway up
```

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Self-Hosted

```bash
npm run build && npm start
```

Place behind Nginx or Caddy with TLS termination.

## Environment Variables

No env vars are required for development. For production, see the [Complete Guide](LEAD-OS-COMPLETE-GUIDE.md#7-deployment-guide) for the full list. Key categories:

| Category | Example Variables |
|----------|-----------------|
| Database | `DATABASE_URL` |
| Auth | `LEAD_OS_OPERATOR_EMAILS` |
| Billing | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| AI | `AI_API_KEY`, `AI_PROVIDER`, `AI_MODEL` |
| Communication | `SINOSEND_API_KEY`, `EASY_TEXT_API_KEY`, `WBIZTOOL_API_KEY` |
| Automation | `ACTIVEPIECES_API_KEY`, `N8N_BASE_URL` |
| Cron | `CRON_SECRET` |

## Testing

```bash
cd lead-os-hosted-runtime-wt-hybrid
npm test
```

The hybrid kernel ships a large `node:test` tree under `tests/`. Counts change frequently — **run `npm test`** for the authoritative result. Most external integrations use **dry-run** behavior when API keys are absent.

## Documentation

| Document | Purpose |
|----------|---------|
| [**Start here (novices)**](docs/START-HERE.md) | Single path: clone → run kernel → Postgres/migrations → operator → production checks; reconciles marketing vs shipped behavior |
| [Claims verification (kernel)](lead-os-hosted-runtime-wt-hybrid/docs/CLAIMS-VERIFICATION.md) | Defines which Markdown claims are binding and what `npm run verify:product-surfaces` checks |
| [GitHub + Vercel automation](docs/GITHUB_VERCEL_AUTOMATION.md) | CI gates, Vercel Git deploy, optional migration workflow, Dependabot |
| [Complete Guide](LEAD-OS-COMPLETE-GUIDE.md) | Full platform documentation (architecture, API reference, deployment, economics, AppSumo roadmap) |
| [API Reference](docs/API_REFERENCE.md) | Detailed endpoint documentation |
| [Setup Guide](docs/SETUP_GUIDE.md) | Step-by-step installation |
| [Architecture](docs/LEAD_OPERATING_SYSTEM_ARCHITECTURE.md) | System design and layer boundaries |
| [Changelog](CHANGELOG.md) | Version history and release notes |

## Project Structure

```
lead-os/
  LEAD-OS-COMPLETE-GUIDE.md              # Comprehensive platform guide
  README.md                              # This file
  docs/                                  # Architecture, API, setup docs
  lead-os-hosted-runtime-wt-hybrid/      # Kernel runtime (system of record)
    src/
      app/
        api/                             # App Router API routes (enumerate with npm script in hybrid)
        dashboard/                       # Operator dashboard routes
        auth/                            # Authentication pages
        onboard/                         # Self-service onboarding
        setup/                           # First-run setup wizard
        marketplace/                     # Public lead marketplace
        assess/                          # Dynamic assessment forms
        calculator/                      # ROI calculator
      lib/                               # 234 library modules
        integrations/                    # 62 integration adapters
    tests/                               # node:test suite (see hybrid package)
  erie-pro/                              # Geographic territory platform (see erie-pro README + build output)
    src/
      app/                               # 46 niches x 15 page types + static
      lib/                               # niches, content, glossary, seasonal, SEO
      components/ui/                     # 52 shadcn components
  neatcircle-beta/                       # Edge / marketing layer (Cloudflare Workers)
  Funnel Blueprints/                     # Funnel blueprint documents
  _n8n_sources/                          # Vendored upstream n8n/MCP reference (see _n8n_sources/README.md)
  make-scenarios/                        # Make.com scenario exports
```

## Contributing

1. Create a feature branch from `master`: `git checkout -b feature/your-feature`
2. Make changes in the appropriate package
3. Run tests: `npm test`
4. Check types: `npx tsc --noEmit`
5. Commit with conventional commits: `feat(intake): add phone validation`
6. Open a pull request

### Key Principles

- **Niche = config, not fork.** New verticals are added via configuration, not code duplication.
- **Runtime is the system of record.** Funnel decisions, experiment assignments, and milestone tracking belong in the kernel runtime.
- **Providers are pluggable.** Add a new channel by implementing an adapter in `src/lib/integrations/`.
- **Dry-run by default.** All integrations return realistic mock data without API keys.

## License

The **kernel** (`lead-os-hosted-runtime-wt-hybrid/`) is **private — all rights reserved** (see that folder’s README). Other packages in this monorepo may carry their own terms. There is **no** blanket MIT grant at the repository root.
