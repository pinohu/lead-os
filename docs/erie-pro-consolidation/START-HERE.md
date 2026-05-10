# Erie.Pro / LeadOS Consolidated Thread Context

Date consolidated: 2026-05-10

This file makes the current Codex thread the working source of truth for Erie.Pro, LeadOS, and ConvertBox planning. Prior Codex chats and scattered workspaces should be treated as historical context only. Continue decisions, planning, audits, and implementation from this thread and the files in this workspace.

## Canonical Working Location

Current thread workspace:

`C:\Users\VRLab\Documents\Codex\2026-05-09\will-you-be-able-to-login`

Key consolidated files in this workspace:

- `START-HERE-ERIE-PRO-LEADOS-CONSOLIDATED.md`
- `ERIE-PRO-DEPLOYMENT-SOURCE-AUDIT.md`
- `ERIE-PRO-LIVE-SERVICE-INVENTORY.md`
- `ERIE-PRO-CONVERTBOX-EXPERIENCE-PLAN.md`
- `ERIE-PRO-SERVICE-CONVERTBOX-BLUEPRINTS.md`
- `CONVERTBOX-LEAD-OS-CONFIGURATION-BLUEPRINT.md`
- `TOP-REPO-PRIORITIES.md`
- `consolidated-erie-pro/source-snapshots/additional-niches.ts`
- `consolidated-erie-pro/source-snapshots/niches.ts`
- `consolidated-erie-pro/source-snapshots/seo-page-plans.json`
- `consolidated-erie-pro/seo/erie-pro-seo-article-keyword-cluster-links.csv`
- `consolidated-erie-pro/seo/erie-pro-seo-article-keyword-cluster-links.md`
- `consolidated-erie-pro/seo/README.md`

## Deployment Truth

Live production site:

`https://erie.pro`

Live production facts recovered from Vercel:

- Vercel project: `erie-pro`
- Vercel project id: `prj_ZrLsCE8EKeas6mpWaUSWPgFdcatp`
- Production deployment: `dpl_44WuD1jsKAwSdrcdsDWJEPfRsP8K`
- Production deployment URL: `erie-aa40ldfz7-polycarpohu-gmailcoms-projects.vercel.app`
- Production aliases: `erie.pro`, `www.erie.pro`, `erie-pro.vercel.app`
- Git repo: `pinohu/lead-os`
- Root directory: `erie-pro`
- Production branch: `master`
- Commit recorded by Vercel: `a667033749b6327430d3ce024753494c1650c53e`
- Commit message: `Add deliverable process flowcharts`
- Deployment source: `cli`
- Vercel metadata includes `gitDirty: 1`

Interpretation:

Production was deployed from `pinohu/lead-os` at commit `a6670337`, but the build included uncommitted local changes. Clean `origin/master` alone does not reproduce the live 112-service site.

## Recovered Source Truth

The dirty local worktree matching the production source was found at:

`C:\Users\VRLab\Documents\Codex\2026-05-05\deeply-consider-this-thesis-and-it-2`

Important recovered source facts:

- `erie-pro/src/lib/additional-niches.ts` contains 68 additional service categories.
- The dirty `erie-pro/src/lib/niches.ts` imports `additionalNiches`.
- The dirty `niches.ts` exports `niches` as `44 base services + 68 additional services`.
- That matches the live site's 112 services.
- The live site sitemap exposes 3,505 public URLs.
- The live `/services` page confirms 112 service groups.
- SEO artifacts list 672 canonical SEO article URLs.

Consolidated snapshots copied into this workspace:

- `consolidated-erie-pro/source-snapshots/additional-niches.ts`
- `consolidated-erie-pro/source-snapshots/niches.ts`
- `consolidated-erie-pro/source-snapshots/seo-page-plans.json`
- `consolidated-erie-pro/seo/erie-pro-seo-article-keyword-cluster-links.csv`
- `consolidated-erie-pro/seo/erie-pro-seo-article-keyword-cluster-links.md`

Do not rely on the clean `lead-os/erie-pro/src/lib/niches.ts` in this current workspace unless it has been updated from the recovered dirty source. The clean repo copy still reflects the older 44-service catalog.

