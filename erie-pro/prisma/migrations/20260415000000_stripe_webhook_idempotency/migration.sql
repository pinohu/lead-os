-- ── Stripe Webhook Idempotency ────────────────────────────────────
-- Primary-key-gated dedupe for Stripe webhook retries. The webhook
-- handler inserts event.id here before doing any side-effect work;
-- a unique violation means this retry is a duplicate and we skip.

CREATE TABLE IF NOT EXISTS "stripe_webhook_events" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stripe_webhook_events_pkey" PRIMARY KEY ("id")
);
