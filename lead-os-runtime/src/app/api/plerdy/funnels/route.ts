import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { createConversionFunnel, _getPlerdyStoreForTesting } from "@/lib/integrations/plerdy-adapter";
import type { ConversionFunnel } from "@/lib/integrations/plerdy-adapter";

const FunnelStepSchema = z.object({
  url: z.string().min(1),
  name: z.string().min(1).max(200),
});

const CreateFunnelSchema = z.object({
  name: z.string().min(1).max(200),
  steps: z.array(FunnelStepSchema).min(1).max(50),
  tenantId: z.string().min(1).optional(),
});

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const raw = await request.json();
    const validation = CreateFunnelSchema.safeParse(raw);

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

    const funnel = await createConversionFunnel(validation.data);

    return NextResponse.json(
      { data: funnel, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    logger.error("plerdy/funnels POST failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "CREATE_FAILED", message: "Failed to create funnel" }, meta: null },
      { status: 500, headers },
    );
  }
}

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { session, response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId") ?? undefined;

    const store = _getPlerdyStoreForTesting();
    const funnels: ConversionFunnel[] = [];
    for (const entry of store.values()) {
      if (entry.type !== "funnel") continue;
      const funnel = entry.payload as unknown as ConversionFunnel;
      if (tenantId && funnel.tenantId !== tenantId) continue;
      funnels.push(funnel);
    }

    return NextResponse.json(
      { data: funnels, error: null, meta: { count: funnels.length } },
      { headers },
    );
  } catch (err) {
    logger.error("plerdy/funnels GET failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to fetch funnels" }, meta: null },
      { status: 500, headers },
    );
  }
}
