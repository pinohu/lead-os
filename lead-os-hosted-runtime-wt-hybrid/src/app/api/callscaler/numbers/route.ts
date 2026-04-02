import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import {
  provisionNumber,
  listNumbers,
} from "@/lib/integrations/callscaler-adapter";

const ProvisionSchema = z.object({
  forwardTo: z.string().min(1),
  source: z.string().min(1),
  campaign: z.string().optional(),
  areaCode: z.string().regex(/^\d{3}$/).optional(),
  tenantId: z.string().optional(),
});

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const raw = await request.json();
    const validation = ProvisionSchema.safeParse(raw);

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

    const number = await provisionNumber(validation.data);
    return NextResponse.json(
      { data: number, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    logger.error("callscaler/numbers POST failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "PROVISION_FAILED", message: "Failed to provision tracking number" }, meta: null },
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

    const numbers = await listNumbers(tenantId);
    return NextResponse.json(
      { data: numbers, error: null, meta: { count: numbers.length } },
      { headers },
    );
  } catch (err) {
    logger.error("callscaler/numbers GET failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "LIST_FAILED", message: "Failed to list tracking numbers" }, meta: null },
      { status: 500, headers },
    );
  }
}
