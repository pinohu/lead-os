import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { getUsageSummary } from "@/lib/integrations/usage-billing";

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");
    const period = searchParams.get("period") ?? undefined;

    if (!tenantId) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "tenantId is required" }, meta: null },
        { status: 400, headers },
      );
    }

    const summary = await getUsageSummary(tenantId, period);

    return NextResponse.json(
      { data: { summary }, error: null, meta: null },
      { status: 200, headers },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch usage summary";
    return NextResponse.json(
      { data: null, error: { code: "USAGE_SUMMARY_FAILED", message }, meta: null },
      { status: 500, headers },
    );
  }
}
