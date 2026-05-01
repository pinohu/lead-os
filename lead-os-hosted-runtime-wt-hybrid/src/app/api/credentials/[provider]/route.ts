import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { getCredentialPublic, deleteCredential } from "@/lib/credentials-vault";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { tenantConfig } from "@/lib/tenant";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  const { provider } = await params;
  const tenantId = tenantConfig.tenantId || "default";

  const credential = getCredentialPublic(tenantId, provider);
  if (!credential) {
    return NextResponse.json(
      { data: null, error: { code: "NOT_FOUND", message: `Credential not found for provider: ${provider}` }, meta: null },
      { status: 404, headers },
    );
  }

  return NextResponse.json(
    { data: credential, error: null, meta: null },
    { headers },
  );
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  const { provider } = await params;
  const tenantId = tenantConfig.tenantId || "default";

  const deleted = deleteCredential(tenantId, provider);
  if (!deleted) {
    return NextResponse.json(
      { data: null, error: { code: "NOT_FOUND", message: `Credential not found for provider: ${provider}` }, meta: null },
      { status: 404, headers },
    );
  }

  return NextResponse.json(
    { data: { deleted: true, provider }, error: null, meta: null },
    { headers },
  );
}
