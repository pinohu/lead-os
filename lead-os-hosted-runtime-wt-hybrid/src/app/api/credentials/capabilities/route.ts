import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { getEnabledCapabilities } from "@/lib/credentials-vault";

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenantId");

  if (!tenantId) {
    return NextResponse.json(
      { data: null, error: { code: "VALIDATION_ERROR", message: "tenantId query parameter is required" }, meta: null },
      { status: 400, headers },
    );
  }

  const capabilities = getEnabledCapabilities(tenantId);
  return NextResponse.json(
    { data: capabilities, error: null, meta: { total: capabilities.length } },
    { headers },
  );
}
