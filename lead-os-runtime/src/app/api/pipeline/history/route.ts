import { NextResponse } from "next/server";
import { getPipelineHistory } from "@/lib/revenue-pipeline";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenantId");

  if (!tenantId) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "tenantId query parameter is required" } },
      { status: 400 },
    );
  }

  const limit = parseInt(searchParams.get("limit") ?? "50", 10);
  const history = getPipelineHistory(tenantId, limit);

  return NextResponse.json({ data: history, meta: { count: history.length } });
}
