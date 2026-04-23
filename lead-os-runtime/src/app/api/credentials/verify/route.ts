import { NextRequest, NextResponse } from "next/server";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { verifyCredential } from "@/lib/credentials-vault";
import { tenantConfig } from "@/lib/tenant";

export async function POST(request: NextRequest) {
  const { session, response } = await requireOperatorApiSession(request);
  if (response) return response;

  const tenantId = tenantConfig.tenantId || "default";

  let body: { provider?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: { code: "INVALID_JSON", message: "Invalid request body" } }, { status: 400 });
  }

  if (!body.provider) {
    return NextResponse.json({ error: { code: "MISSING_PROVIDER", message: "provider is required" } }, { status: 400 });
  }

  const result = await verifyCredential(tenantId, body.provider);
  return NextResponse.json({ data: result });
}
