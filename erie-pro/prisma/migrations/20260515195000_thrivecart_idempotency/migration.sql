-- ── ThriveCart webhook idempotency ────────────────────────────────────
-- Pre-launch audit (#7) found that the ThriveCart webhook handler had
-- no idempotency guard. ThriveCart retries failed deliveries for ~24h;
-- on retry, the handler would create a second OfferPurchase row, fire
-- a second fulfillment job, and send a second confirmation email.
--
-- This migration adds two layers of protection:
--   1. ThriveCartEvent.payloadHash UNIQUE — fast-path dedup on the raw
--      payload SHA-256. Handler will check this first.
--   2. OfferPurchase (thriveCartOrderId, offerId) UNIQUE — defense-in-
--      depth in case two concurrent deliveries race past the hash check.
--      NULL orderIds (non-ThriveCart purchases) are allowed to coexist
--      via default Postgres unique semantics.
--
-- Both columns are nullable so existing rows do not need backfill.

-- Step 1: ThriveCartEvent.payloadHash
ALTER TABLE "thrivecart_events" ADD COLUMN "payloadHash" TEXT;
CREATE UNIQUE INDEX "thrivecart_events_payloadHash_key"
  ON "thrivecart_events"("payloadHash");

-- Step 2: OfferPurchase composite unique
-- Existing data may contain duplicate (thriveCartOrderId, offerId) rows
-- from past unguarded webhook retries. We log them via a one-off check
-- query in this migration's notes rather than mutating them — a manual
-- review pass should reconcile any pre-existing duplicates BEFORE this
-- index is created on a populated prod DB. If duplicates exist, the
-- CREATE UNIQUE INDEX will fail and the migration will roll back; the
-- operator should then de-dup and rerun.
CREATE UNIQUE INDEX "offer_purchases_thriveCartOrderId_offerId_key"
  ON "offer_purchases"("thriveCartOrderId", "offerId");
