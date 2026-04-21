# Production Auth Upgrade

## Recommendation

Use Supabase Auth as the production authentication provider for provider logins and dashboard access.

## Why Supabase

- app-router friendly cookie-based auth
- direct fit for owner, territory, billing, and lead tables
- supports row-level security for provider dashboard access
- aligns with the marketplace data model better than a standalone auth-only layer

## Initial Scope

- provider sign-in
- provider session resolution
- ownerId derived from authenticated user
- dashboard restricted to records for that owner
- territory ownership tied to authenticated provider identity

## Future Scope

- operator/admin roles
- billing-aware role checks
- invitation-based provider onboarding
- org/team support for multi-location providers

## Migration Rule

Replace local provider-store and session-store with Supabase-backed identity and session resolution.
