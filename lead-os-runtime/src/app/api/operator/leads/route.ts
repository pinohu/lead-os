// src/app/api/operator/leads/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth";
import { query } from "@/lib/db";
import { log } from "@/lib/logger";

export async function GET(req: NextRequest) {
  try {
    requireAuth(req);
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await query(
      `SELECT id, email, name, message, tenant_id, created_at FROM leads ORDER BY created_at DESC LIMIT 50`,
    );

    log("operator_leads_fetched", { count: result.rows.length });
    return NextResponse.json({ leads: result.rows });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    log("operator_leads_error", { error: message });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
