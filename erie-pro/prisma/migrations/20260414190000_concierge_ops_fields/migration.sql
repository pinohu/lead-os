-- Concierge ops fields on CheckoutSession:
--   * assignedProviderId  — which pro we're routing the requester to
--   * opsNotes            — private notes for the ops team
--   * fulfilledAt         — timestamp when the requester was handed off
-- Plus a composite index so the admin concierge inbox page can filter
-- by sessionType + status cheaply.

ALTER TABLE "checkout_sessions"
  ADD COLUMN "assignedProviderId" TEXT,
  ADD COLUMN "opsNotes"           TEXT,
  ADD COLUMN "fulfilledAt"        TIMESTAMP(3);

CREATE INDEX "checkout_sessions_sessionType_status_idx"
  ON "checkout_sessions"("sessionType", "status");
