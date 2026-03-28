import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { generateScript, storeScript, type ScriptFormat } from "@/lib/social-script-generator";
import type { ContentAngle, TargetEmotion } from "@/lib/social-angle-generator";
import type { Hook, HookPlatform, HookType } from "@/lib/social-hook-generator";

const VALID_FORMATS: ScriptFormat[] = ["short-video", "carousel", "thread", "article-outline"];

const AngleSchema = z.object({
  id: z.string().min(1),
  hook: z.string().min(1),
  bodyOutline: z.array(z.string()),
  cta: z.string().min(1),
  targetEmotion: z.string().min(1),
  controversyScore: z.number().min(0).max(1),
  shareabilityScore: z.number().min(0).max(1),
  topic: z.string().min(1),
  niche: z.string().min(1),
  generatedAt: z.string(),
});

const HookSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  type: z.string().min(1),
  platform: z.string().min(1),
  characterCount: z.number(),
  estimatedEngagement: z.number(),
  generatedAt: z.string(),
});

const GenerateScriptSchema = z.object({
  angle: AngleSchema,
  hook: HookSchema,
  format: z.string().min(1),
  tenantId: z.string().min(1).max(100).optional(),
});

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json(
      { data: null, error: { code: "VALIDATION_ERROR", message: "Content-Type must be application/json" }, meta: null },
      { status: 415, headers },
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "PARSE_ERROR", message: "Request body is not valid JSON" }, meta: null },
      { status: 400, headers },
    );
  }

  const parsed = GenerateScriptSchema.safeParse(rawBody);
  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => ({
      field: issue.path.join("."),
      issue: issue.message,
    }));
    return NextResponse.json(
      { data: null, error: { code: "VALIDATION_ERROR", message: "Request validation failed", details }, meta: null },
      { status: 400, headers },
    );
  }

  const { format, tenantId } = parsed.data;

  if (!VALID_FORMATS.includes(format as ScriptFormat)) {
    return NextResponse.json(
      { data: null, error: { code: "VALIDATION_ERROR", message: `Unknown format: ${format}. Must be one of: ${VALID_FORMATS.join(", ")}` }, meta: null },
      { status: 400, headers },
    );
  }

  try {
    const angle = parsed.data.angle as unknown as ContentAngle;
    const hook = parsed.data.hook as unknown as Hook;

    const script = generateScript({ angle, hook, format: format as ScriptFormat });

    if (tenantId) {
      storeScript(tenantId, script);
    }

    return NextResponse.json(
      {
        data: script,
        error: null,
        meta: { format: script.format },
      },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "GENERATION_FAILED", message: "Failed to generate script" }, meta: null },
      { status: 500, headers },
    );
  }
}
