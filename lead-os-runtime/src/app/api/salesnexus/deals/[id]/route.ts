import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import {
  listDeals,
  updateDeal,
} from "@/lib/integrations/salesnexus-adapter";

const UpdateDealSchema = z.object({
  title: z.string().min(1).optional(),
  value: z.number().min(0).optional(),
  stage: z.string().min(1).optional(),
  probability: z.number().min(0).max(100).optional(),
  status: z.enum(["open", "won", "lost"]).optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const deals = await listDeals();
    const deal = deals.find((d) => d.id === id);

    if (!deal) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Deal not found" }, meta: null },
        { status: 404, headers },
      );
    }

    return NextResponse.json(
      { data: deal, error: null, meta: null },
      { headers },
    );
  } catch (err) {
    logger.error("[salesnexus/deals/[id] GET]", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to fetch deal" }, meta: null },
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

  try {
    const { id } = await params;
    const raw = await request.json();
    const validation = UpdateDealSchema.safeParse(raw);

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

    const deal = await updateDeal(id, validation.data);

    return NextResponse.json(
      { data: deal, error: null, meta: null },
      { headers },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("not found")) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Deal not found" }, meta: null },
        { status: 404, headers },
      );
    }
    logger.error("[salesnexus/deals/[id] PATCH]", { error: message });
    return NextResponse.json(
      { data: null, error: { code: "UPDATE_FAILED", message: "Failed to update deal" }, meta: null },
      { status: 500, headers },
    );
  }
}
