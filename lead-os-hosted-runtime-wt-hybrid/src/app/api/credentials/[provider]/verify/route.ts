import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { verifyCredential } from "@/lib/credentials-vault";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const { provider } = await params;
  const { searchParams } = new URL(request.url);

  let tenantId = searchParams.get("tenantId");
  if (!tenantId) {
    try {
      const body = await request.json();
      tenantId = body.tenantId;
    } catch {
      // no body
    }
  }

  if (!tenantId) {
    return NextResponse.json(
      { data: null, error: { code: "VALIDATION_ERROR", message: "tenantId is required (query param or body)" }, meta: null },
      { status: 400, headers },
    );
  }

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
