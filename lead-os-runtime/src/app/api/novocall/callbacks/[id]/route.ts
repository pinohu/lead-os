import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import {
  getCallbackRequest,
  updateCallbackStatus,
} from "@/lib/integrations/novocall-adapter";

const UpdateStatusSchema = z.object({
  status: z.enum(["pending", "scheduled", "connected", "completed", "missed", "cancelled"]),
  duration: z.number().int().min(0).optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  const { id } = await params;

  try {
    const callback = await getCallbackRequest(id);

    if (!callback) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: `Callback ${id} not found` }, meta: null },
        { status: 404, headers },
      );
    }

    return NextResponse.json(
      { data: callback, error: null, meta: null },
      { headers },
    );
  } catch (err) {
    logger.error("[novocall/callbacks/[id] GET]", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to fetch callback" }, meta: null },
      { status: 500, headers },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  const { id } = await params;

  try {
    const raw = await request.json();
    const validation = UpdateStatusSchema.safeParse(raw);

    if (!validation.success) {
      return NextResponse.json(
        {
          data: null,
          error: { code: "VALIDATION_ERROR", message: "Invalid input", details: validation.error.issues },
          meta: null,
        },
        { status: 422, headers },
      );
    }

    const updated = await updateCallbackStatus(id, validation.data.status, validation.data.duration);
    return NextResponse.json(
      { data: updated, error: null, meta: null },
      { headers },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update callback status";
    const status = message.includes("not found") ? 404 : 500;
    logger.error("[novocall/callbacks/[id] PATCH]", { error: message });
    return NextResponse.json(
      { data: null, error: { code: "UPDATE_FAILED", message }, meta: null },
      { status, headers },
    );
  }
}
