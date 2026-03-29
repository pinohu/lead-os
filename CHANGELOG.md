# Changelog

All notable changes to Lead OS are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
- 6 new transactional email templates (subscription confirmed, plan changed, provisioning complete, trial expiring, usage warning, payment failed)
- Contact form API endpoint with Zod validation

### Changed
- All API routes now require authentication by default
- Credential vault rejects missing encryption key in production
- CORS defaults to same-origin when `ALLOWED_ORIGINS` is not set
- Cross-platform test scripts (replaced Windows-only `set` syntax with `cross-env`)
- Layout metadata updated with professional titles and descriptions
- Footer now includes links to legal, help, and roadmap pages
- `package.json` now includes `engines`, `repository`, `license`, `homepage`, `bugs` fields

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
