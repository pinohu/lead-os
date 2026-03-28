import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { approveDecision, getDecisionById } from "@/lib/strategy-engine";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  try {
    const { id } = await params;

    if (!id || id.length > 200) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Valid decision id is required" }, meta: null },
        { status: 400, headers },
      );
    }

    const existing = getDecisionById(id);
    if (!existing) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Decision not found" }, meta: null },
        { status: 404, headers },
      );
    }

    if (existing.status !== "proposed") {
      return NextResponse.json(
        { data: null, error: { code: "INVALID_STATE", message: `Decision cannot be approved from status '${existing.status}'` }, meta: null },
        { status: 409, headers },
      );
    }

    const decision = await approveDecision(id);

    return NextResponse.json(
      {
        data: { decision },
        error: null,
        meta: null,
      },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "APPROVE_FAILED", message: "Failed to approve decision" }, meta: null },
      { status: 500, headers },
    );
  }
}
