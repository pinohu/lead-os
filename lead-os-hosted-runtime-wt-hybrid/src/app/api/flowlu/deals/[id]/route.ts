import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { moveDealToStage, updateDealStatus } from "@/lib/integrations/flowlu-adapter";

const PatchDealSchema = z.union([
  z.object({
    action: z.literal("move"),
    stageId: z.string().min(1),
    stageName: z.string().min(1),
  }),
  z.object({
    action: z.literal("close"),
    status: z.enum(["won", "lost"]),
  }),
]);

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
    const validation = PatchDealSchema.safeParse(raw);

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

    const body = validation.data;
    let deal;

    if (body.action === "move") {
      deal = await moveDealToStage(id, body.stageId, body.stageName);
    } else {
      deal = await updateDealStatus(id, body.status);
    }

    if (!deal) {
      return NextResponse.json(
        {
          data: null,
          error: { code: "NOT_FOUND", message: `Deal ${id} not found` },
          meta: null,
        },
        { status: 404, headers },
      );
    }

    return NextResponse.json(
      { data: deal, error: null, meta: null },
      { headers },
    );
  } catch (err) {
    console.error("[flowlu/deals/id PATCH]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "UPDATE_FAILED", message: "Failed to update deal" }, meta: null },
      { status: 500, headers },
    );
  }
}
