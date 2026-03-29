import { NextResponse } from "next/server";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { generateForProspectPipeline, autoboundResult } from "@/lib/integrations/autobound-adapter";
import type { ProspectInput } from "@/lib/integrations/autobound-adapter";

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

  const prospects = body.prospects as ProspectInput[] | undefined;
  if (!Array.isArray(prospects) || prospects.length === 0) {
    return NextResponse.json(
      { data: null, error: { code: "VALIDATION_ERROR", message: "prospects must be a non-empty array" }, meta: null },
      { status: 400 },
    );
  }

  for (const p of prospects) {
    if (typeof p.email !== "string") {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Each prospect must have an email string" }, meta: null },
        { status: 400 },
      );
    }
  }

  const senderInfo = body.senderInfo as { name?: string; company?: string; valueProposition?: string } | undefined;
  if (
    !senderInfo ||
    typeof senderInfo.name !== "string" ||
    typeof senderInfo.company !== "string" ||
    typeof senderInfo.valueProposition !== "string"
  ) {
    return NextResponse.json(
      { data: null, error: { code: "VALIDATION_ERROR", message: "senderInfo with name, company, and valueProposition is required" }, meta: null },
      { status: 400 },
    );
  }

  const tenantId = typeof body.tenantId === "string" ? body.tenantId : undefined;

  try {
    const result = await generateForProspectPipeline(
      prospects,
      { name: senderInfo.name, company: senderInfo.company, valueProposition: senderInfo.valueProposition },
      tenantId,
    );

    const providerResult = autoboundResult(
      "pipeline",
      `Generated ${result.generated} emails across ${result.sequences.length} sequences`,
    );

    return NextResponse.json({
      data: { ...result, providerResult },
      error: null,
      meta: { prospectCount: prospects.length },
    });
  } catch (err) {
    console.error("[autobound-pipeline]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "PIPELINE_FAILED", message: "Failed to generate pipeline emails" }, meta: null },
      { status: 500 },
    );
  }
}
