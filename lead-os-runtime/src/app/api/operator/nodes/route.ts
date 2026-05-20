// src/app/api/operator/nodes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth";
import { query } from "@/lib/db";
import { createNodeSchema } from "@/lib/validate";
import { log } from "@/lib/logger";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    requireAuth(req);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await query(
      `SELECT id, name, category, webhook_url, email, is_active, created_at
       FROM nodes ORDER BY created_at DESC`,
    );
    return NextResponse.json({ nodes: result.rows });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error";
    log("operator_nodes_error", { error: msg });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    requireAuth(req);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = createNodeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { name, category, webhook_url, email, is_active } = parsed.data;

    const result = await query<{ id: number }>(
      `INSERT INTO nodes (name, category, webhook_url, email, is_active)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [name, category, webhook_url ?? null, email ?? null, is_active ?? true],
    );

    const id = result.rows[0].id;
    logAudit("node_created", { id, name, category });

    return NextResponse.json({ success: true, id }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error";
    log("operator_create_node_error", { error: msg });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
