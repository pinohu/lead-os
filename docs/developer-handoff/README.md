# Developer Handoff — Erie.Pro and County Replication

This folder is the **comprehensive handoff** for any developer (or future Claude session) picking up this codebase. It captures every detail of the pre-launch audit work, the county-replication playbook, the explicit list of manual steps the human operator must do, the current gaps, and the SuiteDash PDF release that runs on the same revenue infrastructure.

> **Why this exists.** Erie.pro is the prototype county deployment of `lead-os`. Once Erie ships its first paying customer and the playbook is validated, the system will be replicated across every county in the United States (~3,143 counties). The architecture is built for that. This handoff captures every detail required to make replication operationally trivial.

---

## Document map

Read in the order below if you are new to the codebase. Skip ahead by section if you already know the system.

| # | File | Audience | What it covers |
|---|------|---------|----------------|
| 0 | This README | Everyone | Navigation, file ownership, conventions |
| 1 | `01-AUDIT-WORK-COMPLETED.md` | New developers, code reviewers | Full record of the May 15, 2026 pre-launch audit. PRs #38, #39, #40. Every file touched, every behavior change, why each change was needed. |
| 2 | `02-COUNTY-REPLICATION-PLAYBOOK.md` | Operations, new-county launchers | Step-by-step to clone Erie.pro for a new county. 12 phases. References to all relevant code surfaces. |
| 3 | `03-MANUAL-STEPS-REQUIRED.md` | Human operator (Ike) | Explicit checklist of every manual action required to launch a county. Pre-launch (one-time), per-county (every clone), and per-product (PDF launch). |
| 4 | `04-CURRENT-GAPS-AND-FUTURE-WORK.md` | Roadmap planners | What is incomplete in Erie.pro, prioritized. What blocks first revenue vs. what is post-launch polish. |
| 5 | `05-SUITEDASH-PDF-RELEASE.md` | PDF launch operator | The $47 SuiteDash PDF release plan. ThriveCart + ConvertBox + sales page. Cross-references to the assets in `pinohu/SuiteDash` v1.0 release folder. |

---

## Conventions used in these docs

