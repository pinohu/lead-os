import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { verifyCredential } from "@/lib/credentials-vault";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { tenantConfig } from "@/lib/tenant";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  const { provider } = await params;
  const tenantId = tenantConfig.tenantId || "default";

  try {
    const result = await verifyCredential(tenantId, provider);
    return NextResponse.json(
      { data: result, error: null, meta: null },
      { headers },
    );
  } catch (err) {
    return NextResponse.json(
      { data: null, error: { code: "VERIFY_FAILED", message: err instanceof Error ? err.message : "Verification failed" }, meta: null },
      { status: 500, headers },
    );
  }
}
