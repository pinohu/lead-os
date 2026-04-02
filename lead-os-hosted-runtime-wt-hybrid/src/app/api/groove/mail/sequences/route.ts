import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import {
  createSequence,
  enrollInSequence,
  listSequences,
} from "@/lib/integrations/groove-adapter";

const SequenceStepSchema = z.object({
  delayHours: z.number().min(0),
  subject: z.string().min(1).max(500),
  htmlBody: z.string().min(1),
  textBody: z.string().optional(),
});

const CreateSequenceSchema = z.object({
  tenantId: z.string().min(1),
  name: z.string().min(1).max(200),
  steps: z.array(SequenceStepSchema).min(1),
});

const EnrollSchema = z.object({
  sequenceId: z.string().min(1),
  email: z.string().email(),
});

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { session, response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId") ?? session.email;

    const sequences = await listSequences(tenantId);

    return NextResponse.json(
      { data: sequences, error: null, meta: { count: sequences.length } },
      { headers },
    );
  } catch (err) {
    logger.error("groove/mail/sequences GET failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to list sequences" }, meta: null },
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

    const { tenantId, name, steps } = validation.data;
    const sequence = await createSequence(tenantId, name, steps);

    return NextResponse.json(
      { data: sequence, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    logger.error("groove/mail/sequences POST failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "CREATE_FAILED", message: "Failed to create sequence" }, meta: null },
      { status: 500, headers },
    );
  }
}

export async function PATCH(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const raw = await request.json();
    const validation = EnrollSchema.safeParse(raw);

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

    const { sequenceId, email } = validation.data;
    const enrollment = await enrollInSequence(sequenceId, email);

    return NextResponse.json(
      { data: enrollment, error: null, meta: null },
      { status: 200, headers },
    );
  } catch (err) {
    logger.error("groove/mail/sequences PATCH failed", { error: err instanceof Error ? err.message : String(err) });
    const message = err instanceof Error ? err.message : "Failed to enroll in sequence";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json(
      { data: null, error: { code: "ENROLL_FAILED", message }, meta: null },
      { status, headers },
    );
  }
}
