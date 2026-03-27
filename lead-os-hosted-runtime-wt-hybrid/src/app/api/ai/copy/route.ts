import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { generateCopy, type CopyRequest } from "@/lib/ai-copywriter";

const MAX_STRING_LENGTH = 500;
const MAX_CONTEXT_KEYS = 20;

const VALID_TYPES = new Set([
  "email-subject", "email-body", "landing-headline", "cta",
  "assessment-question", "nurture-sequence", "social-proof", "ad-copy",
]);

const VALID_TONES = new Set(["professional", "friendly", "urgent", "educational"]);

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Content-Type must be application/json" }, meta: null },
        { status: 415, headers },
      );
    }

    const body = await request.json() as Record<string, unknown>;

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Request body must be a JSON object" }, meta: null },
        { status: 400, headers },
      );
    }

    if (typeof body.type !== "string" || !VALID_TYPES.has(body.type)) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: `type must be one of: ${[...VALID_TYPES].join(", ")}` }, meta: null },
        { status: 400, headers },
      );
    }

    if (typeof body.niche !== "string" || body.niche.length === 0 || body.niche.length > MAX_STRING_LENGTH) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "niche is required" }, meta: null },
        { status: 400, headers },
      );
    }

    if (typeof body.brandName !== "string" || body.brandName.length === 0 || body.brandName.length > MAX_STRING_LENGTH) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "brandName is required" }, meta: null },
        { status: 400, headers },
      );
    }

    const context: Record<string, unknown> = {};
    if (body.context && typeof body.context === "object" && !Array.isArray(body.context)) {
      const rawContext = body.context as Record<string, unknown>;
      const keys = Object.keys(rawContext).slice(0, MAX_CONTEXT_KEYS);
      for (const key of keys) {
        context[key] = rawContext[key];
      }
    }

    const tone = typeof body.tone === "string" && VALID_TONES.has(body.tone)
      ? body.tone as CopyRequest["tone"]
      : undefined;

    const maxLength = typeof body.maxLength === "number" && isFinite(body.maxLength)
      ? Math.max(10, Math.min(5000, body.maxLength))
      : undefined;

    const copyRequest: CopyRequest = {
      type: body.type as CopyRequest["type"],
      niche: body.niche as string,
      brandName: body.brandName as string,
      context,
      tone,
      maxLength,
    };

    const result = await generateCopy(copyRequest);

    return NextResponse.json(
      {
        data: result,
        error: null,
        meta: { generatedAt: new Date().toISOString() },
      },
      { headers },
    );
  } catch (err) {
    return NextResponse.json(
      {
        data: null,
        error: { code: "COPY_GENERATION_FAILED", message: err instanceof Error ? err.message : "Copy generation failed" },
        meta: null,
      },
      { status: 500, headers },
    );
  }
}
