-- ── Annual membership renewal lifecycle ────────────────────────────
-- Adds the columns the cron uses to drive renewal reminders + mark
-- annual memberships expired at term end. Only applies to
-- sessionType='annual_membership' rows at the application layer.

ALTER TABLE "checkout_sessions"
  ADD COLUMN "renewalReminder30SentAt" TIMESTAMP(3),
  ADD COLUMN "renewalReminder7SentAt"  TIMESTAMP(3),
  ADD COLUMN "expiredAt"               TIMESTAMP(3);