## Service Truth

Erie.Pro currently has 112 live service categories.

The authoritative service list for planning is:

`ERIE-PRO-LIVE-SERVICE-INVENTORY.md`

The code-level source of the additional 68 services is:

`consolidated-erie-pro/source-snapshots/additional-niches.ts`

The live services are not merely dropdown options. Most have complete route clusters:

- Main service page.
- Blog.
- Guides.
- FAQ.
- Pricing.
- Costs.
- Compare.
- Emergency.
- Glossary.
- Seasonal.
- Checklist.
- Directory.
- Reviews.
- Tips.
- Certifications.
- Provider pages where provider inventory exists.

## ConvertBox Direction

Use ConvertBox as a polite concierge overlay, not a noisy popup layer.

Current guiding principle:

ConvertBox should reduce friction, speed up service requests, personalize the visitor journey, and rescue high-intent abandoners without overwhelming users.

Core flow families:

- Emergency callback.
- Fast quote.
- Diagnostic triage.
- Cost confidence.
- Appointment request.
- Project planning.
- Checklist capture.
- Provider claim.

Planning documents:

- `ERIE-PRO-CONVERTBOX-EXPERIENCE-PLAN.md`
- `ERIE-PRO-SERVICE-CONVERTBOX-BLUEPRINTS.md`
- `CONVERTBOX-LEAD-OS-CONFIGURATION-BLUEPRINT.md`

Build-ready ConvertBox implementation documents:

- `convertbox-implementation/IMPLEMENTATION-PACK.md`
- `convertbox-implementation/CAMPAIGN-BUILD-SHEET.csv`
- `convertbox-implementation/SERVICE-FAMILY-MAP.csv`
- `convertbox-implementation/WEBHOOK-PAYLOAD-SPEC.md`
- `convertbox-implementation/LAUNCH-CHECKLIST.md`

Important correction:

Earlier 44-service ConvertBox thinking is incomplete. All Erie.Pro ConvertBox planning must assume 112 service groups and hundreds of subservice intents.

## Access / Credentials Status

The attached `.env` file at `C:\Users\VRLab\Projects\.env` was inspected for connection-related keys only. Secret values were not copied into this workspace.

Useful access confirmed:

- Vercel token works.
- Vercel team id found: `team_fuTLGjBMk3NAD32Bm5hA7wkr`.
- Vercel project/deployment metadata for Erie.Pro is accessible.
- One GitHub token works: `GITHUB_TOKEN_FOR_DOCKER_DESKTOP`.

Do not print credential values in chat or docs.

## Current Problem To Resolve

There is still a source-control hygiene problem:

Production contains uncommitted Erie.Pro changes from a dirty local worktree. The clean GitHub `master` branch does not fully represent production.

The permanent fix is:

1. Review the recovered dirty Erie.Pro source.
2. Copy/merge the production-relevant changes into the canonical `lead-os` working tree.
3. Run checks/build.
4. Commit the recovered production source.
5. Push to GitHub.
6. Redeploy Erie.Pro from the clean pushed commit.
7. Confirm Vercel production no longer depends on `gitDirty: 1`.

## Priority Scope

Do not spread across every repo. Priority order remains:

1. Erie.Pro.
2. LeadOS where it supports Erie.Pro.
3. PA CROP Services.
4. Dynasty Launcher.
5. Other top repos only after Erie.Pro is stabilized.

## Next Recommended Work

The next best step in this thread is to make Erie.Pro source clean and reproducible:

1. Compare the recovered May 5 dirty worktree against the clean current `lead-os`.
2. Identify Erie.Pro production changes that are required for the 112-service live site.
3. Create a focused commit plan.
4. Bring the current working repo up to date with production.
5. Then continue ConvertBox configuration planning from the reconciled service/source truth.

## Working Rule Going Forward

For Erie.Pro and LeadOS, use this hierarchy:

1. Live production behavior.
2. Vercel deployment metadata.
3. Recovered dirty source snapshots copied into this workspace.
4. The recovered May 5 dirty worktree.
5. Clean GitHub refs only after they are reconciled.

This thread should be treated as the new continuity layer.
