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

## Remaining Delivery Watchpoints

- Local `npm run detect:env` reported all env keys unset during this audit; dry-run behavior is acceptable for development, but production launch needs a filled environment vault and post-deploy smoke checks.
- `npm run build` still emits Next.js warnings about the deprecated `middleware` file convention and edge runtime static-generation limits. They are not blockers today, but the middleware-to-proxy migration should be scheduled.
- The package catalog carries a large amount of strategy text. It is valuable as operating doctrine, but customer-facing package pages should keep first-screen decisions concise and push deep evidence into expandable sections.
- The monorepo still contains legacy CX React naming. The top-level README now names Lead OS first, but a complete brand cleanup should be handled as a dedicated docs and route-label pass.
