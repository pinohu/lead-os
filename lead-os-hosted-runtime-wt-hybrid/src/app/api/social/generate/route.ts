import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import {
  generateContentBatch,
  splitViralAndConversion,
  type Platform,
  type ContentType,
} from "@/lib/social-asset-engine";

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const VALID_PLATFORMS = new Set<Platform>([
  "tiktok",
  "instagram-reels",
  "youtube-shorts",
  "youtube-long",
  "linkedin",
  "x",
  "facebook",
]);

const GenerateRequestSchema = z.object({
  topic: z.string().min(1).max(500),
  niche: z.string().min(1).max(200),
  platforms: z.array(z.string()).min(1).max(7),
  type: z.enum(["viral", "conversion", "both"]).optional().default("both"),
  tenantId: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

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
      {
        data: null,
        error: { code: "VALIDATION_ERROR", message: "Content-Type must be application/json" },
        meta: null,
      },
      { status: 415, headers },
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      {
        data: null,
        error: { code: "PARSE_ERROR", message: "Request body is not valid JSON" },
        meta: null,
      },
      { status: 400, headers },
    );
  }

  const parsed = GenerateRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => ({
      field: issue.path.join("."),
      issue: issue.message,
    }));
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed",
          details,
        },
        meta: null,
      },
      { status: 400, headers },
    );
  }

  const { topic, niche, platforms: rawPlatforms, type, tenantId } = parsed.data;

  const unknownPlatforms = rawPlatforms.filter((p) => !VALID_PLATFORMS.has(p as Platform));
  if (unknownPlatforms.length > 0) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "VALIDATION_ERROR",
          message: `Unknown platforms: ${unknownPlatforms.join(", ")}`,
          details: [{ field: "platforms", issue: `Must be one of: ${[...VALID_PLATFORMS].join(", ")}` }],
        },
        meta: null,
      },
      { status: 400, headers },
    );
  }

  const validPlatforms = rawPlatforms as Platform[];

  try {
    const batch = generateContentBatch(topic, niche, validPlatforms, tenantId ?? "default");

    let filteredAssets = batch.assets;
    if (type !== "both") {
      const targetType: ContentType = type;
      const split = splitViralAndConversion(batch);
      filteredAssets = targetType === "viral" ? split.viral : split.conversion;
    }

    const responseData = {
      ...batch,
      assets: filteredAssets,
    };

    return NextResponse.json(
      {
        data: responseData,
        error: null,
        meta: {
          topic,
          niche,
          platforms: validPlatforms,
          type,
          angleCount: batch.angles.length,
          assetCount: filteredAssets.length,
        },
      },
      { status: 200, headers },
    );
  } catch {
    return NextResponse.json(
      {
        data: null,
        error: { code: "GENERATION_FAILED", message: "Failed to generate content batch" },
        meta: null,
      },
      { status: 500, headers },
    );
  }
}
