import { NextResponse } from "next/server";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { getSequence, advanceSequence, pauseSequence, resumeSequence } from "@/lib/integrations/autobound-adapter";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  const { id } = await params;
  const sequence = getSequence(id);

  if (!sequence) {
    return NextResponse.json(
      { data: null, error: { code: "NOT_FOUND", message: `Sequence not found: ${id}` }, meta: null },
      { status: 404 },
    );
  }

  return NextResponse.json({ data: sequence, error: null, meta: null });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "INVALID_JSON", message: "Request body must be valid JSON" }, meta: null },
      { status: 400 },
    );
  }

  const action = body.action;
  if (typeof action !== "string" || !["advance", "pause", "resume"].includes(action)) {
    return NextResponse.json(
      { data: null, error: { code: "VALIDATION_ERROR", message: "action must be one of: advance, pause, resume" }, meta: null },
      { status: 400 },
    );
  }

  let result;
  try {
    if (action === "advance") {
      result = await advanceSequence(id);
    } else if (action === "pause") {
      result = await pauseSequence(id);
    } else {
      result = await resumeSequence(id);
    }
  } catch (err) {
    console.error("[autobound-sequence-action]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "ACTION_FAILED", message: `Failed to ${action} sequence` }, meta: null },
      { status: 500 },
    );
  }

  if (!result) {
    return NextResponse.json(
      { data: null, error: { code: "NOT_FOUND", message: `Sequence not found: ${id}` }, meta: null },
      { status: 404 },
    );
  }

  return NextResponse.json({
    data: result,
    error: null,
    meta: { action, status: result.status, currentStep: result.currentStep },
  });
}
