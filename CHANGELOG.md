# Changelog

All notable changes to Lead OS are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-03-31

### Added — Platform (Hybrid Runtime)
- Niche catalog expanded from 4 to 16 industries with full config
- 84 persona templates (14 niches × 6 types) with backstory, voice, expertise
- 22 client presets for one-env-var tenant bootstrap
- Customer Intelligence Engine with 13 deep buyer research profiles
- Dynamic intelligence generator for any niche keyword (with optional AI enrichment)
- Intelligence-driven nurture sequences (91 emails: 13 niches × 7 stages)
- Joy Layer: autonomous recovery, morning briefings, milestone celebrations, time-saved tracking
- Proactive alerts with 3:1 positive-to-negative ratio
- 42 niche-specific testimonials rendered on industry pages
- 14 per-vertical ROI calculator presets wired to UI

### Added — Enterprise Security
- 2FA/TOTP (pure Node.js crypto, no npm dependencies)
- SAML 2.0 + OIDC SSO (Okta, Azure AD, Google Workspace)
- IP allowlisting (IPv4 + CIDR subnet matching)
- Middleware signature to prevent header spoofing
- Persistent audit trail (PostgreSQL write-through)
- SOC 2 compliance module (access review, encryption, sessions, retention reports)
- OpenAPI 3.1 specification at /api/docs/openapi.json
- API versioning (x-api-version: 2026-03-30, Stripe-style date-based)
- Deep health checks (/api/health/deep: DB, Redis, memory)
- Public status endpoint (/api/status: 30d/90d uptime)
- Request tracing (ring buffer, p95 latency, error rate, top paths)
- Sentry error monitoring (zero-dependency envelope API)
- PersistentStore<T> for in-memory → Postgres write-through
- Incident response runbook (P1-P4)
- SOC 2 controls mapping (CC6.1-CC9.1)
- SLA document (99.9% uptime commitment)

### Added — Infrastructure
- Kubernetes Helm chart with HPA (2-10 pods), rolling updates, security contexts
- Blue-green deployment script with auto-rollback
- Status page integrations (Betteruptime, Instatus)
- Tenant-aware rate limiting (per-minute + per-hour, per-endpoint overrides)

### Added — Pages & Content
- 17 industry landing pages + directory index (/industries)
- 5 buyer persona pages (/for/agencies, /for/saas-founders, etc.)
- 16 authority content hub pages (/resources/[slug])
- 17 directory pages per vertical (/directory/[vertical])
- 16 embeddable widget pages (/embed/[niche])
- Dynamic OG image generation (/api/og)
- Schema.org on 10 page types (Service, FAQPage, LocalBusiness, etc.)
- 13 niche-scoped CSS design token overrides
- 84-URL programmatic sitemap

### Added — Testing
- Multi-tenant stress test (50 tenants, 10 isolation tests)
- E2E pipeline smoke test (8 stages)
- Customer intelligence tests (9 cases)
- Intelligence-driven nurture tests (11 cases)
- Catalog expansion tests (140 cases)
- Total: 4,151 tests, 0 failures

### Added — Documentation
- Valuation & Pricing Guide with market data
- System diagrams (6 Mermaid diagrams)
- Master config spreadsheet (10 tabs, 3,186 cells)

### Changed
- Homepage rewritten for agency persona (operator-focused)
- Experience engine uses Customer Intelligence for hero copy, trust promise
- CI workflow upgraded to Node 22 with edge layer build
- Test runner flag fixed (--experimental-test-isolation)

### Fixed
- Web-scraper test accepts both dry-run and fetch-fallback
- Groove affiliate route params migration for Next.js 16
- Redirect allowlist security warning in production
- Auth middleware signature verification

## [1.2.0] - 2026-03-31

