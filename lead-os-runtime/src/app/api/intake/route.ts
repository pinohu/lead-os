// src/app/api/intake/route.ts
import { NextRequest, NextResponse } from "next/server";
import { intakeSchema } from "@/lib/validate";
import { query } from "@/lib/db";
import { log } from "@/lib/logger";
import { selectNode } from "@/lib/routing";
import { deliverLead } from "@/lib/delivery";
import { logAudit } from "@/lib/audit";
import type { Lead } from "@/types/lead";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = intakeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { email, name, message, category, tenant_id } = parsed.data;
    const resolvedCategory = category ?? "general";

    const result = await query<Lead>(
      `INSERT INTO leads (email, name, message, category, tenant_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, name, message, category, tenant_id, created_at`,
      [email, name ?? null, message, resolvedCategory, tenant_id ?? "default"],
    );

    const lead = result.rows[0];
    log("lead_captured", { id: lead.id, email, category: resolvedCategory, tenant_id: tenant_id ?? "default" });

    const node = await selectNode(resolvedCategory);

    if (!node) {
      log("no_route", { lead_id: lead.id, category: resolvedCategory });
      return NextResponse.json({ success: true, id: lead.id, routed: false, node: null });
    }

    await query(
      `INSERT INTO lead_assignments (lead_id, node_id, status) VALUES ($1, $2, 'assigned')`,
      [lead.id, node.id],
    );

    logAudit("lead_assigned", { lead_id: lead.id, node_id: node.id, node_name: node.name });

    const delivery = await deliverLead(lead, node);

    await query(
      `INSERT INTO delivery_logs (lead_id, node_id, method, success, response) VALUES ($1, $2, $3, $4, $5)`,
      [lead.id, node.id, delivery.method, delivery.success, delivery.response],
    );

    logAudit("lead_delivered", {
      lead_id: lead.id,
      node_id: node.id,
      method: delivery.method,
      success: delivery.success,
    });

    return NextResponse.json({
      success: true,
      id: lead.id,
      routed: true,
      node: node.name,
      delivered: delivery.success,
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "unknown error";
    log("intake_error", { error: errMsg });
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
