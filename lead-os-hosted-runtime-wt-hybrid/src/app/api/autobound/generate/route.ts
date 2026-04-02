import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { generateEmail, autoboundResult } from "@/lib/integrations/autobound-adapter";
import type { GenerateEmailInput } from "@/lib/integrations/autobound-adapter";

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

  const prospect = body.prospect as GenerateEmailInput["prospect"] | undefined;
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

  const tone = typeof body.tone === "string" && ["professional", "casual", "urgent"].includes(body.tone)
    ? (body.tone as "professional" | "casual" | "urgent")
    : undefined;

  const numberOfVariants = typeof body.numberOfVariants === "number" && body.numberOfVariants > 0
    ? body.numberOfVariants
    : undefined;

  const tenantId = typeof body.tenantId === "string" ? body.tenantId : undefined;

  try {
    const emails = await generateEmail({
      prospect,
      senderName: body.senderName as string,
      senderCompany: body.senderCompany as string,
      valueProposition: body.valueProposition as string,
      tone,
      numberOfVariants,
      tenantId,
    });

    const result = autoboundResult("generate", `Generated ${emails.length} variant(s) for ${prospect.email}`);

    return NextResponse.json({
      data: { emails, providerResult: result },
      error: null,
      meta: { count: emails.length },
    });
  } catch (err) {
    logger.error("autobound-generate failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "GENERATION_FAILED", message: "Failed to generate personalized email" }, meta: null },
      { status: 500 },
    );
  }
}
