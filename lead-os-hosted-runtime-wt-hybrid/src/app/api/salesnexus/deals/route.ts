import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import {
  createDeal,
  listDeals,
} from "@/lib/integrations/salesnexus-adapter";

const CreateDealSchema = z.object({
  contactId: z.string().min(1),
  title: z.string().min(1),
  value: z.number().min(0),
  stage: z.string().min(1),
  probability: z.number().min(0).max(100).optional(),
  tenantId: z.string().optional(),
});

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const raw = await request.json();
    const validation = CreateDealSchema.safeParse(raw);

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

    const deal = await createDeal(validation.data);

    return NextResponse.json(
      { data: deal, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    console.error("[salesnexus/deals POST]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "CREATE_FAILED", message: "Failed to create deal" }, meta: null },
      { status: 500, headers },
    );
  }
}

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId") ?? undefined;
    const contactId = url.searchParams.get("contactId") ?? undefined;
    const status = url.searchParams.get("status") as "open" | "won" | "lost" | undefined;

    const deals = await listDeals({ tenantId, contactId, status: status || undefined });

    return NextResponse.json(
      { data: deals, error: null, meta: { total: deals.length } },
      { headers },
    );
  } catch (err) {
    console.error("[salesnexus/deals GET]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to fetch deals" }, meta: null },
      { status: 500, headers },
    );
  }
}
