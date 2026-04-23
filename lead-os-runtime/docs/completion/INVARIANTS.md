# LeadOS TCS v1.0 Invariants

## Idempotency rules
- `POST /api/intake` must treat `Idempotency-Key` + payload hash as immutable.
- Same key + same payload returns cached success (`200` replay).
- Same key + different payload returns `409`.
- Operator mutation routes with idempotency support must reject mismatched payload reuse with `409`.

## Billing rules
- If `LEAD_OS_BILLING_ENFORCE=true`, inactive subscriptions must not pass billing-gated flows.
- Middleware must return `402` for blocked authenticated routes when billing gate denies access.
- Route-level pricing execution guards must return blocked state for inactive/disallowed plans.

## Routing rules
- Intake flow must persist the lead before writing assignment/delivery side effects.
- Assignment/delivery side effects must be recorded for successful intake execution.
- No-route conditions (no eligible active node) must be represented as explicit structured outcomes, not silent failures.

## Auth rules
- Operator routes require operator session or valid operator API key identity path.
- Unauthorized operator access returns `401`.
- Tenant mismatch on enforced paths returns `403`.
- Cron/internal routes require cron auth guard and must fail closed when missing/invalid.
