# Production Safety Hardening

## Priorities

1. Identity mapping between Supabase users and Stripe customers
2. Stripe webhook verification and trusted lookup
3. Transaction-safe writes for ownership + subscription activation

## Identity Rule

owner_id in runtime tables must be the authenticated provider user id.
Stripe customer ids should be stored separately and mapped to provider ids.

## Webhook Rule

Never trust incoming metadata alone for territory activation.
Always verify the event signature and reconcile state using stored checkout/session mappings.

## Data Integrity Rule

Ownership activation and subscription activation should be written atomically or through an RPC/transaction-safe pathway.
