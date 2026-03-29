import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { synthesizeLearnings } from "@/lib/content-copilot";

const SynthesizeSchema = z.object({
  tenantId: z.string().min(1).max(200),
  niche: z.string().min(1).max(200),
});

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId");
    const niche = url.searchParams.get("niche") ?? "general";

    if (!tenantId || tenantId.trim().length === 0) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "tenantId is required" }, meta: null },
        { status: 400, headers },
      );
    }

    const learning = await synthesizeLearnings(tenantId, niche);

    return NextResponse.json(
      {
        data: learning,
        error: null,
        meta: {
          winningPatternCount: learning.learnings.winningPatterns.length,
          losingPatternCount: learning.learnings.losingPatterns.length,
        },
      },
      { headers },
    );
  } catch (err) {
    console.error("[content-copilot/learnings]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      {
        data: null,
        error: { code: "LEARNINGS_FAILED", message: "Failed to retrieve learnings" },
        meta: null,
      },
      { status: 500, headers },
    );
  }
}

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  try {
    const raw = await request.json();
    const validation = SynthesizeSchema.safeParse(raw);

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

    const { tenantId, niche } = validation.data;
    const learning = await synthesizeLearnings(tenantId, niche);

    return NextResponse.json(
      {
        data: learning,
        error: null,
        meta: {
          winningPatternCount: learning.learnings.winningPatterns.length,
          losingPatternCount: learning.learnings.losingPatterns.length,
        },
      },
      { status: 201, headers },
    );
  } catch (err) {
    console.error("[content-copilot/learnings]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      {
        data: null,
        error: { code: "SYNTHESIS_FAILED", message: "Failed to synthesize learnings" },
        meta: null,
      },
      { status: 500, headers },
    );
  }
}
