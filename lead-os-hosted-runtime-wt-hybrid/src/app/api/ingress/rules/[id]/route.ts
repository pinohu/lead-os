import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { updateIngressRule, deleteIngressRule } from "@/lib/ingress-engine";

const MAX_ID_LENGTH = 64;
const MAX_FUNNEL_TYPE_LENGTH = 100;
const MAX_SCORE_BOOST = 30;
const MAX_PRIORITY = 1000;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Content-Type must be application/json" }, meta: null },
        { status: 415, headers },
      );
    }

    const { id } = await params;
    if (!id || id.length > MAX_ID_LENGTH) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Ingress rule not found" }, meta: null },
        { status: 404, headers },
      );
    }

    const body = await request.json();
    const patch: Record<string, unknown> = {};

    if (body.funnelType !== undefined) {
      if (typeof body.funnelType !== "string" || body.funnelType.length > MAX_FUNNEL_TYPE_LENGTH) {
        return NextResponse.json(
          { data: null, error: { code: "VALIDATION_ERROR", message: "Invalid funnelType" }, meta: null },
          { status: 400, headers },
        );
      }
      patch.funnelType = body.funnelType.trim();
    }

    if (body.initialScoreBoost !== undefined) {
      patch.initialScoreBoost = Math.max(0, Math.min(MAX_SCORE_BOOST, Number(body.initialScoreBoost) || 0));
    }

    if (body.priority !== undefined) {
      patch.priority = Math.max(0, Math.min(MAX_PRIORITY, Number(body.priority) || 0));
    }

    if (body.active !== undefined) {
      patch.active = Boolean(body.active);
    }

    if (body.intentLevel !== undefined) {
      const valid = new Set(["high", "medium", "low"]);
      if (!valid.has(body.intentLevel)) {
        return NextResponse.json(
          { data: null, error: { code: "VALIDATION_ERROR", message: "intentLevel must be high, medium, or low" }, meta: null },
          { status: 400, headers },
        );
      }
      patch.intentLevel = body.intentLevel;
    }

    const updated = await updateIngressRule(id, patch);
    if (!updated) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Ingress rule not found" }, meta: null },
        { status: 404, headers },
      );
    }

    return NextResponse.json(
      { data: updated, error: null, meta: null },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "UPDATE_FAILED", message: "Failed to update ingress rule" }, meta: null },
      { status: 400, headers },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  try {
    const { id } = await params;
    if (!id || id.length > MAX_ID_LENGTH) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Ingress rule not found" }, meta: null },
        { status: 404, headers },
      );
    }

    const deleted = await deleteIngressRule(id);
    if (!deleted) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Ingress rule not found" }, meta: null },
        { status: 404, headers },
      );
    }

    return new NextResponse(null, { status: 204, headers });
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "DELETE_FAILED", message: "Failed to delete ingress rule" }, meta: null },
      { status: 500, headers },
    );
  }
}
