// src/lib/erie/directory-lead-flow.ts
// Erie.pro-style directory routing: category → node, billing gate, delivery, persistence.

import { getPool, queryPostgres } from "@/lib/db";
import { getBillingGateState } from "@/lib/billing/entitlements";
import { appendEvents } from "@/lib/runtime-store";
import { createCanonicalEvent } from "@/lib/trace";
import type { TraceContext } from "@/lib/trace";
import { sendLead } from "@/lib/integrations/lead-delivery-hub";
import { logger } from "@/lib/logger";
import type { IntegrationSendResult } from "@/lib/integrations/lead-delivery-hub";

export interface DirectoryLeadFlowInput {
  tenantId: string;
  leadKey: string;
  category: string;
  trace: TraceContext;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  description?: string;
}

export interface DirectoryLeadFlowResult {
  ran: boolean;
  reason?: string;
  category: string;
  nodeKey?: string;
  billingOk?: boolean;
  delivery?: IntegrationSendResult[];
  routeId?: string;
}

function directoryTenantIds(): string[] {
  const raw = process.env.LEAD_OS_DIRECTORY_TENANTS ?? "erie";
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function shouldRunDirectoryLeadFlow(tenantId: string): boolean {
  return directoryTenantIds().includes(tenantId.toLowerCase());
}

export async function resolveDirectoryNodeKey(
  tenantId: string,
  category: string,
): Promise<{ nodeKey: string | null; reason?: string }> {
  const cat = category.trim().toLowerCase();
  const pool = getPool();
  if (!pool) {
    const fallback: Record<string, string> = {
      plumbing: "plumber_erie_test_1",
      hvac: "hvac_erie_test_1",
    };
    const nodeKey = fallback[cat] ?? null;
    return nodeKey ? { nodeKey } : { nodeKey: null, reason: "no_db_fallback_miss" };
  }

  try {
    const res = await queryPostgres<{ node_key: string }>(
      `SELECT node_key FROM nodes
        WHERE tenant_id = $1 AND status = 'active'
          AND (metadata->>'category') = $2
        ORDER BY node_key ASC
        LIMIT 1`,
      [tenantId, cat],
    );
    const row = res.rows[0];
    if (row?.node_key) return { nodeKey: row.node_key };
    return { nodeKey: null, reason: "no_active_node_for_category" };
  } catch {
    return { nodeKey: null, reason: "node_query_failed" };
  }
}

export async function runDirectoryLeadFlow(input: DirectoryLeadFlowInput): Promise<DirectoryLeadFlowResult> {
  const { tenantId, leadKey, category, trace } = input;
  if (!shouldRunDirectoryLeadFlow(tenantId)) {
    return { ran: false, reason: "tenant_not_directory_list", category };
  }

  const cat = category.trim().toLowerCase();
  if (!cat) {
    return { ran: true, reason: "missing_category", category: "" };
  }

  const resolved = await resolveDirectoryNodeKey(tenantId, cat);
  if (!resolved.nodeKey) {
    await appendEvents([
      createCanonicalEvent(trace, "directory_route_failed", "internal", "FAILED", {
        category: cat,
        reason: resolved.reason ?? "unknown",
      }),
    ]);
    return { ran: true, reason: resolved.reason ?? "no_node", category: cat };
  }

  if (process.env.LEAD_OS_BILLING_ENFORCE === "true") {
    const state = await getBillingGateState(tenantId);
    if (!state.subscriptionActive) {
      await appendEvents([
        createCanonicalEvent(trace, "directory_route_blocked", "internal", "BILLING", {
          category: cat,
          nodeKey: resolved.nodeKey,
          blockReason: "subscription_inactive",
        }),
      ]);
      return {
        ran: true,
        reason: "billing_blocked",
        category: cat,
        nodeKey: resolved.nodeKey,
        billingOk: false,
      };
    }
  }

  const pool = getPool();
  let routeId: string | undefined;
  if (pool) {
    try {
      const ins = await queryPostgres<{ id: string }>(
        `INSERT INTO lead_os_directory_routes
          (tenant_id, lead_key, category, node_key, delivery_channel, outcome, detail)
         VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
         RETURNING id::text AS id`,
        [
          tenantId,
          leadKey,
          cat,
          resolved.nodeKey,
          "multi",
          "delivering",
          JSON.stringify({ phase: "started" }),
        ],
      );
      routeId = ins.rows[0]?.id;
    } catch (err) {
      logger.warn("erie.directory_route_insert_failed", {
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const deliveryPayload = {
    tenantId,
    leadKey,
    category: cat,
    nodeKey: resolved.nodeKey,
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    phone: input.phone,
    description: input.description,
  };

  const delivery = await sendLead(deliveryPayload);

  if (pool && routeId) {
    try {
      await queryPostgres(
        `UPDATE lead_os_directory_routes
            SET outcome = $2,
                detail = detail || $3::jsonb
          WHERE id = $1::bigint`,
        [
          routeId,
          delivery.some((d) => d.ok && d.mode === "live") ? "sent" : "completed_simulated",
          JSON.stringify({ delivery: delivery.map((d) => ({ channel: d.channel, ok: d.ok, mode: d.mode })) }),
        ],
      );
    } catch {
      /* ignore */
    }
  }

  await appendEvents([
    createCanonicalEvent(trace, "directory_routed", "internal", "ROUTED", {
      category: cat,
      nodeKey: resolved.nodeKey,
      routeId: routeId ?? null,
      deliverySummary: delivery.map((d) => `${d.channel}:${d.mode}:${d.ok}`).join("|"),
    }),
  ]);

  return {
    ran: true,
    category: cat,
    nodeKey: resolved.nodeKey,
    billingOk: true,
    delivery,
    routeId,
  };
}
