// src/lib/billing/entitlements.ts
// Plan limits and pricing execution gates (Postgres-backed when migration 007 applied).

import { queryPostgres } from "../db.ts";
import { pricingLog } from "../pricing/logger.ts";
import type { ApiAccessTierRequirement } from "./api-route-tier.ts";

export interface BillingGateState {
  enforcement: boolean;
  subscriptionActive: boolean;
  pricingExecutionAllowed: boolean;
  planKey: string | null;
  maxNodes: number;
  nodeCount: number;
  apiAccessTier: string | null;
}

function isBillingEnforceEnabled(): boolean {
  return process.env.LEAD_OS_BILLING_ENFORCE === "true";
}

export async function getBillingGateState(tenantId: string): Promise<BillingGateState> {
  const enforcement = isBillingEnforceEnabled();
  if (!enforcement) {
    return {
      enforcement: false,
      subscriptionActive: true,
      pricingExecutionAllowed: true,
      planKey: null,
      maxNodes: 999_999,
      nodeCount: 0,
      apiAccessTier: "full",
    };
  }

  try {
    const sub = await queryPostgres<{
      plan_key: string;
      status: string;
      max_nodes: number;
      pricing_execution_allowed: boolean;
      api_access_tier: string;
    }>(
      `SELECT s.plan_key, s.status, p.max_nodes, p.pricing_execution_allowed, p.api_access_tier
         FROM billing_subscriptions s
         JOIN billing_plans p ON p.plan_key = s.plan_key
        WHERE s.tenant_id = $1
        LIMIT 1`,
      [tenantId],
    );
    const row = sub.rows[0];
    const subscriptionActive = Boolean(
      row && (row.status === "active" || row.status === "trialing"),
    );

    const nodes = await queryPostgres<{ c: string }>(
      `SELECT COUNT(*)::text AS c FROM nodes WHERE tenant_id = $1`,
      [tenantId],
    );
    const nodeCount = Number(nodes.rows[0]?.c ?? 0);

    if (!row) {
      pricingLog("warn", "billing_no_subscription", { tenantId });
      return {
        enforcement: true,
        subscriptionActive: false,
        pricingExecutionAllowed: false,
        planKey: null,
        maxNodes: 0,
        nodeCount,
        apiAccessTier: null,
      };
    }

    return {
      enforcement: true,
      subscriptionActive,
      pricingExecutionAllowed: subscriptionActive && row.pricing_execution_allowed,
      planKey: row.plan_key,
      maxNodes: row.max_nodes,
      nodeCount,
      apiAccessTier: row.api_access_tier,
    };
  } catch (err) {
    pricingLog("warn", "billing_gate_query_failed", {
      tenantId,
      message: err instanceof Error ? err.message : String(err),
    });
    return {
      enforcement: true,
      subscriptionActive: false,
      pricingExecutionAllowed: false,
      planKey: null,
      maxNodes: 0,
      nodeCount: 0,
      apiAccessTier: null,
    };
  }
}

export async function assertPricingExecutionAllowed(tenantId: string): Promise<{
  allowed: boolean;
  state: BillingGateState;
  blockReason?: string;
}> {
  const state = await getBillingGateState(tenantId);
  if (!state.enforcement) {
    return { allowed: true, state };
  }
  if (!state.subscriptionActive) {
    pricingLog("warn", "pricing_execution_blocked", { tenantId, blockReason: "subscription_inactive" });
    return { allowed: false, state, blockReason: "subscription_inactive" };
  }
  if (!state.pricingExecutionAllowed) {
    pricingLog("warn", "pricing_execution_blocked", { tenantId, blockReason: "plan_disallows_pricing" });
    return { allowed: false, state, blockReason: "plan_disallows_pricing" };
  }
  if (state.nodeCount > state.maxNodes) {
    pricingLog("warn", "pricing_execution_blocked", {
      tenantId,
      blockReason: "node_limit_exceeded",
      nodeCount: state.nodeCount,
      maxNodes: state.maxNodes,
    });
    return { allowed: false, state, blockReason: "node_limit_exceeded" };
  }
  return { allowed: true, state };
}

export function assertApiAccessTierAllows(
  state: BillingGateState,
  requiredTier: ApiAccessTierRequirement,
): boolean {
  if (requiredTier === "none") return true;
  if (!state.enforcement) return true;
  const tier = state.apiAccessTier ?? "none";
  if (requiredTier === "standard") return tier === "standard" || tier === "full";
  return tier === "full";
}
