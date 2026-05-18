-- 2026-05-18 deep-audit hardening migration
--
-- This migration is forward-only and backfill-free:
--   • New columns are nullable so existing rows remain valid.
--   • New indexes are concurrent-safe Postgres B-trees on existing columns.
--   • No data is rewritten.
--
-- See erie-pro/AUDIT-2026-05-18.md for the findings these address:
--   C1 — TCPA consent version stored on Lead row
--   C4 — server-issued session token bound to each IntakeConversation
--   H1 — index Lead(email) and Lead(phone, niche, city) for production-scale lookups
--        (unique constraint deferred: requires a pre-migration dedupe pass and is
--        not safe to enforce without verifying existing prod row uniqueness)

-- C1. TCPA consent version label on every Lead row, paired with the existing
-- tcpaConsentText to preserve a tamper-proof audit trail of which wording the
-- consumer was shown.
ALTER TABLE "leads" ADD COLUMN "tcpaConsentVersion" TEXT;

-- H1. Indexes that the application already queries on but lacked DB support
-- for. CREATE INDEX (non-concurrent) is fine here because the table is small
-- enough today that the brief lock is acceptable.
CREATE INDEX IF NOT EXISTS "leads_email_idx" ON "leads"("email");
CREATE INDEX IF NOT EXISTS "leads_phone_niche_city_idx" ON "leads"("phone", "niche", "city");

-- C4. Opaque server-issued session token for intake conversations. The
-- application sets a same-named HTTP-only cookie on /api/intake/start and
-- requires the cookie value to match this column on every subsequent step.
-- Nullable to keep pre-migration rows valid; new rows always populate.
ALTER TABLE "intake_conversations" ADD COLUMN "sessionToken" TEXT;
