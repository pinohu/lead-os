import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { generateSequence, listSequences, autoboundResult } from "@/lib/integrations/autobound-adapter";
import type { GenerateSequenceInput } from "@/lib/integrations/autobound-adapter";

export async function POST(request: Request) {
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "INVALID_JSON", message: "Request body must be valid JSON" }, meta: null },
      { status: 400 },
    );
  }

  const prospect = body.prospect as GenerateSequenceInput["prospect"] | undefined;
  if (!prospect || typeof prospect.email !== "string") {
    return NextResponse.json(
      { data: null, error: { code: "VALIDATION_ERROR", message: "prospect.email is required" }, meta: null },
      { status: 400 },
    );
  }

  if (typeof body.senderName !== "string" || typeof body.senderCompany !== "string" || typeof body.valueProposition !== "string") {
    return NextResponse.json(
      { data: null, error: { code: "VALIDATION_ERROR", message: "senderName, senderCompany, and valueProposition are required strings" }, meta: null },
      { status: 400 },
    );
  }

  const steps = typeof body.steps === "number" && body.steps > 0 ? body.steps : 3;
  const delayDays = Array.isArray(body.delayDays) ? (body.delayDays as number[]) : [0, 3, 7];
  const tenantId = typeof body.tenantId === "string" ? body.tenantId : undefined;

  try {
    const sequence = await generateSequence({
      prospect,
      senderName: body.senderName as string,
      senderCompany: body.senderCompany as string,
      valueProposition: body.valueProposition as string,
      steps,
      delayDays,
      tenantId,
    });

    const result = autoboundResult("sequence", `Created ${steps}-step sequence for ${prospect.email}`);

    return NextResponse.json(
      {
        data: { sequence, providerResult: result },
        error: null,
        meta: { steps: sequence.emails.length },
      },
      { status: 201 },
    );
  } catch (err) {
    logger.error("autobound-sequences failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "GENERATION_FAILED", message: "Failed to generate email sequence" }, meta: null },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenantId") ?? undefined;

  const sequences = listSequences(tenantId);

  return NextResponse.json({
    data: sequences,
    error: null,
    meta: { count: sequences.length },
  });
}
