// src/lib/operator-actions.ts
// Server-side operator mutations (control plane). All paths validate tenant + audit log.

import { assertPricingExecutionAllowed } from "./billing/entitlements.ts";
import { logOperatorAudit } from "./operator-audit.ts";
import { requireAlignedTenant } from "./api-mutation-guard.ts";
import { tenantConfig } from "./tenant.ts";
import {
  deleteDeadLetterJobById,
  updateNodeStatusByNodeKey,
  updateRecommendationStatus,
} from "./pricing/repository.ts";
import { replayDeadLetterJobById } from "./pricing/queue-client.ts";
import { runPricingTickJob } from "./pricing/job-processor.ts";
import { operatorForceApplyRecommendation } from "./pricing/operator-recommendation-apply.ts";
import { initializeDatabase } from "./db.ts";
import { z } from "zod";

export const OperatorActionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("dlq_replay"), deadLetterId: z.string().regex(/^\d+$/) }),
  z.object({ type: z.literal("dlq_delete"), deadLetterId: z.string().regex(/^\d+$/) }),
  z.object({ type: z.literal("node_pause"), nodeKey: z.string().min(1).max(256) }),
  z.object({ type: z.literal("node_resume"), nodeKey: z.string().min(1).max(256) }),
  z.object({
    type: z.literal("pricing_force_tick"),
    tenantId: z.string().min(1).max(128).optional(),
  }),
  z.object({
    type: z.literal("pricing_override"),
    recommendationId: z.string().regex(/^\d+$/),
    decision: z.enum(["reject", "expire", "force_apply"]),
    note: z.string().max(2000).optional(),
  }),
]);

export type OperatorActionInput = z.infer<typeof OperatorActionSchema>;

export interface OperatorActionContext {
  actorEmail: string;
  request: Request;
}

export async function executeOperatorAction(
  ctx: OperatorActionContext,
  raw: unknown,
): Promise<{ ok: true; data?: Record<string, unknown> } | { ok: false; status: number; error: string }> {
  const parsed = OperatorActionSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, status: 422, error: "validation_failed" };
  }

  const align = requireAlignedTenant(ctx.request);
  if (!align.ok) {
    return { ok: false, status: align.status, error: align.message };
  }

  const tenantId = tenantConfig.tenantId;
  const action = parsed.data;

  async function audit(act: string, detail: Record<string, unknown>, resourceType?: string, resourceId?: string) {
    await logOperatorAudit({
      actorEmail: ctx.actorEmail,
      tenantId,
      action: act,
      resourceType,
      resourceId,
      detail,
    });
  }

  switch (action.type) {
    case "dlq_replay": {
      try {
        await replayDeadLetterJobById(action.deadLetterId);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return { ok: false, status: 400, error: msg };
      }
      await audit("dlq_replay", { deadLetterId: action.deadLetterId }, "dead_letter_jobs", action.deadLetterId);
      return { ok: true, data: { replayed: action.deadLetterId } };
    }
    case "dlq_delete": {
      const deleted = await deleteDeadLetterJobById(action.deadLetterId);
      if (!deleted) return { ok: false, status: 404, error: "dead_letter_not_found" };
      await audit("dlq_delete", { deadLetterId: action.deadLetterId }, "dead_letter_jobs", action.deadLetterId);
      return { ok: true, data: { deleted: action.deadLetterId } };
    }
    case "node_pause": {
      const ok = await updateNodeStatusByNodeKey({
        tenantId,
        nodeKey: action.nodeKey,
        status: "paused",
      });
      if (!ok) return { ok: false, status: 404, error: "node_not_found" };
      await audit("node_pause", { nodeKey: action.nodeKey }, "nodes", action.nodeKey);
      return { ok: true, data: { nodeKey: action.nodeKey, status: "paused" } };
    }
    case "node_resume": {
      const ok = await updateNodeStatusByNodeKey({
        tenantId,
        nodeKey: action.nodeKey,
        status: "active",
      });
      if (!ok) return { ok: false, status: 404, error: "node_not_found" };
      await audit("node_resume", { nodeKey: action.nodeKey }, "nodes", action.nodeKey);
      return { ok: true, data: { nodeKey: action.nodeKey, status: "active" } };
    }
    case "pricing_force_tick": {
      const targetTenant = action.tenantId ?? tenantId;
      if (targetTenant !== tenantId) {
        return { ok: false, status: 403, error: "tenant_mismatch" };
      }
      const gate = await assertPricingExecutionAllowed(targetTenant);
      if (!gate.allowed) {
        await audit("pricing_force_tick_blocked", {
          reason: gate.blockReason,
          state: gate.state,
        });
        return { ok: false, status: 402, error: gate.blockReason ?? "billing_blocked" };
      }
      await initializeDatabase();
      const result = await runPricingTickJob(
        { kind: "tick", tenantId: targetTenant, source: "operator_force_tick" },
        undefined,
      );
      await audit("pricing_force_tick", { result }, "pricing", targetTenant);
      return { ok: true, data: result as unknown as Record<string, unknown> };
    }
    case "pricing_override": {
      const gate = await assertPricingExecutionAllowed(tenantId);
      if (!gate.allowed) {
        return { ok: false, status: 402, error: gate.blockReason ?? "billing_blocked" };
      }
      if (action.decision === "reject") {
        await updateRecommendationStatus({
          recommendationId: action.recommendationId,
          status: "rejected",
          metadataPatch: { operator: ctx.actorEmail, note: action.note ?? null },
        });
        await audit("pricing_override_reject", { note: action.note }, "pricing_recommendations", action.recommendationId);
        return { ok: true, data: { recommendationId: action.recommendationId, status: "rejected" } };
      }
      if (action.decision === "expire") {
        await updateRecommendationStatus({
          recommendationId: action.recommendationId,
          status: "expired",
          metadataPatch: { operator: ctx.actorEmail, note: action.note ?? null },
        });
        await audit("pricing_override_expire", { note: action.note }, "pricing_recommendations", action.recommendationId);
        return { ok: true, data: { recommendationId: action.recommendationId, status: "expired" } };
      }
      const applied = await operatorForceApplyRecommendation({
        recommendationId: action.recommendationId,
        tenantId,
      });
      if (!applied.ok) {
        await audit("pricing_override_force_apply_failed", {
          reason: applied.reason,
          note: action.note,
        }, "pricing_recommendations", action.recommendationId);
        return { ok: false, status: 400, error: applied.reason };
      }
      await audit("pricing_override_force_apply", { note: action.note }, "pricing_recommendations", action.recommendationId);
      return { ok: true, data: { recommendationId: action.recommendationId, status: "applied" } };
    }
  }
}
