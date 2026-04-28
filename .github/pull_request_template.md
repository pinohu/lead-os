## Summary

<!-- One or two sentences describing what this PR does and why. -->

## Changes

<!-- Bulleted list of changes. -->

-
-
-

## Test Plan

<!-- How did you verify this change works? -->

-
-

## Security / Deployment Notes

<!-- Fill out any item that applies. Use N/A only when the change truly cannot affect it. -->

- Secrets or env vars changed:
- Database migrations required:
- Production deploy or alias changes:
- External credentials/services needed:
- Security headers, CORS, auth, cron, webhooks, or billing touched:

## Checklist

- [ ] Relevant tests pass
- [ ] Relevant build/typecheck commands pass
- [ ] `npm audit --audit-level=high` is clean or an explicit exception is documented
- [ ] Secret scan is clean and no `.env` / `.vercel` / build artifacts are included
- [ ] New or changed env vars are documented in `.env.example` or deployment notes
- [ ] Migrations/backfills are documented, reversible where possible, and tested against a non-production database
- [ ] Security-sensitive changes have regression tests
- [ ] Documentation updated, if applicable
- [ ] PR is scoped to a single concern
