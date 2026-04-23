// src/app/api/operator/control-plane/route.ts
import { NextResponse } from "next/server";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { buildOperatorControlPlaneSnapshot } from "@/lib/operator-control-plane.ts";
import { tenantConfig } from "@/lib/tenant.ts";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { session, response } = await requireOperatorApiSession(request);
  if (!session) {
    return (
      response ??
      NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })
    );
  }

  const tenantId = tenantConfig.tenantId;
  const snapshot = await buildOperatorControlPlaneSnapshot(tenantId);
  return NextResponse.json({ ok: true, data: snapshot });
}
