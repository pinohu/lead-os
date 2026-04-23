// src/app/api/operator/nodes/route.ts
import { NextResponse } from "next/server";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { requireAlignedTenant } from "@/lib/api-mutation-guard";
import { logApiMutationAudit } from "@/lib/api/api-mutation-audit";
import { tenantConfig } from "@/lib/tenant";
import {
  ensureNodesForTenant,
  listActiveNodes,
  updateNodeStatusByNodeKey,
} from "@/lib/pricing/repository";
import { logOperatorAudit } from "@/lib/operator-audit";
import { z } from "zod";

const CreateNodeStatusSchema = z.object({
  nodeKey: z.string().trim().min(1).max(256),
  status: z.enum(["active", "paused", "disabled"]),
});

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { session, response } = await requireOperatorApiSession(request);
  if (!session?.email) return response ?? NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const align = requireAlignedTenant(request);
  if (!align.ok) {
    await logApiMutationAudit({
      route: "/api/operator/nodes",
      method: "GET",
      actorHint: session.email,
      tenantId: tenantConfig.tenantId,
      outcome: "failure",
      detail: { reason: "tenant_mismatch" },
    });
    return NextResponse.json({ success: false, error: "tenant_mismatch" }, { status: align.status });
  }

  await ensureNodesForTenant(tenantConfig.tenantId);
  const nodes = await listActiveNodes(tenantConfig.tenantId);

  await logApiMutationAudit({
    route: "/api/operator/nodes",
    method: "GET",
    actorHint: session.email,
    tenantId: tenantConfig.tenantId,
    outcome: "success",
    detail: { count: nodes.length },
  });

  return NextResponse.json({ success: true, data: nodes });
}

export async function POST(request: Request) {
  const { session, response } = await requireOperatorApiSession(request);
  if (!session?.email) return response ?? NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const align = requireAlignedTenant(request);
  if (!align.ok) return NextResponse.json({ success: false, error: "tenant_mismatch" }, { status: align.status });

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "invalid_json" }, { status: 400 });
  }

  const parsed = CreateNodeStatusSchema.safeParse(rawBody);
  if (!parsed.success) {
    await logApiMutationAudit({
      route: "/api/operator/nodes",
      method: "POST",
      actorHint: session.email,
      tenantId: tenantConfig.tenantId,
      outcome: "failure",
      detail: { reason: "validation_failed" },
    });
    return NextResponse.json(
      { success: false, error: "validation_failed", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const updated = await updateNodeStatusByNodeKey({
    tenantId: tenantConfig.tenantId,
    nodeKey: parsed.data.nodeKey,
    status: parsed.data.status,
  });
  if (!updated) {
    await logApiMutationAudit({
      route: "/api/operator/nodes",
      method: "POST",
      actorHint: session.email,
      tenantId: tenantConfig.tenantId,
      outcome: "failure",
      detail: { reason: "node_not_found", nodeKey: parsed.data.nodeKey },
    });
    return NextResponse.json({ success: false, error: "node_not_found" }, { status: 404 });
  }

  await logOperatorAudit({
    actorEmail: session.email,
    tenantId: tenantConfig.tenantId,
    action: "node_status_update",
    resourceType: "nodes",
    resourceId: parsed.data.nodeKey,
    detail: { status: parsed.data.status },
  });

  await logApiMutationAudit({
    route: "/api/operator/nodes",
    method: "POST",
    actorHint: session.email,
    tenantId: tenantConfig.tenantId,
    outcome: "success",
    detail: { nodeKey: parsed.data.nodeKey, status: parsed.data.status },
  });

  return NextResponse.json({
    success: true,
    data: { nodeKey: parsed.data.nodeKey, status: parsed.data.status },
  });
}
