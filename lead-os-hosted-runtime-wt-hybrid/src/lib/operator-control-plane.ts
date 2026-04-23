// src/lib/operator-control-plane.ts
// Aggregated runtime + pricing + risk signals for the operator control surface.

import { getDatabaseUrl, queryPostgres } from "@/lib/db";
import {
  isLivePricingEnabled,
  isRedisUrlConfigured,
  isSystemEnabled,
} from "@/lib/pricing/env";
import { getPricingQueueStats } from "@/lib/pricing/queue-client";
import { countDeadLetterJobs } from "@/lib/pricing/repository";
import { getPricingRuntimeSnapshot } from "@/lib/pricing/runtime-state";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import { getBillingGateState, type BillingGateState } from "@/lib/billing/entitlements";

export interface OperatorControlPlaneSnapshot {
  tenantId: string;
  generatedAt: string;
  flags: {
    systemEnabled: boolean;
    livePricingEnabled: boolean;
    redisConfigured: boolean;
  };
  integrations: {
    postgres: boolean;
    supabase: boolean;
  };
  pricingRuntime: ReturnType<typeof getPricingRuntimeSnapshot>;
  queues: Awaited<ReturnType<typeof getPricingQueueStats>> | null;
  deadLetter: {
    persistedCount: number;
    recent: Array<{
      id: string;
      sourceQueue: string;
      jobName: string;
      createdAt: string;
      errorPreview: string;
    }>;
  };
  nodes: Array<{
    nodeKey: string;
    skuKey: string;
    status: string;
    lastScanAt: string | null;
    learningBias: number;
  }>;
  recommendations: {
    byStatus: Record<string, number>;
    recent: Array<{
      id: string;
      skuKey: string;
      status: string;
      recommendedPriceCents: number;
      createdAt: string;
    }>;
  };
  outcomes: {
    pending: number;
    measured: number;
    failed: number;
  };
  billing: BillingGateState;
}

export async function buildOperatorControlPlaneSnapshot(
  tenantId: string,
): Promise<OperatorControlPlaneSnapshot> {
  const [queues, persistedDlq, runtime] = await Promise.all([
    getPricingQueueStats().catch(() => null),
    countDeadLetterJobs().catch(() => 0),
    Promise.resolve(getPricingRuntimeSnapshot()),
  ]);

  const recentDlq = await safeQueryDlqRecent();
  const nodes = await safeQueryNodes(tenantId);
  const { byStatus, recent: recentReco } = await safeQueryRecommendations(tenantId);
  const outcomes = await safeQueryOutcomeCounts(tenantId);
  const billing = await getBillingGateState(tenantId);

  return {
    tenantId,
    generatedAt: new Date().toISOString(),
    flags: {
      systemEnabled: isSystemEnabled(),
      livePricingEnabled: isLivePricingEnabled(),
      redisConfigured: isRedisUrlConfigured(),
    },
    integrations: {
      postgres: Boolean(getDatabaseUrl()),
      supabase: isSupabaseConfigured(),
    },
    pricingRuntime: runtime,
    queues,
    deadLetter: {
      persistedCount: persistedDlq,
      recent: recentDlq,
    },
    nodes,
    recommendations: {
      byStatus,
      recent: recentReco,
    },
    outcomes,
    billing,
  };
}

async function safeQueryDlqRecent(): Promise<OperatorControlPlaneSnapshot["deadLetter"]["recent"]> {
  try {
    const res = await queryPostgres<{
      id: string;
      source_queue: string;
      job_name: string;
      created_at: Date;
      error_message: string;
    }>(
      `SELECT id::text, source_queue, job_name, created_at, error_message
         FROM dead_letter_jobs
        ORDER BY created_at DESC
        LIMIT 25`,
    );
    return res.rows.map((r) => ({
      id: r.id,
      sourceQueue: r.source_queue,
      jobName: r.job_name,
      createdAt: r.created_at.toISOString(),
      errorPreview: r.error_message.slice(0, 200),
    }));
  } catch {
    return [];
  }
}

async function safeQueryNodes(
  tenantId: string,
): Promise<OperatorControlPlaneSnapshot["nodes"]> {
  try {
    const res = await queryPostgres<{
      node_key: string;
      sku_key: string;
      status: string;
      last_scan_at: Date | null;
      learning_bias: string;
    }>(
      `SELECT node_key, sku_key, status, last_scan_at, learning_bias::text
         FROM nodes
        WHERE tenant_id = $1
        ORDER BY node_key ASC
        LIMIT 200`,
      [tenantId],
    );
    return res.rows.map((r) => ({
      nodeKey: r.node_key,
      skuKey: r.sku_key,
      status: r.status,
      lastScanAt: r.last_scan_at ? r.last_scan_at.toISOString() : null,
      learningBias: Number(r.learning_bias),
    }));
  } catch {
    return [];
  }
}

async function safeQueryRecommendations(tenantId: string): Promise<{
  byStatus: Record<string, number>;
  recent: OperatorControlPlaneSnapshot["recommendations"]["recent"];
}> {
  try {
    const summary = await queryPostgres<{ status: string; c: string }>(
      `SELECT status, COUNT(*)::text AS c FROM pricing_recommendations WHERE tenant_id = $1 GROUP BY status`,
      [tenantId],
    );
    const byStatus: Record<string, number> = {};
    for (const row of summary.rows) {
      byStatus[row.status] = Number(row.c);
    }
    const recent = await queryPostgres<{
      id: string;
      sku_key: string;
      status: string;
      recommended_price_cents: number;
      created_at: Date;
    }>(
      `SELECT id::text, sku_key, status, recommended_price_cents, created_at
         FROM pricing_recommendations
        WHERE tenant_id = $1
        ORDER BY created_at DESC
        LIMIT 30`,
      [tenantId],
    );
    return {
      byStatus,
      recent: recent.rows.map((r) => ({
        id: r.id,
        skuKey: r.sku_key,
        status: r.status,
        recommendedPriceCents: r.recommended_price_cents,
        createdAt: r.created_at.toISOString(),
      })),
    };
  } catch {
    return { byStatus: {}, recent: [] };
  }
}

async function safeQueryOutcomeCounts(tenantId: string): Promise<OperatorControlPlaneSnapshot["outcomes"]> {
  try {
    const res = await queryPostgres<{ status: string; c: string }>(
      `SELECT status, COUNT(*)::text AS c FROM pricing_outcomes WHERE tenant_id = $1 GROUP BY status`,
      [tenantId],
    );
    const out = { pending: 0, measured: 0, failed: 0 };
    for (const row of res.rows) {
      if (row.status === "pending") out.pending = Number(row.c);
      if (row.status === "measured") out.measured = Number(row.c);
      if (row.status === "failed") out.failed = Number(row.c);
    }
    return out;
  } catch {
    return { pending: 0, measured: 0, failed: 0 };
  }
}
