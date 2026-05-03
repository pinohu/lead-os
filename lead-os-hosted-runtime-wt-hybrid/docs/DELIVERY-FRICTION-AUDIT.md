# Delivery Friction Audit

Date: 2026-05-03

This audit reviews the delivery path from operator setup through package launch, verification, and deployment-readiness scripts.

## Current Verdict

The kernel is buildable and heavily tested, but delivery friction clusters around recoverability, environment-sensitive links, and clean-workspace verification. The highest-risk path was `/onboard`: if a browser kept local wizard state while the server session disappeared, the operator could land on a dead-end completion screen. A second risk was generated deliverable URLs falling back to `localhost` when `NEXT_PUBLIC_SITE_URL` was absent. A third risk was `npm run verify:backup-archive` failing on a fresh checkout without an archive argument.

## Changes Made From This Audit

- Onboarding completion now accepts a request-derived base URL, so embed scripts, dashboard links, and checkout redirects use the actual host that served the request.
- Checkout session success and cancel URLs now use the request host before falling back to `NEXT_PUBLIC_SITE_URL`.
- The onboarding UI no longer restores stale incomplete `complete` drafts from local storage.
- Session-expired completion states now offer two explicit actions: recover with email or start fresh.
- Session-not-found checkout failures now surface a recoverable state instead of silently pushing the user into a dead end.
- Remaining hardcoded low-contrast onboarding headings were moved from `text-slate-50` to theme-aware foreground tokens.
- Backup archive verification now supports an explicit path, `BACKUP_ARCHIVE`, latest local archive auto-discovery, and a successful SKIP state for clean workspaces.
- Regression tests were added for backup verification and request-host delivery URLs.

## Verification Run

- `npm test`: passed, 4,292 tests, 4,291 pass, 1 skipped.
- `npm run build`: passed, 1,013 static pages generated.
- `npm run verify:product-surfaces`: passed, 36 App Router pages and 22 API entrypoints present.
- `npm run verify:backup-archive`: passed with expected SKIP when no archive is supplied.
- `npm run verify:migrations`: passed file-only verification for 14 migrations because `DATABASE_URL` was not set.
- `npm run enumerate:api-routes`: passed, 514 API route files enumerated.

## Watchpoints Closed

- Environment readiness now has two modes: `npm run detect:env` for local visibility and `npm run verify:env:production` for strict vault validation. Both load local env files when present and print no secret values.
- Post-deploy delivery now has `npm run smoke:postdeploy -- --url <production-url>` to verify health, production readiness, packages, onboarding, and build-id surfaces.
- The deprecated Next.js request gate was migrated from `src/middleware.ts` to `src/proxy.ts`, and the OG route no longer forces the edge runtime during static generation.
- Package catalog doctrine remains in the codebase, but customer-facing package decisions now show concise first-screen copy and move deep evidence into expandable sections.
- Lead OS naming is now the public default across env templates, metadata fallbacks, OpenAPI, docs, and tests. The runtime keeps only a non-public lowercase compatibility alias for old env values.
