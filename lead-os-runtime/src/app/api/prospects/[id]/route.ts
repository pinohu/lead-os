import { NextResponse } from "next/server";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { getProspect, updateProspect, removeProspect, type ProspectStatus } from "@/lib/prospect-store";

type RouteContext = { params: Promise<{ id: string }> };

const VALID_STATUSES: ProspectStatus[] = ["new", "contacted", "engaged", "converted", "rejected", "deferred"];

export async function GET(request: Request, context: RouteContext) {
  const auth = await requireOperatorApiSession(request);
  if (auth.response) {
    return auth.response;
  }

  const { id } = await context.params;
  const prospect = await getProspect(id);

  if (!prospect) {
    return NextResponse.json(
      { data: null, error: { code: "NOT_FOUND", message: "Prospect not found", details: [] }, meta: null },
      { status: 404 },
    );
  }

  return NextResponse.json({ data: prospect, error: null, meta: null });
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireOperatorApiSession(request);
  if (auth.response) {
    return auth.response;
  }

  const { id } = await context.params;
  const prospect = await getProspect(id);

  if (!prospect) {
    return NextResponse.json(
      { data: null, error: { code: "NOT_FOUND", message: "Prospect not found", details: [] }, meta: null },
      { status: 404 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "INVALID_JSON", message: "Request body must be valid JSON", details: [] }, meta: null },
      { status: 400 },
    );
  }

  const input = body as { status?: unknown; notes?: unknown; lastContactedAt?: unknown };

  if (input.status !== undefined) {
    if (typeof input.status !== "string" || !VALID_STATUSES.includes(input.status as ProspectStatus)) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_FAILED", message: `status must be one of: ${VALID_STATUSES.join(", ")}`, details: [{ field: "status", issue: "Invalid status value" }] }, meta: null },
        { status: 400 },
      );
    }
    prospect.status = input.status as ProspectStatus;
  }

  if (input.notes !== undefined && typeof input.notes === "string") {
    prospect.notes = input.notes;
  }

  if (input.lastContactedAt !== undefined) {
    prospect.lastContactedAt = new Date().toISOString();
    prospect.contactAttempts += 1;
  }

  const updated = await updateProspect(prospect);

  return NextResponse.json({ data: updated, error: null, meta: null });
}

export async function DELETE(request: Request, context: RouteContext) {
  const auth = await requireOperatorApiSession(request);
  if (auth.response) {
    return auth.response;
  }

  const { id } = await context.params;
  const prospect = await getProspect(id);

  if (!prospect) {
    return NextResponse.json(
      { data: null, error: { code: "NOT_FOUND", message: "Prospect not found", details: [] }, meta: null },
      { status: 404 },
    );
  }

  await removeProspect(id);

  return NextResponse.json({ data: { deleted: true }, error: null, meta: null });
}
