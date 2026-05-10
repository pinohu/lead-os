# Erie.Pro Source Reconciliation Plan

Date: 2026-05-10

## Working Hierarchy

For Erie.Pro and LeadOS work, use this order of truth:

1. Live production behavior.
2. Vercel deployment metadata.
3. Recovered dirty source snapshots copied into this workspace.
4. The recovered May 5 dirty worktree.
5. Clean GitHub refs only after reconciliation.

## Current Finding

Production was deployed from `pinohu/lead-os` with Vercel reporting a dirty source state. Clean GitHub source did not contain the full 112-service Erie.Pro catalog.

The recovered May 5 source tree is:

`C:\Users\VRLab\Documents\Codex\2026-05-05\deeply-consider-this-thesis-and-it-2\erie-pro`

The current clean repo target is:

`C:\Users\VRLab\Documents\Codex\2026-05-09\will-you-be-able-to-login\lead-os\erie-pro`

## Focused Commit Scope

Bring only reproducible source into GitHub:

- `erie-pro/src`, excluding generated Prisma client output.
- `erie-pro/prisma`.
- `erie-pro/package.json`.
- `erie-pro/package-lock.json`.
- `erie-pro/prisma.config.ts`.
- `erie-pro/README.md`.
- `erie-pro/vercel.json`.
- `erie-pro/.env.example`.
- public security text files.

Explicitly exclude:

- `.next`.
- `.vercel`.
- `node_modules`.
- `.env.local`.
- `.env.preview.local`.
- `.env.production.local`.
- generated Prisma client output under `src/generated/prisma`.
- temporary files.

## Production-Critical Source Changes

- Add `src/lib/additional-niches.ts` with 68 expansion services.
- Update `src/lib/niches.ts` so the exported catalog is `44 base + 68 expansion = 112`.
- Update niche tests to assert 112 services and verify content resources for every service.
- Bring recovered SEO/content resources that generate route content for the expanded catalog.
- Bring recovered sitemap, service, directory, pricing, FAQ, emergency, reviews, and provider page changes.
- Bring recovered lead capture, inbound lead, provider fulfillment, phone-click tracking, and external lead event support.
- Bring recovered Prisma schema additions for provider-specific lead capture and universal lead events.
- Bring recovered public security files and env example placeholders needed to reproduce integrations without copying private values.

## Verification Plan

- Confirm `niches.length` is 112.
- Confirm `additionalNicheSlugs.length` is 68.
- Run Erie.Pro niche tests.
- Run the Erie.Pro build if dependencies and environment allow it.
- Confirm no local env files or credential values are staged.
- Commit and push the reconciliation as one focused source commit.

