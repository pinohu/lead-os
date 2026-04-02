import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import {
  createDripSequence,
  listSequences,
} from "@/lib/integrations/salesnexus-adapter";

const CreateSequenceSchema = z.object({
  name: z.string().min(1),
  steps: z.array(z.object({
    delayDays: z.number().min(0),
    subject: z.string().min(1),
    body: z.string().min(1),
  })),
  tenantId: z.string().optional(),
});

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const raw = await request.json();
    const validation = CreateSequenceSchema.safeParse(raw);

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

    const sequence = await createDripSequence(validation.data);

    return NextResponse.json(
      { data: sequence, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    logger.error("salesnexus/sequences POST failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "CREATE_FAILED", message: "Failed to create sequence" }, meta: null },
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

    const sequences = await listSequences(tenantId);

    return NextResponse.json(
      { data: sequences, error: null, meta: { total: sequences.length } },
      { headers },
    );
  } catch (err) {
    logger.error("salesnexus/sequences GET failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to fetch sequences" }, meta: null },
      { status: 500, headers },
    );
  }
}
