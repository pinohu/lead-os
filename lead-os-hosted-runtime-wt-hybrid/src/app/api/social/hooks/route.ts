import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { generateHooks, storeHooks, type HookPlatform, type HookType } from "@/lib/social-hook-generator";

const VALID_PLATFORMS: HookPlatform[] = ["tiktok", "instagram", "youtube", "linkedin", "x", "threads"];
const VALID_HOOK_TYPES: HookType[] = ["question", "statistic", "story", "contrarian", "curiosity-gap", "fear", "desire"];

const GenerateHooksSchema = z.object({
  topic: z.string().min(1).max(500),
  niche: z.string().min(1).max(200),
  platforms: z.array(z.string()).min(1).max(6),
  hookTypes: z.array(z.string()).min(1).max(7).optional(),
  count: z.number().int().min(1).max(20).optional(),
  tenantId: z.string().min(1).max(100).optional(),
});

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

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

  const parsed = GenerateHooksSchema.safeParse(rawBody);
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

  const { topic, niche, platforms: rawPlatforms, hookTypes: rawHookTypes, count, tenantId } = parsed.data;

  const invalidPlatforms = rawPlatforms.filter((p) => !VALID_PLATFORMS.includes(p as HookPlatform));
  if (invalidPlatforms.length > 0) {
    return NextResponse.json(
      { data: null, error: { code: "VALIDATION_ERROR", message: `Unknown platforms: ${invalidPlatforms.join(", ")}` }, meta: null },
      { status: 400, headers },
    );
  }

  if (rawHookTypes) {
    const invalidTypes = rawHookTypes.filter((t) => !VALID_HOOK_TYPES.includes(t as HookType));
    if (invalidTypes.length > 0) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: `Unknown hook types: ${invalidTypes.join(", ")}` }, meta: null },
        { status: 400, headers },
      );
    }
  }

  try {
    const hooks = generateHooks({
      topic,
      niche,
      platforms: rawPlatforms as HookPlatform[],
      hookTypes: rawHookTypes as HookType[] | undefined,
      count,
    });

    if (tenantId) {
      storeHooks(tenantId, hooks);
    }

    return NextResponse.json(
      {
        data: hooks,
        error: null,
        meta: { topic, niche, hookCount: hooks.length, platforms: rawPlatforms },
      },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "GENERATION_FAILED", message: "Failed to generate hooks" }, meta: null },
      { status: 500, headers },
    );
  }
}
