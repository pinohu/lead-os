import { NextResponse } from "next/server"
import { requireOperatorApiSession } from "@/lib/operator-auth"
import { requireAlignedTenant } from "@/lib/api-mutation-guard"
import { queryPostgres } from "@/lib/db"
import { logOperatorAudit } from "@/lib/operator-audit"
import { tenantConfig } from "@/lib/tenant"

interface NodeRouteContext {
  params: Promise<{ id: string }>
}

export async function PATCH(request: Request, context: NodeRouteContext) {
  const { session, response } = await requireOperatorApiSession(request)
  if (!session?.email)
    return response ?? NextResponse.json({ success: false, error: "unauthorized" }, { status: 401 })

  const aligned = requireAlignedTenant(request)
  if (!aligned.ok)
    return NextResponse.json(
      { success: false, error: aligned.message },
      { status: aligned.status },
    )

  const { id } = await context.params
  if (!/^\d+$/.test(id)) {
    return NextResponse.json(
      { success: false, error: "invalid_node_id" },
      { status: 400 },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: "invalid_json" },
      { status: 400 },
    )
  }

  const status = (
    body &&
    typeof body === "object" &&
    "status" in body &&
    typeof body.status === "string"
  )
    ? body.status
    : null

  if (status !== "active" && status !== "paused" && status !== "disabled") {
    return NextResponse.json(
      { success: false, error: "invalid_status" },
      { status: 422 },
    )
  }

  const result = await queryPostgres<{
    id: string
    node_key: string
    sku_key: string
    status: "active" | "paused" | "disabled"
    updated_at: string
  }>(
    `UPDATE nodes
        SET status = $3, updated_at = NOW()
      WHERE tenant_id = $1 AND id = $2::bigint
  RETURNING id::text, node_key, sku_key, status, updated_at::text`,
    [tenantConfig.tenantId, id, status],
  )
  const node = result.rows[0]
  if (!node) {
    return NextResponse.json(
      { success: false, error: "node_not_found" },
      { status: 404 },
    )
  }

  await logOperatorAudit({
    actorEmail: session.email,
    tenantId: tenantConfig.tenantId,
    action: "node_status_update",
    resourceType: "nodes",
    resourceId: id,
    detail: {
      nodeKey: node.node_key,
      skuKey: node.sku_key,
      status: node.status,
    },
  })

  return NextResponse.json({
    success: true,
    data: node,
  })
}
