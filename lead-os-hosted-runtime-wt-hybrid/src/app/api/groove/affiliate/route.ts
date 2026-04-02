import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import {
  createAffiliateProgram,
  listAffiliatePrograms,
} from "@/lib/integrations/groove-adapter";

const CreateProgramSchema = z.object({
  tenantId: z.string().min(1),
  name: z.string().min(1).max(200),
  commissionType: z.enum(["percentage", "fixed"]),
  commissionRate: z.number().positive(),
  cookieDuration: z.number().int().positive().optional(),
  payoutMinimum: z.number().positive().optional(),
});

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { session, response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId") ?? session.email;

    const programs = await listAffiliatePrograms(tenantId);

    return NextResponse.json(
      { data: programs, error: null, meta: { count: programs.length } },
      { headers },
    );
  } catch (err) {
    logger.error("groove/affiliate GET failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to list affiliate programs" }, meta: null },
      { status: 500, headers },
    );
  }
}

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const raw = await request.json();
    const validation = CreateProgramSchema.safeParse(raw);

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

    const { tenantId, name, commissionType, commissionRate, cookieDuration, payoutMinimum } = validation.data;
    const program = await createAffiliateProgram(tenantId, name, commissionType, commissionRate, {
      cookieDuration,
      payoutMinimum,
    });

    return NextResponse.json(
      { data: program, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    logger.error("groove/affiliate POST failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "CREATE_FAILED", message: "Failed to create affiliate program" }, meta: null },
      { status: 500, headers },
    );
  }
}
