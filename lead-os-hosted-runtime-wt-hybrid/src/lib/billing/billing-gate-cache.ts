// src/lib/billing/billing-gate-cache.ts
// Short-TTL cache for billing gate queries to avoid Postgres on every middleware hop.

import type { BillingGateState } from "./entitlements.ts";
import { getBillingGateState } from "./entitlements.ts";

const TTL_MS = Math.max(5_000, Number(process.env.LEAD_OS_BILLING_CACHE_TTL_MS ?? 60_000));

interface CacheEntry {
  state: BillingGateState;
  expires: number;
}

const cache = new Map<string, CacheEntry>();

export async function getBillingGateStateCached(tenantId: string): Promise<BillingGateState> {
  const now = Date.now();
  const hit = cache.get(tenantId);
  if (hit && hit.expires > now) return hit.state;

  const state = await getBillingGateState(tenantId);
  cache.set(tenantId, { state, expires: now + TTL_MS });
  return state;
}

export function invalidateBillingGateCache(tenantId?: string): void {
  if (tenantId) cache.delete(tenantId);
  else cache.clear();
}
