import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { getCredentialPublic, deleteCredential } from "@/lib/credentials-vault";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const { provider } = await params;
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenantId");

  if (!tenantId) {
    return NextResponse.json(
      { data: null, error: { code: "VALIDATION_ERROR", message: "tenantId query parameter is required" }, meta: null },
      { status: 400, headers },
    );
  }

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
  const { provider } = await params;
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenantId");

  if (!tenantId) {
    return NextResponse.json(
      { data: null, error: { code: "VALIDATION_ERROR", message: "tenantId query parameter is required" }, meta: null },
      { status: 400, headers },
    );
  }

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
