// src/lib/billing/stripe-webhook-idempotency.ts
// Idempotent Stripe webhook processing (Postgres).

import { getPool, queryPostgres } from "../db.ts";

export async function tryClaimStripeWebhookEvent(eventId: string): Promise<boolean> {
  const pool = getPool();
  if (!pool) return true;

  try {
    const r = await queryPostgres<{ event_id: string }>(
      `INSERT INTO stripe_webhook_events (event_id) VALUES ($1)
       ON CONFLICT (event_id) DO NOTHING
       RETURNING event_id`,
      [eventId],
    );
    return r.rows.length > 0;
  } catch {
    return true;
  }
}

export async function releaseStripeWebhookEventClaim(eventId: string): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  try {
    await queryPostgres(`DELETE FROM stripe_webhook_events WHERE event_id = $1`, [eventId]);
  } catch {
    /* ignore */
  }
}
