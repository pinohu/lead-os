import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import {
  startWelcomeSequence,
  listWelcomeSequences,
} from "@/lib/welcome-sequence";

export const dynamic = "force-dynamic";

const StartSequenceSchema = z.object({
  tenantId: z.string().min(1).max(200),
  email: z.string().email().max(500),
  brandName: z.string().min(1).max(200),
});

/**
 * GET /api/welcome-sequence
 *
 * Lists all welcome sequences. Requires operator auth.
 */
export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const auth = await requireOperatorApiSession(request);
  if (auth.response) {
    return auth.response;
  }

  try {
    const sequences = listWelcomeSequences();

    return NextResponse.json(
      { data: sequences, error: null, meta: { count: sequences.length } },
      { headers },
    );
  } catch (err) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "FETCH_FAILED",
          message: err instanceof Error ? err.message : "Failed to list welcome sequences",
        },
        meta: null,
      },
      { status: 500, headers },
    );
  }
}

/**
 * POST /api/welcome-sequence
 *
 * Starts a welcome sequence for a tenant. Requires operator auth.
 * Body: { tenantId, email, brandName }
 */
export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const auth = await requireOperatorApiSession(request);
  if (auth.response) {
    return auth.response;
  }

  try {
    const raw = await request.json();
    const validation = StartSequenceSchema.safeParse(raw);

    if (!validation.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid welcome sequence payload",
            details: validation.error.issues,
          },
          meta: null,
        },
        { status: 400, headers },
      );
    }

    const { tenantId, email, brandName } = validation.data;
    const state = await startWelcomeSequence(tenantId, email, brandName);

    return NextResponse.json(
      { data: state, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "START_FAILED",
          message: err instanceof Error ? err.message : "Failed to start welcome sequence",
        },
        meta: null,
      },
      { status: 500, headers },
    );
  }
}