### Added — erie.pro (Geographic Territory Platform)
- 198-page authority site for Erie, PA
- 24 high-demand niche verticals ($350-$1,500/mo)
- 52 shadcn/ui components (full library)
- 16 page types per niche (blog, guides, FAQ, pricing, costs, compare, emergency, glossary, seasonal, checklist, directory, reviews, tips, certifications)
- Lead routing engine with SLA timers and failover (primary → 90s → backup → overflow)
- Provider performance scoring (40% SLA + 30% conversion + 30% satisfaction)
- 3-tier premium system (Standard 1x, Premium 1.5x, Elite 2.5x)
- Automatic perk toggle (activate/deactivate/transfer on subscription change)
- Deep local SEO (15 neighborhoods, 11 zip codes, climate data, PA regulations)
- Wildcard subdomain middleware (plumbing.erie.pro → /plumbing)
- Programmatic internal linking (1,200+ cross-niche connections)
- Provider claim form + Stripe checkout (dry-run)
- Local admin dashboard (7 sections)
- National authority connection (24 sites)
- City replication factory (7 city templates)
- Notification system (email + SMS, dry-run)
- Call tracking system (mock + CallScaler path)

## [1.1.0] - 2026-03-28

### Added
- Privacy Policy and Terms of Service pages
- Standalone pricing page with 4 tiers (Starter, Growth, Professional, Enterprise)
- Help Center with searchable FAQ (25 questions across 5 categories)
- Public changelog and roadmap pages
- Demo page showcasing platform capabilities
- Contact page with form submission
- Content Security Policy headers on all responses
- Rate limiting on authentication endpoints (10 req/min per IP)
- CORS hardening (no wildcard in production, same-origin default)
- Authentication middleware on all API routes (public routes explicitly allowlisted)
- Error and loading boundaries for all route segments
- Structured JSON logging for production environments
- LRU cache with TTL for all in-memory stores (prevents memory leaks)
- Database migration runner with transaction safety
- Connection timeouts and pool configuration (5s statement timeout, 20 max connections)
- Transaction helper (`withTransaction`) for multi-step writes
- `sitemap.xml` and `robots.txt` via Next.js metadata API
- Open Graph and Twitter Card metadata on all pages
- Favicon (SVG), `manifest.json`, PWA support
- GitHub Actions CI pipeline (typecheck, test, build)
- `.dockerignore` for optimized container builds
- `CONTRIBUTING.md` with development guidelines
- Pull request and issue templates
- Rollback strategy documentation
- Backup strategy documentation
- Testing strategy documentation
- 6 new transactional email templates
- Contact form API endpoint with Zod validation

### Changed
- All API routes now require authentication by default
- Credential vault rejects missing encryption key in production
- CORS defaults to same-origin when `ALLOWED_ORIGINS` is not set
- Cross-platform test scripts (replaced Windows-only `set` syntax with `cross-env`)

### Fixed
- Open redirect vulnerability in click tracking endpoint
- Unbounded in-memory Maps replaced with LRU caches
- Database queries now have statement timeouts (5s default)

## [1.0.0] - 2026-03-15

### Added
- 278 API endpoints across intake, scoring, nurturing, marketplace, billing, and operators
- 23-page operator dashboard with KPIs, analytics, and management tools
- 110+ provider integrations with dry-run mode when API keys are absent
- Multi-tenant infrastructure with tenant isolation and automated provisioning
- Four-dimensional lead scoring (intent, fit, engagement, urgency)
- AI-powered content generation with social asset engine
- Multi-agent AI orchestration system with 4 pre-built teams
- 78 funnel node types across 8 families
- Lead marketplace with dynamic pricing by temperature
- Stripe billing with 8 pricing plans across 4 revenue models
- Multi-channel nurturing (email, SMS, WhatsApp, voice, chat)
- A/B experiment engine with statistical significance detection
- Self-service onboarding wizard (6-step)
- 13 industry niche templates with auto-configuration
- 100 lead magnets in the content library
- Embeddable widgets (script tag, iframe, React component, WordPress plugin)
- GDPR compliance tools (export, deletion, consent management)
- 3,964 test cases with in-memory storage and dry-run mode