- **Production sha** at the time of writing: `76d267ed` (after PR #40 merge, May 15, 2026).
- **Code references** use the format `path/to/file.ts:LINE` or `path/to/file.ts:SYMBOL` so you can grep directly.
- **Manual steps** are formatted as numbered checklists with explicit prerequisites and verification commands.
- **External dashboard work** (ThriveCart, ConvertBox, Boost.space, SuiteDash, ProductDyno) is documented per service in `docs/external-setup/` with package JSON files; these handoff docs reference but do not duplicate that material.
- **Replication scope** — "county replication" means cloning the running Erie.pro deployment to another US county. It does not mean cloning the codebase to a different vertical (e.g. legal directory, real estate). Vertical replication is a separate problem and is out of scope.

---

## Repo layout (orientation)

This is a monorepo. Erie.pro lives in the `erie-pro/` directory. The hosted kernel for the broader `lead-os` platform lives at `lead-os-hosted-runtime-wt-hybrid/`. The handoff focuses on `erie-pro/` since that is the territory app being replicated.

```
lead-os/
├── erie-pro/                                # Per-county Next.js app (THIS is what gets cloned)
│   ├── src/
│   │   ├── app/                             # Next.js 15 App Router routes
│   │   │   ├── api/                         # 146 API endpoints
│   │   │   ├── [niche]/                     # 114 niche landing pages
│   │   │   └── ...
│   │   ├── lib/
│   │   │   ├── city-config.ts               # CITY_SLUG → CityConfig
│   │   │   ├── city-registry.ts             # All registered cities (Erie + 4 planned)
│   │   │   ├── city-factory.ts              # City templates for new deployments
│   │   │   ├── niche-category-map.ts        # Niche → Google Places category mapping (PR #40)
│   │   │   └── ...
│   │   ├── scripts/                         # CLI scripts (scrape, audit, seed, etc.)
│   │   └── components/                      # React components
│   ├── prisma/                              # Database schema + migrations
│   └── package.json
├── lead-os-hosted-runtime-wt-hybrid/        # Kernel (billing, marketplace, magic-link auth)
├── docs/                                    # Documentation root
│   ├── developer-handoff/                   # THIS FOLDER
│   ├── external-setup/                      # ThriveCart, ConvertBox, etc. config packages
│   ├── qa/                                  # QA result JSON files
│   ├── LAUNCH_ORDER.md                      # D-H sequenced runbook (PR #39)
│   ├── STATUS.md                            # Living status; updated each audit
│   ├── START-HERE.md                        # Top-level entry point for new developers
│   └── ...
└── ...
```

---

## Production infrastructure summary

| Component | Provider | Identifier / location |
|-----------|----------|------------------------|
| Next.js application | Vercel | Project `prj_ZrLsCE8EKeas6mpWaUSWPgFdcatp` in team `team_fuTLGjBMk3NAD32Bm5hA7wkr`. Production target: `https://erie.pro`. |
| Database | Neon Postgres | Pooler `ep-broad-grass-anm3zcv9-pooler` (shared cluster across multiple operating businesses in the portfolio). Erie.pro DB is one logical database in this cluster. |
| Cron jobs | Vercel Cron | 8 scheduled jobs. See `01-AUDIT-WORK-COMPLETED.md` §C for the full list. Auth via `CRON_SECRET` env var. |
| Source control | GitHub | `github.com/pinohu/lead-os`. Master is the production branch; merges auto-deploy to Vercel. |
| Domain registrar | Whatever Ike uses | `erie.pro` apex + `www.erie.pro` |
| Email transactional | Resend (preferred) / AWS SES (fallback) | Configured via env var `RESEND_API_KEY` |
| Payment | ThriveCart | Cart subdomain TBD; webhook to `/api/webhooks/thrivecart` |
| Lead capture | ConvertBox | Boxes configured per `docs/external-setup/convertbox/placement-matrix.json` |
| Operational sync | SuiteDash | Configured per `docs/external-setup/suitedash/operational-sync-package.json` |
| Workflow orchestration | Boost.space | Scenarios configured per `docs/external-setup/boostspace/revenue-action-scenarios.json` |
| Fulfillment delivery | ProductDyno | Configured per `docs/external-setup/offer-fulfillment/fulfillment-channel-map.json` |
| Place data source | Outscraper (Google Places via paid API) | API key in `OUTSCRAPER_API_KEY` env var |
| AI services | Anthropic Claude | API key in `ANTHROPIC_API_KEY` env var; used for document classification and lead matching |

---

## Critical credentials and secret locations

These exist in the user (Ike's) password manager and in the Vercel project env vars. They are NOT in the repo. They are listed here so a developer knows what to look for.

| Secret | Where it lives | Purpose |
|--------|---------------|---------|
| `DATABASE_URL` | Vercel env (production), `.env.local` (dev) | Pooled Neon connection string |
| `DATABASE_URL_UNPOOLED` | Same | Direct (non-pooled) connection for migrations and long-running scripts |
| `DIRECT_URL` | Same | Prisma direct URL for migrations |
| `THRIVECART_API_KEY` | Vercel env | ThriveCart REST API auth |
| `THRIVECART_WEBHOOK_TOKEN` | Vercel env | Verifies inbound webhooks |
| `CONVERTBOX_API_KEY` | Vercel env | ConvertBox events API |
| `BOOSTSPACE_TOKEN` | Vercel env | Boost.space scenario webhook auth |
| `SUITEDASH_PUBLIC_ID` + `SUITEDASH_SECRET_ID` | Vercel env | SuiteDash API auth pair |
| `PRODUCTDYNO_API_KEY` | Vercel env | ProductDyno fulfillment API |
| `OUTSCRAPER_API_KEY` | Vercel env | Google Places scraping |
| `ANTHROPIC_API_KEY` | Vercel env | Claude API for classification/matching |
| `RESEND_API_KEY` | Vercel env | Transactional email |
| `CRON_SECRET` | Vercel env (production target) | Authorizes Vercel cron invocations. Provisioned May 15, 2026. Length 64. |
| `LEAD_OS_AUTH_SECRET` | Vercel env | Magic-link signing for operator dashboard |
| `LEAD_OS_OPERATOR_EMAILS` | Vercel env | CSV list of emails permitted to log into `/dashboard` |

---

## How to safely work on this codebase

1. **Always branch off `master`.** Master is the production branch; merges to it auto-deploy to Vercel. PR-and-review is the only way to land changes.
2. **Run `npm test` + `npx tsc --noEmit` in `erie-pro/` before pushing.** CI runs both; saves a CI cycle.
3. **Never commit `.env.local`, `.vercel/`, or anything in `/tmp/`.** Both are gitignored, but verify with `git status` before committing.
4. **Database migrations.** `npx prisma migrate dev` for dev. For production, the standard path is `npx prisma migrate deploy` — but Neon's pooler does not allow long-running connections, so migrations are applied via the unpooled `DATABASE_URL_UNPOOLED` URL or via the `@neondatabase/serverless` HTTPS driver. See `01-AUDIT-WORK-COMPLETED.md` for an example.
5. **Production debugging.** Sentry is wired (see `instrumentation-client.ts`). Vercel logs are at `vercel.com/team/.../erie-pro/logs`. Direct Neon DB queries via `psql` to `DATABASE_URL_UNPOOLED` for ad-hoc inspection.

---

## Questions a new developer typically asks (and where to find the answer)

| Question | Answer location |
|----------|-----------------|
| "What does this app do?" | `docs/START-HERE.md` and `docs/LEAD_OPERATING_SYSTEM_ARCHITECTURE.md` |
| "What changed recently?" | `01-AUDIT-WORK-COMPLETED.md` (this folder) |
| "How do I run it locally?" | `docs/SETUP_GUIDE.md` |
| "How do I deploy?" | Auto-deploys from master via Vercel. See `docs/GITHUB_VERCEL_AUTOMATION.md`. |
| "What APIs are exposed?" | `docs/API_REFERENCE.md` (1,530 lines) |
| "How do I roll back a deploy?" | `docs/ROLLBACK.md` |
| "How do I add a new city?" | `02-COUNTY-REPLICATION-PLAYBOOK.md` (this folder) |
| "What is the operator supposed to do that the code can't?" | `03-MANUAL-STEPS-REQUIRED.md` (this folder) |
| "What's broken or incomplete?" | `04-CURRENT-GAPS-AND-FUTURE-WORK.md` (this folder) |
| "Where are the cron jobs configured?" | `erie-pro/vercel.json` and the routes under `src/app/api/cron/` |
| "How do I add a new niche?" | The 114 niches are defined in `src/lib/niche-data.ts` (search for `niches` array). Add an entry there + a row in `niches` table via seed. Service pages auto-generate from the registry. |

---

## Version history of this handoff

| Version | Date | Author | Notes |
|---------|------|--------|-------|
| 1.0 | 2026-05-15 | Claude (autonomous session) | Initial handoff after PR #40 merge. Master sha 76d267ed. |

Future revisions should update this table.
