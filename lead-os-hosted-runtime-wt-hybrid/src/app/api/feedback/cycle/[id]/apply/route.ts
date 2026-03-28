import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { applyPendingAdjustments } from "@/lib/feedback-engine";
import { tenantConfig } from "@/lib/tenant";

const MAX_ID_LENGTH = 64;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  try {
    const { id } = await params;

    if (!id || id.length > MAX_ID_LENGTH) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Feedback cycle not found" }, meta: null },
        { status: 404, headers },
      );
    }

    const tenantId = tenantConfig.tenantId;
    const cycle = await applyPendingAdjustments(tenantId, id);

    if (!cycle) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Feedback cycle not found" }, meta: null },
        { status: 404, headers },
      );
    }

    return NextResponse.json(
      { data: cycle, error: null, meta: { appliedAt: cycle.appliedAt } },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "APPLY_FAILED", message: "Failed to apply adjustments" }, meta: null },
      { status: 500, headers },
    );
  }
}
