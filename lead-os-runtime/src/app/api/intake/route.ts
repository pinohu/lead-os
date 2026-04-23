// src/app/api/intake/route.ts
import { NextRequest, NextResponse } from "next/server";
import { intakeSchema } from "@/lib/validate";
import { query } from "@/lib/db";
import { log } from "@/lib/logger";

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

    const { email, name, message, tenant_id } = parsed.data;

    const result = await query<{ id: number }>(
      `INSERT INTO leads (email, name, message, tenant_id) VALUES ($1, $2, $3, $4) RETURNING id`,
      [email, name ?? null, message, tenant_id ?? "default"],
    );

    const id = result.rows[0].id;
    log("lead_captured", { id, email, tenant_id: tenant_id ?? "default" });

    return NextResponse.json({ success: true, id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    log("intake_error", { error: message });
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
