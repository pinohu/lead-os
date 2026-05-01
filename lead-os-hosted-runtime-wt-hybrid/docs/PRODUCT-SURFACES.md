# Product surfaces — what exists on this deployment

This file maps **public URLs** in `lead-os-hosted-runtime-wt-hybrid` to **intent** so operators and founders do not confuse marketing depth with “every route is a separate product.”

**Machine check:** from this package run `npm run verify:product-surfaces` (see [`CLAIMS-VERIFICATION.md`](./CLAIMS-VERIFICATION.md) for what that does and does not cover).

**First-time setup (entire monorepo):** start at [`docs/START-HERE.md`](../../docs/START-HERE.md) from the repository root (same folder that contains `lead-os-hosted-runtime-wt-hybrid/`).

## Public marketing & conversion

| Path | Intent |
|------|--------|
| `/` | Universal entry: positioning, paths by role, CTAs to `/onboard`, `/demo`, `/pricing`. |
| `/pricing` | SaaS-style plans; CTA to `/onboard?plan=…`. |
| `/onboard` | Self-serve wizard; calls `/api/onboarding`. |
| `/setup` | First-run setup wizard (also linked from root README access table). |
| `/preferences` | Operator/user preference surface when enabled. |
| `/manage-data` | Data subject export / deletion requests (see also `/privacy/manage` when linked from policies). |
| `/demo` | Narrated tour of capabilities. |
| `/calculator` | ROI / savings style calculator. |
| `/contact`, `/help`, `/changelog`, `/roadmap` | Support and trust content. |
| `/privacy/manage` | Consent / preference center when linked from privacy policy. |
| `/industries`, `/industries/[slug]` | Vertical pages; `[slug]` must exist in `nicheCatalog`. |
| `/for/[persona]` | Role-based landings; keys in `PERSONA_BLUEPRINTS` (`agencies`, `saas-founders`, `lead-gen`, `consultants`, `franchises`). |
| `/offers`, `/offers/[slug]` | Offer paths; `[slug]` from `nicheCatalog`. |
| `/lp/[slug]` | Generated landing pages from `listLandingPages()` (published only). |
| `/marketplace` | Lead marketplace UI; may show **demo** leads if API/DB unavailable (see on-page banner). |
| `/directory`, `/directory/[vertical]` | Directory marketing. |
| `/funnel/[family]` | Funnel family explorer; `family` must exist in default funnel graphs. |
| `/embed/[niche]` | Embed surface. |
| `/p/[tenantSlug]/[pageSlug]` | Tenant-scoped pages when configured. |
| `/assess/[slug]` | Dynamic assessment flows. |
| `/resources/[slug]` | Resource/download pages when catalogued. |
| `/sites/[deploymentId]` | Published site / deployment status views when configured. |
| `/auth/sign-in`, `/auth/check-email` | Operator magic-link flow. |

## Documentation hub (in-app)

| Path | Intent |
|------|--------|
| `/docs` | Index: API spec, SLA source, operator links, and website-rendered repo docs. |
| `/docs/api` | Machine-readable API: OpenAPI JSON + human links. |
| `/docs/sla` | Summary + link to full website-rendered `docs/SLA.md`. |
| `/docs/[slug]` | Website-rendered Markdown for exposed docs such as START-HERE, deployment, runbook, product surfaces, claims verification, and security docs. |
| `/docs/source/[...path]` | Read-only in-site source reference for whitelisted public-repo files under `src/`, `db/`, and `docs/`. |

## Operator-only (not public offers)

| Path prefix | Intent |
|-------------|--------|
| `/dashboard/*` | Authenticated operator console. |
| `/api/*` (except health/docs where public) | Programmatic contracts; many require auth or secrets. |

## Website-exposed repo docs

Core files under `docs/*.md` are exposed as website pages through `/docs/[slug]` so customer-facing buttons do not need to send visitors to GitHub. The Markdown files remain the source of truth, but the public reading experience lives on the website.

## Cohesion rules

1. **Navigation** must only link to `[slug]` values generated from `nicheCatalog` or documented persona keys.  
2. **Claims** on the marketing site should align with `docs/SLA.md` and deployment reality (DB, workers, keys).  
3. **Demo data** must always be labeled on `/marketplace` when active.

## Example hostnames in the repository

Some Markdown and Kubernetes samples still use **`leadgen-os.com`** (status URL, support portal, example ingress hosts). Those are **illustrative defaults** for a generic deployment — they are not a promise that those DNS names exist for your fork. Production values should always come from **`NEXT_PUBLIC_SITE_URL`**, **`NEXT_PUBLIC_SUPPORT_EMAIL`**, and your real status/help URLs. The in-app marketing pages prefer **`tenantConfig`** / `NEXT_PUBLIC_*` fallbacks (`cxreact.com` in local templates) over hardcoded production domains.
