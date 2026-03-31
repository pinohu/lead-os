# Lead OS: Complete Platform Guide

## Table of Contents
1. [What Lead OS Is](#1-what-lead-os-is)
2. [System Inventory](#2-system-inventory)
3. [Architecture](#3-architecture)
4. [Core Capabilities](#4-core-capabilities)
5. [Who It Serves](#5-who-it-serves)
6. [Revenue Models & Pricing](#6-revenue-models--pricing)
7. [Deployment Guide](#7-deployment-guide)
8. [Client Provisioning Guide](#8-client-provisioning-guide)
9. [Operator Manual](#9-operator-manual)
10. [API Reference](#10-api-reference)
11. [Integration Catalog](#11-integration-catalog)
12. [Economic Analysis](#12-economic-analysis)
13. [AppSumo Integration Roadmap](#13-appsumo-integration-roadmap)

---

## 1. What Lead OS Is

Lead OS is a white-label, multi-tenant lead generation, scoring, nurturing, and monetization platform that can be deployed for **any business niche**. It is a complete revenue engine, not a single tool. It replaces the need for 15-20 separate SaaS products by unifying lead capture, scoring, AI content generation, email/SMS/WhatsApp nurturing, CRM sync, booking, analytics, and billing into a single deployable runtime.

### What makes it different

- **Niche-agnostic**: A built-in niche generator auto-configures the entire system for any industry (legal, dental, HVAC, real estate, coaching, etc.) using rule-based template composition. No LLM dependency for configuration.
- **Multi-tenant from day one**: Each client gets isolated data, scoring weights, funnels, branding, and provider credentials. Managed via API or self-service onboarding wizard.
- **Four revenue models in one codebase**: Sell it as a managed service, a white-label SaaS, an implementation + retainer, or a lead marketplace. All four work simultaneously.
- **137 provider integrations**: From AI (OpenAI, Anthropic) to CRM (SuiteDash, SalesNexus) to email (Sinosend) to SMS (EasyText) to video (Zebracat, Meiro, Gumlet) to page builders (Brizy, GrapesJS) to automation (Activepieces, n8n) to analytics (Umami, Plerdy) to booking (Trafft, Lunacal). Every provider operates in dry-run mode without API keys, so the system always works.
- **Embeddable**: Drop a `<script>` tag on any website. The widget system renders lead capture forms, assessments, calculators, and chat interfaces without requiring the client to change their website.
- **AI-powered content pipeline**: Generates social media content (angles, hooks, scripts), adapts it across 12 platform variants (TikTok, IG Reels, YouTube Shorts, LinkedIn, X, Threads), tracks performance, and auto-generates DM conversion sequences.

### By the numbers

| Metric | Count |
|--------|-------|
| Total source files | 1,100+ |
| Lines of code | 210,000+ |
| API endpoints | 499 |
| UI pages | 60 |
| Dashboard pages | 29 |
| Provider integrations | 137 |
| Lib modules | 234 |
| Integration adapters | 62 |
| Funnel node types | 98 |
| Industry templates | 13 |
| Test files | 175 |
| Test cases | 4,187 |
| Test pass rate | 100% |
| Erie-Pro niches | 46 |
| Erie-Pro pages | 702 |
| Total deployed pages | 1,393 |

---

## 2. System Inventory

### Core Engines (src/lib/)

| Engine | File | Purpose |
|--------|------|---------|
| Intake Engine | `intake.ts` | Normalizes, deduplicates, and routes incoming leads from any source |
| Scoring Engine | `scoring-engine.ts` | Computes intent, fit, engagement, urgency, and composite scores |
| Personalization Engine | `personalization-engine.ts` | Delivers niche-specific, temperature-aware content and CTAs |
| Context Engine | `context-engine.ts` | Maintains full lead lifecycle context with scoring history |
| Niche Generator | `niche-generator.ts` | Auto-generates complete niche configs from an industry name |
| Niche Templates | `niche-templates.ts` | 13 industry category templates (1,905 lines of domain knowledge) |
| Funnel Library | `funnel-library.ts` | 98 funnel node types across 8 funnel families |
| Catalog | `catalog.ts` | Niche registry with runtime registration support |
| Offer Engine | `offer-engine.ts` | Dynamic offer selection based on lead temperature |
| Lead Magnet Engine | `lead-magnet-engine.ts` | Manages and delivers lead magnets per niche/temperature |
| Trust Engine | `trust-engine.ts` | Social proof, testimonials, and authority signals |
| Psychology Engine | `psychology-engine.ts` | Behavioral triggers and persuasion pattern selection |
| Deep Psychology | `deep-psychology.ts` | Advanced psychological profiling for content |
| Persona Engine | `persona-engine.ts` | Buyer persona generation and matching |
| Experience Engine | `experience.ts` | Multi-step user experience orchestration |
| Escalation Engine | `escalation-engine.ts` | Stale lead re-engagement and handoff triggers |
| Rescore Engine | `rescore-engine.ts` | Periodic lead score recalculation |

### Automated Prospecting

| Engine | File | Purpose |
|--------|------|---------|
| Discovery Scout | `discovery-scout.ts` | Business discovery via web scraping, digital presence gap scoring, complementary niche mapping |
| Opportunity Classifier | `opportunity-classifier.ts` | 4-way classification (managed-service, white-label, affiliate, referral-partner) with confidence scoring and outreach templates |
| Prospect Store | `prospect-store.ts` | Full CRUD persistence for prospects (memory + Postgres JSONB) with filters and aggregation |
| Prospect Pipeline | `prospect-pipeline.ts` | End-to-end pipeline: scout > classify > create prospect > auto-ingest into lead system |

### Experiment & Optimization

| Engine | File | Purpose |
|--------|------|---------|
| Experiment Engine | `experiment-engine.ts` | A/B testing with variant assignment, conversion tracking, z-test analysis, and winner promotion |
| Experiment Evaluator | `experiment-evaluator.ts` | Autoresearch loop: evaluate running experiments, early-stop degradation, auto-promote winners at 95% confidence |
| Experiment Store | `experiment-store.ts` | Lightweight experiment store bridging API routes to engine types |

### Competitive Analysis

| Engine | File | Purpose |
|--------|------|---------|
| Competitor Store | `competitor-store.ts` | Track and manage competitor profiles with analysis history |
| Design Ingestion | `design-ingestion.ts` | Scrape competitor sites, extract layout, copy, funnel, and design token signals |
| Design-to-Spec | `design-ingestion-to-spec.ts` | Convert raw design ingestion into actionable creative specs |
| Marketing Ingestion | `marketing-ingestion.ts` | Pipeline for processing marketing artifacts into competitive intelligence |
| Marketing Artifact Store | `marketing-artifact-store.ts` | Persistence for ingested marketing artifacts |
| Artifact-to-Ingestion | `marketing-artifact-to-ingestion.ts` | Transform stored artifacts into ingestion-ready formats |

### Revenue & Monetization

| Engine | File | Purpose |
|--------|------|---------|
| Billing | `billing.ts` | Stripe integration: checkout, portal, webhooks, usage tracking |
| Plan Catalog | `plan-catalog.ts` | 8 pricing plans across 4 revenue models |
| Plan Enforcer | `plan-enforcer.ts` | Usage limit enforcement and feature gating |
| Marketplace | `marketplace.ts` | Lead listing, pricing, claiming, outcome tracking |
| Monetization Engine | `monetization-engine.ts` | Revenue tracking, referral links, affiliate management |
| Revenue Engine | `revenue-engine.ts` | Revenue analytics and forecasting |
| Revenue Pipeline | `revenue-pipeline.ts` | Pipeline stage tracking and conversion metrics |

### Multi-Tenant Infrastructure

| Component | File | Purpose |
|-----------|------|---------|
| Tenant Store | `tenant-store.ts` | CRUD for tenant records (memory + Postgres JSONB) |
| Tenant Context | `tenant-context.ts` | Request-scoped tenant resolution (header > subdomain > query > env) |
| Tenant Config | `tenant.ts` | Static tenant configuration with env var fallback |
| Tenant Isolation | `tenant-isolation.ts` | Per-plan quotas, RLS policy generation |
| Tenant Provisioner | `tenant-provisioner.ts` | 9-step automated provisioning sequence |
| Onboarding | `onboarding.ts` | 6-step self-service signup state machine |

### Content & Social

| Engine | File | Purpose |
|--------|------|---------|
| Social Asset Engine | `social-asset-engine.ts` | Orchestrates the full content pipeline |
| Angle Generator | `social-angle-generator.ts` | 10+ content angles per topic with niche psychology |
| Hook Generator | `social-hook-generator.ts` | 7 hook types x 6 platforms with engagement scoring |
| Script Generator | `social-script-generator.ts` | PAS scripts for short-video, carousel, thread, article |
| Platform Adapter | `social-platform-adapter.ts` | 12 platform variants with character-aware limits |
| Content Memory | `social-content-memory.ts` | Hash fingerprinting, duplicate detection, exhaustion tracking |
| Performance Tracker | `social-performance-tracker.ts` | Content ROI, winning pattern identification |
| DM Engine | `social-dm-engine.ts` | 4-stage DM funnel (acknowledge > value > qualify > offer) |
| AI Copywriter | `ai-copywriter.ts` | AI-powered copy generation for ads, emails, landing pages |
| Weaponized Creative | `weaponized-creative.ts` | High-conversion creative asset generation |

### Communication

| Channel | File | Purpose |
|---------|------|---------|
| Email Sender | `email-sender.ts` | Template-based email delivery |
| Email Templates | `email-templates.ts` | Pre-built email templates per funnel stage |
| Email Tracking | `email-tracking.ts` | Open, click, bounce, unsubscribe tracking |
| Providers | `providers.ts` | 15+ provider integrations (email, SMS, WhatsApp, voice) |
| Notification Hub | `notification-hub.ts` | Multi-channel notification orchestration |

### AI & Automation

| Component | File | Purpose |
|-----------|------|---------|
| AI Client | `ai-client.ts` | OpenAI/Anthropic API client with provider strategy |
| AI Chat Agent | `ai-chat-agent.ts` | Conversational lead qualification agent |
| AI Predictive | `ai-predictive.ts` | Predictive lead scoring and churn risk |
| AI Scoring | `ai-scoring.ts` | ML-enhanced score computation |
| Agent Orchestrator | `agent-orchestrator.ts` | Multi-agent coordination for complex workflows |
| Agent Templates | `agent-templates.ts` | 4 pre-built agent teams (prospecting, content, outreach, full-stack) |
| Agent Scheduler | `agent-scheduler.ts` | Cron-based recurring agent task execution |
| Agent Audit Log | `agent-audit-log.ts` | Action logging with success rates |
| Paperclip Orchestrator | `paperclip-orchestrator.ts` | External AI agent team management with budget governance |
| LangChain Adapter | `langchain-adapter.ts` | 13 AI content generation functions |
| Skyvern Adapter | `skyvern-adapter.ts` | Browser automation for scraping and form filling |

### Data & Analytics

| Component | File | Purpose |
|-----------|------|---------|
| Runtime Store | `runtime-store.ts` | Persistence layer (memory + Postgres + AITable) |
| Product Analytics | `product-analytics.ts` | Tenant health scoring, feature usage tracking |
| Attribution | `attribution.ts` | Multi-touch attribution modeling |
| Data Pipeline | `data-pipeline.ts` | ETL pipeline for lead data processing |
| Data Moat | `data-moat.ts` | Proprietary data accumulation and competitive advantage |
| Channel Domination | `channel-domination.ts` | Channel performance ranking and budget allocation |
| Adaptive Loop | `adaptive-loop.ts` | Self-optimizing feedback loops |

### Infrastructure

| Component | File | Purpose |
|-----------|------|---------|
| Database | `db.ts` | PostgreSQL pool with configurable TLS |
| Auth System | `auth-system.ts` | User, API key, and session management |
| Auth Middleware | `auth-middleware.ts` | Request authentication with header-based fast path |
| Operator Auth | `operator-auth.ts` | Magic link auth for operators |
| Rate Limiter | `rate-limiter.ts` | Sliding window rate limiting |
| CORS | `cors.ts` | Origin whitelisting for embedded widgets |
| GDPR | `gdpr.ts` | Data export, deletion, and consent management |
| Webhook Registry | `webhook-registry.ts` | Webhook CRUD, HMAC signing, delivery tracking |
| Credentials Vault | `credentials-vault.ts` | Encrypted provider credential storage |
| Auto Deploy | `auto-deploy.ts` | GitHub, Vercel, and Cloudflare Pages deployment |
| Realtime | `realtime.ts` | Server-sent events for live dashboard updates |

### Integration Adapters (62 files)

| Adapter | Category | What It Does |
|---------|----------|-------------|
| Activepieces | Automation | Flow CRUD, 5 pre-built workflow templates |
| Brizy | Page Builder | Page CRUD, publishing, widget embedding |
| Claspo | Conversion | Widget CRUD, embed scripts, A/B testing |
| EasyText | SMS | SMS sending, campaigns, sequences |
| Sinosend | Email | Email campaigns, sequences, enrollment |
| Gumlet | Video Hosting | Video upload, analytics, embeds |
| Meiro | AI Video | Avatar video generation, batch personalized outreach |
| Pickaxe | AI Chatbot | Chatbot CRUD, knowledge base, lead qualification |
| SalesNexus | CRM | Contact/pipeline/deal CRUD, bi-directional lead sync |
| Thoughtly | AI Voice | Voice agent CRUD, outbound calls, batch calling |
| Zebracat | AI Video | Text-to-video, templates, batch generation |
| Firecrawl | Web Scraping | URL scraping, site crawling, batch operations |
| GrapesJS | Page Builder | 5 landing page templates, lead widget injection |
| Formbricks | Surveys | Survey CRUD, lead qualification scoring |
| Umami | Analytics | Privacy-first analytics, funnel analysis |
| LangChain | AI Content | Email gen, LinkedIn messages, ad copy, company analysis |
| Skyvern | Browser Automation | LinkedIn scraping, form filling, directory scraping |
| Firecrawl MCP | AI Scraping | 5 lead discovery workflows via MCP protocol |
| Paperclip | Agent Orchestration | Agent teams, budget governance, audit trails |
| Hosted Runtime | Hosting | Subdomain provisioning, deployment, custom domains |
| Embed Widgets | Widgets | 4 embed formats (script/iframe/React/WordPress) |
| Flow Forge | Workflows | Visual workflow builder, 4 pre-built lead workflows |
| n8n Enhanced | Workflows | n8n workflow management, JSON import/export |
| Authority Site | Content | Authority site generation, 5 niche templates, SEO |

---

## 3. Architecture

### Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2.1 (App Router) |
| Language | TypeScript 5.9.3 |
| Runtime | Node.js |
| Database | PostgreSQL (pg 8.20) |
| Payment | Stripe (stripe 21.0.1) |
| Validation | Zod 4.3.6 |
| Queue | BullMQ 5.71.1 |
| UI | React 19.1.0 |

### Architectural Style

**Modular monolith** deployed as a single Next.js application. Clean separation between three layers:

```
Middleware (authentication gate, CORS, requestId)
    |
API Routes (499 endpoints - validation + orchestration)
    |
Library Modules (234 files - business logic, engines, stores)
    |
Persistence (PostgreSQL + in-memory + AITable)
```

### Multi-Tenant Data Model

Every data record is scoped by `tenantId`. The system resolves the active tenant from:
1. `X-Tenant-ID` header (API calls)
2. Subdomain (`acme.leadosapp.com`)
3. `tenantId` query parameter
4. Environment variable default (single-tenant mode)

PostgreSQL tables use JSONB payloads with `tenant_id` columns and Row-Level Security policies for database-level isolation.

### Authentication Flow

The middleware handles all authentication and sets identity headers:
- `x-authenticated-user-id`
- `x-authenticated-role` (owner, operator, viewer)
- `x-authenticated-tenant-id`
- `x-authenticated-method` (api-key, session, operator-cookie)

Supported auth methods:
- **API Keys** (`Bearer los_*`) - for programmatic access
- **Session Tokens** (`Bearer sess_*`) - for application sessions
- **Magic Link** - passwordless operator login via email
- **Operator Cookie** (`leados_operator_session`) - dashboard access

### Persistence Model

Dual-mode persistence used throughout:
- **In-memory Maps** - always available, zero-config, used for development and testing
- **PostgreSQL JSONB** - activated when `DATABASE_URL` is set, used for production

Every store automatically creates its tables on first use (`ensureSchema()`). No manual migration steps required for initial deployment.

### Security Posture

- Parameterized SQL everywhere (zero injection risk)
- HMAC-SHA256 token signing
- Stripe webhook signature verification
- SSRF protection on AI API URLs (host allowlist)
- HTTP security headers (HSTS, CSP, X-Frame-Options)
- Configurable TLS certificate validation on database connections
- Rate limiting on all public endpoints
- GDPR compliance (data export, deletion, consent management)
- RLS policy generator for database-level tenant isolation

---

## 4. Core Capabilities

### 4.1 Lead Capture

Leads enter the system through multiple channels:
- **Embedded widgets** (script tag on any website)
- **Landing pages** (built with GrapesJS or Brizy)
- **Assessment forms** (multi-step qualification)
- **Calculators** (ROI, savings, cost calculators)
- **Chat** (AI-powered conversational capture)
- **Voice** (Thoughtly AI voice agents)
- **API** (direct POST to `/api/intake`)
- **Web scraping** (Firecrawl-powered prospect discovery)
- **Directory scraping** (Skyvern browser automation)

Every lead is normalized, deduplicated, and stored with a canonical schema that includes contact info, source attribution, behavioral signals, and assessment responses.

### 4.2 Lead Scoring

Four-dimensional scoring computed in real time:

| Dimension | Factors |
|-----------|---------|
| **Intent** (0-100) | Pages viewed, time on site, calculator usage, chat engagement, return visits |
| **Fit** (0-100) | Company size, budget, timeline, industry match, role seniority |
| **Engagement** (0-100) | Email opens/clicks, content downloads, webinar attendance, form completions |
| **Urgency** (0-100) | Urgency language in messages, timeline indicators, competitive mentions |
| **Composite** (0-100) | Weighted combination with niche-specific scoring bias |

Scoring weights are configurable per niche. Legal niches weight compliance fit higher. Home services weight urgency higher. Each niche template includes its own scoring bias.

Temperature classification:
- **Cold** (0-34): Awareness stage, nurture with educational content
- **Warm** (35-59): Consideration stage, offer case studies and demos
- **Hot** (60-79): Decision stage, push booking and proposals
- **Burning** (80-100): Ready to buy, immediate human handoff

### 4.3 Lead Nurturing

Automated multi-channel nurture sequences:
- **Email** (via Sinosend, or any SMTP provider)
- **SMS** (via EasyText Marketing)
- **WhatsApp** (via WBizTool)
- **Voice** (via Thoughtly AI agents)
- **Chat** (via Pickaxe AI chatbots)

Each nurture stage has temperature-aware content. A cold lead gets educational content. A warm lead gets case studies. A hot lead gets direct booking links. The system automatically advances leads through stages based on engagement signals.

### 4.4 AI Content Generation

The Social Asset Engine produces platform-ready content:

1. **Angle Generation**: 10+ content angles per topic using niche psychology profiles (pest-control, real-estate, dental, immigration-law, roofing, etc.)
2. **Hook Generation**: 7 hook types (question, shock, story, statistic, contrarian, challenge, metaphor) adapted per platform with character-aware limits
3. **Script Generation**: 4 formats (short-video PAS structure, carousel, thread, article-outline)
4. **Platform Adaptation**: 12 variants (TikTok, IG Reels, IG Carousel, IG Stories, YouTube Shorts, YouTube Long, LinkedIn, X/Twitter, Threads, Facebook, Blog, Email Newsletter)
5. **Content Memory**: Hash-based fingerprinting prevents duplicate content, tracks topic exhaustion
6. **Performance Tracking**: Engagement metrics, content ROI, winning pattern identification
7. **DM Conversion**: 4-stage funnel (acknowledge > value > qualify > offer) with niche-specific templates

Additional AI capabilities via LangChain adapter:
- Email copy generation
- LinkedIn message generation
- Landing page copy
- Ad copy (Google, Facebook, LinkedIn)
- Company analysis from website URL
- Chat conversation extraction to lead profiles

### 4.5 Funnel System

98 funnel node types organized into 8 families:

| Family | Purpose | Key Nodes |
|--------|---------|-----------|
| **Lead Magnet** | Capture with content offer | optin_form, lead_magnet_delivery, email_followup |
| **Qualification** | Multi-step assessment | assessment_node, scoring_node, persona_classifier |
| **Chat** | Conversational capture | chat_entry, chat_capture, objection_detector |
| **Webinar** | Event-based conversion | webinar_register, webinar_live, replay_invite |
| **Authority** | Long-form trust building | case_study_node, documentary_node, faq_node |
| **Checkout** | Transaction completion | offer_page, checkout_node, order_bump, upsell_node |
| **Retention** | Post-sale engagement | welcome_node, onboarding_checklist, retention_check |
| **Continuity** | Recurring revenue | continuity_offer, renewal_node, referral_invite |

Funnels are composable. An operator can mix nodes from different families to create custom flows.

### 4.6 Marketplace

The lead marketplace enables Model 4 (lead arbitrage):
- Leads that score above a threshold are auto-published with anonymized summaries
- Dynamic pricing: Cold leads start at $25, Warm at $50, Hot at $100, Burning at $200
- Quality multiplier increases price based on composite score
- Buyers claim leads and report outcomes (contacted, booked, converted, no-response)
- Revenue analytics by niche, temperature, and time period

### 4.7 Embeddable Widgets

Four embed formats for client websites:
1. **Script tag** - single `<script>` tag, renders widget inline
2. **iFrame** - sandboxed embed for maximum isolation
3. **React component** - for React/Next.js client sites
4. **WordPress plugin** - auto-generated plugin ZIP with shortcode

Widgets support: lead capture forms, assessments, calculators, chat interfaces, and booking widgets. Each is themed to the tenant's brand colors and renders on the tenant's custom domain.

### 4.8 Operator Dashboard

29 dashboard pages for client operators:

| Page | Function |
|------|----------|
| Dashboard (home) | Overview with KPIs, three-visit framework, automation health, getting-started checklist |
| Agents | AI agent team management, orchestration, audit logs |
| Analytics | Traffic, conversion rates, channel performance |
| Attribution | Multi-touch attribution reports |
| Billing | Subscription status, usage meters, invoice history |
| Bookings | Appointment management and calendar view |
| **Competitors** | Competitor tracking, website analysis, design token extraction |
| Creative | AI content generation and performance tracking |
| Credentials | Provider API key management with verification flow |
| Distribution | Lead routing rules and assignments |
| Documents | Contract and proposal generation |
| Experiments | A/B test management with statistical analysis and autoresearch |
| Feedback | Customer feedback and NPS tracking |
| Health | System health and integration status |
| Lead Magnets | Content offer management |
| Leads | Individual lead profiles with full history |
| Leads Detail | Single lead deep-dive with timeline and scoring history |
| Marketplace | Lead marketplace management |
| **Marketing Ingestion** | Marketing artifact pipeline and competitive intelligence |
| Pipeline | Sales pipeline visualization |
| **Prospects** | Automated prospect discovery, quality scoring, outreach management |
| Providers | Integration status and configuration |
| Radar | Real-time lead activity monitoring |
| Revenue | Revenue tracking and forecasting |
| Scoring | Score distribution and calibration |
| Settings | Tenant configuration |
| Tenants | Multi-tenant management (super-admin) |
| Workflows | Automation workflow management |

---

## 5. Who It Serves

### Primary Users

**1. Digital Marketing Agencies**
Run lead generation as a managed service for their clients. Deploy a white-labeled instance per client vertical. Charge $2K-10K/month per client.

**2. SaaS Entrepreneurs**
Launch a vertical lead-gen SaaS (e.g., "LeadGen for Dentists") without building from scratch. White-label at $299-$2,999/month per seat.

**3. Lead Generation Companies**
Capture leads across multiple niches and sell them through the marketplace. The system handles scoring, enrichment, and pricing automatically.

**4. Consultants & Implementers**
Deploy Lead OS for clients as a done-for-you service. Charge $5K-25K for setup plus $1K-5K/month retainer.

**5. Franchise Networks**
Deploy identical lead capture across 50-500 franchise locations with centralized analytics and per-location customization.

### Industries Served (13 template categories)

| Category | Example Niches |
|----------|---------------|
| **Service** | HVAC, plumbing, pest control, cleaning, landscaping |
| **Legal** | Personal injury, immigration, family law, criminal defense |
| **Health** | Dental, chiropractic, med spa, physical therapy |
| **Tech** | SaaS, IT services, managed security, cloud consulting |
| **Construction** | General contracting, roofing, solar, remodeling |
| **Real Estate** | Residential, commercial, property management |
| **Education** | Tutoring, test prep, online courses, trade schools |
| **Finance** | Accounting, financial planning, insurance, mortgage |
| **Franchise** | Multi-location businesses, franchise development |
| **Staffing** | Recruiting, temp agencies, executive search |
| **Faith** | Churches, ministries, faith-based organizations |
| **Creative** | Photography, videography, design agencies |
| **General** | Any service business (fallback template) |

The niche generator can produce a complete configuration for **any industry** by combining templates from the closest category with the provided keywords and context.

---

## 6. Revenue Models & Pricing

### Model 1: Managed Service ($200-1,000/mo)

You run Lead OS for the client. They get a branded dashboard and you handle configuration, optimization, and support.

| Plan | Setup | Monthly | Leads/mo | Emails/mo | SMS/mo |
|------|-------|---------|----------|-----------|--------|
| Starter | $350 | $200 | 500 | 5,000 | 500 |
| Growth | $750 | $500 | 2,000 | 25,000 | 2,000 |
| Enterprise | $1,500 | $1,000 | Unlimited | Unlimited | Unlimited |

### Model 2: White-Label SaaS ($299-$2,999/mo)

Client gets their own branded instance. Self-service with your branding.

| Plan | Monthly | Leads/mo | Operators | Funnels |
|------|---------|----------|-----------|---------|
| Starter | $99 | 100 | 1 | 2 |
| Growth | $249 | 500 | 3 | 5 |
| Enterprise | $499 | 2,000 | 10 | Unlimited |

### Model 3: Implementation + Retainer

Custom projects with one-time setup fees plus ongoing management.

| Component | Range |
|-----------|-------|
| Discovery & Setup | $5,000 - $25,000 |
| Monthly Retainer | $1,000 - $5,000 |

### Model 4: Lead Marketplace

Capture leads and sell them to buyers. Dynamic pricing based on temperature and quality.

| Temperature | Base Price | With Quality Multiplier |
|-------------|-----------|------------------------|
| Cold | $25 | $25 - $50 |
| Warm | $50 | $50 - $125 |
| Hot | $100 | $100 - $300 |
| Burning | $200 | $200 - $500+ |

---

## 7. Deployment Guide

### Prerequisites

- Node.js 20+
- PostgreSQL 15+ (optional for production; in-memory works for dev/demo)
- Stripe account (for billing features)
- Domain name (for production)

### Local Development

```bash
# Clone the repository
git clone https://github.com/pinohu/lead-os.git
cd lead-os/lead-os-hosted-runtime-wt-hybrid

# Install dependencies
npm install

# Start development server
npm run dev
# Server starts at http://localhost:3000
```

No environment variables are required for local development. The system runs entirely in-memory with dry-run mode for all external integrations.

### Environment Variables

```bash
# Database (enables persistent storage)
DATABASE_URL=postgresql://user:pass@host:5432/leados

# Database TLS (production)
DB_SSL_REJECT_UNAUTHORIZED=true
DB_SSL_CA_CERT="-----BEGIN CERTIFICATE-----..."

# Authentication
LEAD_OS_OPERATOR_EMAILS=admin@example.com,ops@example.com

# Billing (Stripe)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# AI (at least one)
AI_API_KEY=sk-...
AI_PROVIDER=openai  # or anthropic
AI_MODEL=gpt-4o     # or claude-sonnet-4-20250514

# Communication (optional, dry-run without)
SINOSEND_API_KEY=...          # Email
EASY_TEXT_API_KEY=...         # SMS
WBIZTOOL_API_KEY=...         # WhatsApp
THOUGHTLY_API_KEY=...        # Voice

# Integrations (optional)
FIRECRAWL_API_KEY=...        # Web scraping
ACTIVEPIECES_API_KEY=...     # Workflow automation
N8N_BASE_URL=...             # n8n workflows
SUITEDASH_API_KEY=...        # CRM
TRAFFT_API_KEY=...           # Booking

# Cron Protection
CRON_SECRET=your-random-secret

# Deployment
GITHUB_TOKEN=...             # Auto-deploy
VERCEL_TOKEN=...             # Vercel deployment
```

### Production Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables
vercel env add DATABASE_URL
vercel env add STRIPE_SECRET_KEY
# ... etc
```

### Production Deployment (Railway)

```bash
# Connect to Railway
railway init
railway link

# Deploy
railway up

# Add PostgreSQL
railway add postgresql
```

### Production Deployment (Docker)

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

### Production Deployment (Self-Hosted)

```bash
# Build
npm run build

# Start (listens on 0.0.0.0:3000)
npm start
```

Place behind Nginx or Caddy with TLS termination.

### Accessing the System

| URL | Purpose |
|-----|---------|
| `/` | Public-facing landing page |
| `/onboard` | Client self-service signup wizard |
| `/setup` | First-run setup wizard |
| `/auth/sign-in` | Operator login (magic link) |
| `/auth/check-email` | Magic link confirmation page |
| `/dashboard` | Operator dashboard (falls back to demo mode without auth) |
| `/marketplace` | Public lead marketplace |
| `/assess/:slug` | Dynamic assessment forms per niche |
| `/calculator` | ROI/savings calculator |
| `/offers/:slug` | Dynamic offer pages |
| `/funnel/:family` | Funnel visualization by family |
| `/p/:tenantSlug/:pageSlug` | Tenant-specific published pages |
| `/sites/:deploymentId` | Deployed site preview |
| `/api/health` | System health check |
| `/api/intake` | Lead intake endpoint |
| `/api/setup/status` | First-run setup status check |

---

## 8. Client Provisioning Guide

### Automated Provisioning (API)

```bash
# Step 1: Create a tenant
curl -X POST https://your-domain.com/api/provision \
  -H "Authorization: Bearer los_your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "acme-plumbing",
    "brandName": "Acme Plumbing",
    "siteUrl": "https://acmeplumbing.com",
    "supportEmail": "leads@acmeplumbing.com",
    "operatorEmail": "owner@acmeplumbing.com",
    "niche": "Plumbing",
    "industry": "home-services",
    "revenueModel": "managed",
    "plan": "growth"
  }'
```

The provisioning engine executes 9 steps automatically:
1. Creates tenant record with unique ID
2. Generates niche config (scoring weights, assessment questions, nurture content)
3. Registers niche in the catalog
4. Registers personalization content
5. Provisions n8n workflows (if n8n configured)
6. Sets up CRM pipeline tags
7. Generates embeddable `<script>` tag
8. Creates operator account
9. Sends welcome magic link to operator email

Response includes:
- `tenantId` - unique identifier
- `embedScript` - HTML snippet for client's website
- `dashboardUrl` - operator dashboard URL
- `operatorEmail` - where the magic link was sent

### Self-Service Onboarding (UI)

Direct clients to `https://your-domain.com/onboard`. The 6-step wizard:

1. **Niche**: Pick from catalog or type a custom niche (generator runs automatically)
2. **Plan**: Select pricing tier with feature comparison table
3. **Branding**: Enter business name, accent color, logo URL
4. **Integrations**: Toggle which providers to enable
5. **Review**: Confirm all settings
6. **Complete**: Receive embed code, dashboard link, and magic link

### Embedding on Client Website

After provisioning, the client adds one line to their website:

```html
<script src="https://your-domain.com/api/embed/manifest?tenantId=TENANT_ID"></script>
```

This renders the configured widgets (lead forms, assessments, chat) with the client's branding. No additional code changes needed.

---

## 9. Operator Manual

### Daily Operations

**Viewing Leads**: Dashboard > Leads shows all captured leads with scores, temperature badges, and full interaction history. Click any lead to see their complete timeline.

**Monitoring Performance**: Dashboard > Analytics shows conversion funnels, channel attribution, and trend lines. Dashboard > Radar shows real-time lead activity.

**Managing Content**: Dashboard > Creative generates new social content. Select a topic, choose platforms, and the AI produces ready-to-post content with hooks, scripts, and hashtags.

**Checking Health**: Dashboard > Health shows integration status, API connectivity, and system metrics.

### Configuration

**Scoring Calibration**: Dashboard > Scoring lets you adjust scoring weights. Increase urgency weight for industries where speed matters (emergency services). Increase fit weight for B2B with strict qualification criteria.

**Funnel Setup**: Dashboard > Pipeline shows the active funnel. Operators can enable/disable funnel families and configure which node types are active.

**Provider Credentials**: Dashboard > Credentials lets operators enter their own API keys for email, SMS, CRM, and other integrations. Keys are encrypted at rest.

**Experiments**: Dashboard > Experiments manages A/B tests with autoresearch. The system auto-evaluates running experiments using z-test for proportions, early-stops when a variant severely degrades performance, and auto-promotes winners at 95% confidence. Five optimization surfaces: email-subject (48hr cycles), CTA copy (72hr), lead-magnet offers (1wk), scoring weights (2wk), funnel-step order (3wk).

**Prospect Discovery**: Dashboard > Prospects runs the automated prospecting engine. Scout niches to discover businesses, score their digital presence gaps, classify opportunities (managed-service, white-label, affiliate, referral-partner), and auto-ingest into the lead pipeline with personalized outreach templates.

**Competitive Analysis**: Dashboard > Competitors tracks competitor websites, extracts design tokens, funnel patterns, and copy signals. Dashboard > Marketing Ingestion processes artifacts into actionable competitive intelligence for creative differentiation.

### Billing Management

**For managed service operators**: Dashboard > Billing shows the client's subscription, usage against plan limits, and invoice history. Usage meters track leads, emails, SMS, and WhatsApp messages.

**Stripe integration**: Checkout sessions, customer portal, and webhook handling are automated. Clients can upgrade/downgrade plans through the portal.

### GDPR Compliance

Three API endpoints handle GDPR:
- `POST /api/gdpr/export` - exports all data for a lead
- `POST /api/gdpr/deletion` - deletes all data for a lead
- `POST /api/gdpr/consent` - records consent preferences

Dashboard > Settings includes a GDPR configuration section.

---

## 10. API Reference

### Lead Operations

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/intake` | Submit a new lead (public) |
| GET | `/api/context/:leadKey` | Get lead context and scores |
| POST | `/api/scoring` | Compute scores for a lead |
| POST | `/api/rescore` | Recalculate scores for all leads |
| POST | `/api/personalization` | Get personalized content for a lead |
| GET | `/api/dashboard` | Dashboard summary data |
| GET | `/api/dashboard/analytics` | Detailed analytics |

### Tenant Management

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/tenants` | List all tenants (paginated) |
| POST | `/api/tenants` | Create a tenant |
| GET | `/api/tenants/:id` | Get tenant details |
| PATCH | `/api/tenants/:id` | Update tenant config |
| POST | `/api/provision` | Provision a full tenant |
| GET | `/api/provision/:id/status` | Check provisioning progress |

### Billing

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/billing/checkout` | Create Stripe checkout session |
| POST | `/api/billing/portal` | Create Stripe billing portal session |
| GET | `/api/billing/usage` | Get current period usage |
| POST | `/api/billing/webhook` | Stripe webhook handler |

### Marketplace

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/marketplace/leads` | Browse available leads (public) |
| POST | `/api/marketplace/leads` | Publish a lead to marketplace |
| POST | `/api/marketplace/leads/:id/claim` | Claim a lead |
| POST | `/api/marketplace/leads/:id/outcome` | Report lead outcome |
| GET | `/api/marketplace/revenue` | Revenue analytics |

### Social Content

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/social/angles` | Generate content angles |
| POST | `/api/social/hooks` | Generate hooks for angles |
| POST | `/api/social/scripts` | Generate full scripts |
| POST | `/api/social/adapt` | Adapt content for platforms |
| POST | `/api/social/publish` | Publish to social platforms |
| GET | `/api/social/performance` | Content performance metrics |
| POST | `/api/social/dm/trigger` | Trigger DM conversion sequence |

### AI

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/ai/generate/email` | Generate email copy |
| POST | `/api/ai/generate/linkedin` | Generate LinkedIn messages |
| POST | `/api/ai/generate/landing-copy` | Generate landing page copy |
| POST | `/api/ai/generate/ad-copy` | Generate ad copy |
| POST | `/api/ai/analyze/company` | Analyze a company from URL |
| POST | `/api/ai/chat/extract` | Extract lead data from chat |

### Prospecting

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/discovery` | Scout a niche for businesses with quality scoring |
| GET | `/api/prospects` | List prospects with filters (status, type, priority, niche, confidence) |
| POST | `/api/prospects` | Run prospect pipeline (scout > classify > ingest) |
| GET | `/api/prospects/:id` | Get prospect detail |
| PATCH | `/api/prospects/:id` | Update prospect status, notes, contact info |
| DELETE | `/api/prospects/:id` | Remove a prospect |
| POST | `/api/cron/discovery` | Automated multi-niche scouting (cron-triggered) |

### Experiments

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/experiments` | List experiments (filterable by status) |
| POST | `/api/experiments` | Create A/B experiment with variants and surface |
| GET | `/api/experiments/:id` | Get experiment with analysis |
| PATCH | `/api/experiments/:id` | Update experiment status, hypothesis, winner |
| POST | `/api/cron/experiments` | Evaluate all running experiments (autoresearch loop) |

### Competitors

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/competitors` | List tracked competitors |
| POST | `/api/competitors` | Add a competitor |
| GET | `/api/competitors/:id` | Get competitor detail |
| PATCH | `/api/competitors/:id` | Update competitor |
| DELETE | `/api/competitors/:id` | Remove competitor |
| POST | `/api/competitors/:id/analyze` | Analyze competitor website |
| POST | `/api/creative/ingest-competitor` | Ingest competitor design/marketing artifacts |

### GDPR & Preferences

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/gdpr/self-service` | Self-service data management page |
| GET | `/api/preferences` | Get user preferences |
| POST | `/api/preferences` | Update user preferences |

### Webhooks

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/webhooks` | List webhook endpoints |
| POST | `/api/webhooks` | Register a webhook |
| POST | `/api/webhooks/:id/test` | Test a webhook |
| DELETE | `/api/webhooks/:id` | Remove a webhook |

---

## 11. Integration Catalog

### Tier 1: Core Infrastructure (always active)

| Integration | Purpose | Required? |
|-------------|---------|-----------|
| PostgreSQL | Persistent storage | No (in-memory fallback) |
| Stripe | Billing and payments | No (billing disabled without) |
| Next.js | Web framework | Yes |

### Tier 2: Communication (enable per need)

| Integration | Purpose | Env Var |
|-------------|---------|---------|
| Sinosend | Email campaigns | `SINOSEND_API_KEY` |
| EasyText Marketing | SMS | `EASY_TEXT_API_KEY` |
| WBizTool | WhatsApp | `WBIZTOOL_API_KEY` |
| Thoughtly | AI voice agents | `THOUGHTLY_API_KEY` |
| EmailIt | Transactional email | `EMAILIT_API_KEY` |
| CallScaler | Call tracking | `CALLSCALER_API_KEY` |

### Tier 3: AI & Content

| Integration | Purpose | Env Var |
|-------------|---------|---------|
| OpenAI | GPT-4o content generation | `AI_API_KEY` + `AI_PROVIDER=openai` |
| Anthropic | Claude content generation | `AI_API_KEY` + `AI_PROVIDER=anthropic` |
| Firecrawl | Web scraping & enrichment | `FIRECRAWL_API_KEY` |
| Skyvern | Browser automation | `SKYVERN_API_KEY` |
| Pickaxe | AI chatbots | `PICKAXE_API_KEY` |
| Meiro | AI video avatars | `MEIRO_API_KEY` |
| Zebracat | Text-to-video | `ZEBRACAT_API_KEY` |

### Tier 4: CRM & Data

| Integration | Purpose | Env Var |
|-------------|---------|---------|
| SuiteDash | CRM & client portal | `SUITEDASH_API_KEY` |
| SalesNexus | CRM with automation | `SALESNEXUS_API_KEY` |
| AITable | Spreadsheet database | `AITABLE_API_KEY` |
| Boost.space | Data integration | `BOOST_SPACE_API_KEY` |

### Tier 5: Pages & Forms

| Integration | Purpose | Env Var |
|-------------|---------|---------|
| GrapesJS | Landing page builder | Built-in (no key needed) |
| Brizy | Page builder | `BRIZY_API_KEY` |
| Formbricks | Survey & form builder | `FORMBRICKS_API_KEY` |
| Claspo | Conversion widgets | `CLASPO_API_KEY` |

### Tier 6: Automation & Workflows

| Integration | Purpose | Env Var |
|-------------|---------|---------|
| Activepieces | Workflow automation | `ACTIVEPIECES_API_KEY` |
| n8n | Advanced workflows | `N8N_BASE_URL` + `N8N_API_KEY` |
| Flow Forge | Visual workflow builder | Built-in |

### Tier 7: Analytics & Tracking

| Integration | Purpose | Env Var |
|-------------|---------|---------|
| Umami | Privacy-first analytics | `UMAMI_API_KEY` |
| Plerdy | Heatmaps & session replay | `PLERDY_API_KEY` |
| Google Analytics | Web analytics | `GOOGLE_ANALYTICS_ID` |

### Tier 8: Deployment

| Integration | Purpose | Env Var |
|-------------|---------|---------|
| Vercel | Edge deployment | `VERCEL_TOKEN` |
| Cloudflare Pages | CDN deployment | `CLOUDFLARE_API_TOKEN` |
| GitHub | Source control & CI/CD | `GITHUB_TOKEN` |

All integrations operate in **dry-run mode** when their API key is not configured. The system generates realistic mock data so every feature works out of the box for demos and development.

---

## 12. Economic Analysis

### Cost to Replicate

Building Lead OS from scratch would require:

| Component | Market Cost | Lead OS |
|-----------|------------|---------|
| Lead capture SaaS (Typeform/Jotform) | $50-300/mo | Included |
| CRM (HubSpot/Salesforce) | $50-300/mo | Included |
| Email marketing (Mailchimp/ActiveCampaign) | $30-500/mo | Included |
| SMS marketing (Twilio/SimpleTexting) | $25-200/mo | Included |
| Landing page builder (Unbounce/Leadpages) | $50-200/mo | Included |
| A/B testing (VWO/Optimizely) | $50-500/mo | Included |
| Analytics (Mixpanel/Amplitude) | $25-200/mo | Included |
| Workflow automation (Zapier/Make) | $20-200/mo | Included |
| AI content (Jasper/Copy.ai) | $50-500/mo | Included |
| Social media management (Hootsuite/Buffer) | $50-200/mo | Included |
| Booking (Calendly/Acuity) | $10-50/mo | Included |
| Chat widget (Intercom/Drift) | $50-500/mo | Included |
| Lead scoring (Clearbit/MadKudu) | $100-1000/mo | Included |
| Webhook management | $20-100/mo | Included |
| Billing (Chargebee/Recurly) | $50-300/mo | Included |
| **Total per client** | **$630 - $4,550/mo** | **$0 marginal** |

### Unit Economics

**Managed Service Model (10 clients)**

| Line Item | Monthly |
|-----------|---------|
| Revenue (10 clients x $500 avg) | $5,000 |
| Infrastructure (Railway/Vercel) | -$50 |
| Database (managed Postgres) | -$25 |
| AI API usage | -$100 |
| Email/SMS provider costs | -$200 |
| **Net margin** | **$4,625 (92.5%)** |

**White-Label SaaS (100 seats)**

| Line Item | Monthly |
|-----------|---------|
| Revenue (100 seats x $249 avg) | $24,900 |
| Infrastructure | -$200 |
| Database | -$100 |
| AI API usage | -$500 |
| Communication providers | -$1,000 |
| Support (1 person) | -$3,000 |
| **Net margin** | **$20,100 (80.7%)** |

**Lead Marketplace (1,000 leads/mo)**

| Line Item | Monthly |
|-----------|---------|
| Revenue (1,000 leads x $75 avg) | $75,000 |
| Lead acquisition costs | -$15,000 |
| Infrastructure | -$100 |
| AI enrichment | -$500 |
| **Net margin** | **$59,400 (79.2%)** |

### Competitive Advantages

**1. Speed to Market**
Deploy a complete lead-gen platform for a new niche in under 5 minutes. The niche generator produces scoring weights, assessment questions, nurture sequences, and content templates automatically. Competitors require weeks of manual configuration.

**2. Vertical Depth**
13 industry templates with domain-specific psychology profiles, pain points, urgency signals, and conversion patterns. This isn't a generic form builder -- it understands that a plumber has different buying triggers than a lawyer.

**3. Multi-Revenue Optionality**
The same codebase supports four distinct business models. Start as a managed service, add a SaaS tier, open a marketplace -- all without code changes or redeployment.

**4. Data Moat**
Every lead interaction trains the scoring engine. The `data-moat.ts` module explicitly tracks proprietary data accumulation. After 6 months of operation, your scoring accuracy outperforms any generic tool because it's trained on YOUR niche-specific conversion data.

**5. Zero Marginal Cost per Niche**
Adding a new niche costs nothing. No new code, no new deployment, no new infrastructure. The niche generator handles everything. Your 50th niche costs the same to operate as your 1st.

**6. Integration Leverage**
110 pre-built integrations mean you never hit a "we don't integrate with that" wall. The adapter pattern with dry-run mode means every integration works immediately for demos and only requires an API key for production.

**7. White-Label Ready**
No Lead OS branding anywhere. Every client sees their own brand, their own domain, their own colors. The embed widget system means clients don't even need to change their existing website.

### Break-Even Analysis

| Model | Fixed Monthly Cost | Revenue per Client | Break-Even |
|-------|-------------------|-------------------|------------|
| Managed | $75 (infra) | $500 | 1 client |
| White-Label SaaS | $300 (infra + support) | $249 | 2 seats |
| Implementation | $75 (infra) | $3,000 | 1 client |
| Marketplace | $600 (infra + acquisition) | $75/lead | 8 leads |

In every model, break-even occurs within the first month with minimal client acquisition. The marginal cost of each additional client is near zero because the infrastructure is shared (multi-tenant) and the niche configuration is automated.

---

## 13. AppSumo Integration Roadmap

An audit of 247 AppSumo lifetime-deal products identified 31 Tier 1 tools and 57 Tier 2 tools that map directly to Lead OS modules. These represent expansion opportunities where a single API integration unlocks permanent, zero-marginal-cost capability.

### Lead OS Module Map

```
CAPTURE ──→ Lead capture, forms, popups, chatbots, widgets
ENRICH  ──→ Data enrichment, verification, company/contact intel
SCORE   ──→ Lead scoring, visitor tracking, behavioral analytics
ROUTE   ──→ Lead routing, CRM, pipeline management
NURTURE ──→ Email, SMS, multi-channel sequences, drip campaigns
CONVERT ──→ Sales outreach, personalized video, voice agents
CREATE  ──→ Creative asset generation (video, image, copy)
MONETIZE ─→ Billing, subscriptions, affiliate/referral, marketplace
ORCHESTRATE → Workflow automation, iPaaS, data sync
ANALYZE ──→ Attribution, analytics, reporting, tracking
```

### Tier 1: High-Impact Integrations (31 products)

#### P0 — Critical Path (integrate first)

| Product | Module | What It Replaces | Why It's P0 |
|---------|--------|-----------------|-------------|
| **Activepieces** | ORCHESTRATE | Zapier/Make.com | Backbone of Lead OS. Self-hostable workflow automation with 280+ connectors. No per-task limits. MCP support for AI-native orchestration |
| **Salespanel** | SCORE | Clearbit Reveal + Madkudu | Core scoring engine. Real-time client-side API for visitor identification, scoring, and page personalization |
| **Happierleads** | CAPTURE + ENRICH | RB2B/Clearbit | Turns anonymous traffic into named leads with emails. 180M contact database. Personal-level identification across 173+ countries |
| **Reoon Email Verifier** | ENRICH | ZeroBounce/NeverBounce | Every lead email must be verified before nurture sequences. Quick mode (<0.5s) enables real-time form validation |
| **Databar** | ENRICH | Clay/ZoomInfo | Central enrichment engine. Waterfall logic across 120+ data providers maximizes coverage. Webhook-triggered auto-enrichment |
| **Autobound** | CONVERT | 6sense + Copy.ai | AI SDR brain. Generates hyper-personalized outreach from 400+ real-time buyer signals across 29 sources |
| **Chargebee** | MONETIZE | Stripe Billing/Recurly | Monetization engine. Usage-based billing enables pay-per-lead pricing. Webhook events trigger lead delivery on payment |
| **Insighto.ai** | CAPTURE + CONVERT | Intercom/Drift + Aircall | Dual chat+voice AI agents. 24/7 lead qualification across chat and phone. White-label with rebilling |

#### P1 — High Value (integrate second)

| Product | Module | What It Replaces |
|---------|--------|-----------------|
| **Chatbase** | CAPTURE | Basic web chat widgets — AI-powered lead qualification with conditional capture |
| **Thoughtly** | CONVERT | Human SDR cold-calling — AI voice agents at $0.09/min, books meetings in <90s |
| **VBOUT** | NURTURE + SCORE | ActiveCampaign/HubSpot — native lead scoring + multi-channel nurture |
| **Emailit** | NURTURE | SendGrid/Mailgun — transactional email with webhook events for scoring feedback |
| **Clodura.AI** | ENRICH + CAPTURE | Apollo.io/Lusha — 600M+ contacts, form enrichment API, trigger data |
| **Partnero** | MONETIZE | PartnerStack/Rewardful — affiliate program management with full API |
| **Claspo** | CAPTURE | OptinMonster/Sumo — gamified popups (spin-wheel, scratch cards) with 3x opt-in rates |
| **Formaloo** | CAPTURE | Typeform/JotForm — multi-step smart forms with AI analytics |
| **SMS-iT CRM** | NURTURE + ROUTE | Twilio + HubSpot CRM — 30+ channel messaging, no A2P/10DLC required |
| **Markopolo.ai** | ANALYZE | TripleWhale/Hyros — server-side attribution recovering 25-45% more tracking accuracy |
| **Hexomatic** | CAPTURE + ENRICH | Phantombuster/Apify — no-code scraping with built-in AI enrichment workflows |
| **Boost.space** | ORCHESTRATE | Airtable + data warehouse — single source of truth with 2,600+ app sync |
| **Fliki** | CREATE | Synthesia/Loom — AI text-to-video with 2,000+ voices in 80+ languages |
| **Duply** | CREATE | Canva bulk creation — API-driven personalized image generation at scale |
| **Nexweave** | CONVERT | Vidyard/BombBomb — personalized video/image outreach via dynamic URLs |
| **RepliQ** | CONVERT | Loom/Vidyard — AI-personalized video prospecting with website screenshot integration |
| **AgenticFlow** | ORCHESTRATE | CrewAI/AutoGen — visual AI agent builder with 100+ tools, MCP client support |
| **Brilliant Directories** | CAPTURE + MONETIZE | Directory theme + membership plugin — turnkey directory business |
| **CallScaler** | ANALYZE + CAPTURE | CallRail/CallTrackingMetrics — call tracking with dynamic number insertion |

#### P2 — Supplementary

| Product | Module | Rationale |
|---------|--------|-----------|
| **LeadRocks** | ENRICH | Backup contact database for prospecting |
| **KonnectzIT** | ORCHESTRATE | Secondary iPaaS, visual builder for non-technical users |
| **Switchboard Canvas** | CREATE | API-first image automation with auto-translation in 70+ languages |
| **SuiteDash** | ROUTE + MONETIZE | All-in-one CRM with white-label client portal |

### Tier 2: Valuable Additions (57 products)

Tier 2 products fill niche gaps or provide redundancy. Key categories:

| Category | Count | Notable Products |
|----------|-------|-----------------|
| Automation/iPaaS | 4 | Albato, PROCESIO, Robomotion RPA, TaskMagic |
| CRM/Pipeline | 3 | Flowlu, SalesNexus, Consolto |
| Email Marketing | 5 | tinyEmail, Acumbamail, EmailDelivery.com, SendFox, Easy Text |
| Analytics/Tracking | 3 | Plerdy, TruConversion, Adscook |
| Creative/Video | 4 | Quickads, Storykit, Vidu, ContentBot |
| Community/Engagement | 2 | Heartbeat, Novocall |
| WhatsApp/Messaging | 1 | WBizTool |

### Integration Priority Matrix

```
                    HIGH IMPACT
                        │
         P0 ────────────┤──────────── P1
    (8 products)        │        (19 products)
    Critical path       │        High value
    Integrate now       │        Integrate next
                        │
   ─────────────────────┼───────────────────────
                        │
         P2 ────────────┤──────────── Tier 2
    (4 products)        │        (57 products)
    Supplementary       │        Nice-to-have
    As needed           │        Evaluate quarterly
                        │
                    LOW IMPACT
```

### Implementation Approach

Each AppSumo integration follows the established adapter pattern:

1. **Create adapter** in `src/lib/integrations/<product>-adapter.ts` extending `adapter-base.ts`
2. **Add env var** for API key (e.g., `SALESPANEL_API_KEY`)
3. **Dry-run mode** — adapter returns realistic mock data when no API key is configured
4. **Add API routes** for adapter operations under `/api/integrations/<product>/`
5. **Register provider** in `providers.ts` with health check
6. **Add dashboard config** in Credentials page for operator API key entry
7. **Wire automation** — connect to Activepieces/n8n for workflow triggers

Estimated effort per adapter: 200-400 lines, following the pattern established by the existing 62 adapters.

---

## Summary

Lead OS is a 210,000+-line, 1,100+-file production platform that unifies lead generation, scoring, nurturing, AI content creation, automated prospecting, A/B experiment optimization, competitive analysis, billing, and marketplace operations into a single deployable runtime. It includes Erie-Pro, a 702-page geographic monopoly engine spanning 46 niches. It serves any industry through automated niche configuration, supports four simultaneous revenue models, integrates with 137 external services, and reaches break-even with a single client.

Key additions since initial release:
- **Automated Prospecting Engine**: Discovery scout finds businesses, scores digital presence gaps, classifies opportunities (managed-service, white-label, affiliate, partner), generates personalized outreach, and auto-ingests into the lead pipeline
- **Autoresearch Experiment Engine**: Z-test evaluation of running A/B tests with early stopping, auto-rollback, and auto-promotion across 5 optimization surfaces
- **Competitive Analysis Pipeline**: Scrape competitor websites, extract design tokens and funnel patterns, process marketing artifacts into actionable intelligence
- **Erie-Pro Geographic Monopoly Engine**: 702 pages across 46 niches with city hub pages, niche landing pages, and provider profile pages for local market domination
- **Enhanced Dashboard**: 29 pages including prospects, competitors, marketing ingestion, leads, and expanded credentials with verification

The system is deployed, tested (4,187 passing test cases, 0 TypeScript errors), security-audited, and performance-optimized. It is live at https://github.com/pinohu/lead-os and can be deployed to Vercel, Railway, or any Node.js host in under 10 minutes.
