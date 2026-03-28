import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { getUsage, getCurrentPeriod } from "@/lib/billing-store";

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId");

    if (!tenantId || tenantId.trim().length === 0) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "tenantId query parameter is required" }, meta: null },
        { status: 400, headers },
      );
    }

    const period = url.searchParams.get("period") ?? getCurrentPeriod();
    const usage = await getUsage(tenantId.trim(), period);

    const record = usage ?? {
      tenantId: tenantId.trim(),
      period,
      leads: 0,
      emails: 0,
      sms: 0,
      whatsapp: 0,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(
      { data: record, error: null, meta: { period } },
      { status: 200, headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "USAGE_FETCH_FAILED", message: "Failed to fetch usage data" }, meta: null },
      { status: 500, headers },
    );
  }
}
