import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { getEnabledCapabilities } from "@/lib/credentials-vault";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { tenantConfig } from "@/lib/tenant";

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  const tenantId = tenantConfig.tenantId || "default";
  const capabilities = getEnabledCapabilities(tenantId);
  return NextResponse.json(
    { data: capabilities, error: null, meta: { total: capabilities.length } },
    { headers },
  );
}
