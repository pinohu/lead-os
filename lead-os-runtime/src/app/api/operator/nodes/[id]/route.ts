// src/app/api/operator/nodes/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth";
import { query } from "@/lib/db";
import { updateNodeSchema } from "@/lib/validate";
import { log } from "@/lib/logger";
import { logAudit } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    requireAuth(req);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const nodeId = parseInt(id, 10);
  if (isNaN(nodeId)) {
    return NextResponse.json({ error: "Invalid node ID" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const parsed = updateNodeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    for (const [key, value] of Object.entries(parsed.data)) {
      if (value !== undefined) {
        fields.push(`${key} = $${idx}`);
        values.push(value);
        idx++;
      }
    }

    if (fields.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    values.push(nodeId);
    const result = await query(
      `UPDATE nodes SET ${fields.join(", ")} WHERE id = $${idx} RETURNING id`,
      values,
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Node not found" }, { status: 404 });
    }

    logAudit("node_updated", { id: nodeId, fields: Object.keys(parsed.data) });
    return NextResponse.json({ success: true, id: nodeId });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error";
    log("operator_update_node_error", { error: msg });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    requireAuth(req);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const nodeId = parseInt(id, 10);
  if (isNaN(nodeId)) {
    return NextResponse.json({ error: "Invalid node ID" }, { status: 400 });
  }

  try {
    const result = await query(
      `UPDATE nodes SET is_active = false WHERE id = $1 RETURNING id`,
      [nodeId],
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Node not found" }, { status: 404 });
    }

    logAudit("node_disabled", { id: nodeId });
    return NextResponse.json({ success: true, id: nodeId });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error";
    log("operator_delete_node_error", { error: msg });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
