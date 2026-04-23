import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { adaptContent, adaptContentMultiPlatform, getAllPlatforms, type AdaptedPlatform } from "@/lib/social-platform-adapter";
import type { Script } from "@/lib/social-script-generator";

const VALID_PLATFORMS = new Set(getAllPlatforms());

const ScriptSectionSchema = z.object({
  label: z.string(),
  content: z.string(),
  durationSeconds: z.number(),
});

const CarouselSlideSchema = z.object({
  slideNumber: z.number(),
  headline: z.string(),
  body: z.string(),
  visualNote: z.string(),
});

const ThreadPostSchema = z.object({
  postNumber: z.number(),
  content: z.string(),
  characterCount: z.number(),
});

const ArticleSectionSchema = z.object({
  heading: z.string(),
  bulletPoints: z.array(z.string()),
  estimatedWordCount: z.number(),
});

const ScriptSchema = z.discriminatedUnion("format", [
  z.object({
    format: z.literal("short-video"),
    id: z.string(),
    sections: z.array(ScriptSectionSchema),
    totalDurationSeconds: z.number(),
    hookText: z.string(),
    ctaText: z.string(),
    generatedAt: z.string(),
  }),
  z.object({
    format: z.literal("carousel"),
    id: z.string(),
    slides: z.array(CarouselSlideSchema),
    slideCount: z.number(),
    hookText: z.string(),
    ctaText: z.string(),
    generatedAt: z.string(),
  }),
  z.object({
    format: z.literal("thread"),
    id: z.string(),
    posts: z.array(ThreadPostSchema),
    postCount: z.number(),
    hookText: z.string(),
    ctaText: z.string(),
    generatedAt: z.string(),
  }),
  z.object({
    format: z.literal("article-outline"),
    id: z.string(),
    title: z.string(),
    sections: z.array(ArticleSectionSchema),
    totalEstimatedWordCount: z.number(),
    hookText: z.string(),
    ctaText: z.string(),
    generatedAt: z.string(),
  }),
]);

const AdaptRequestSchema = z.object({
  script: ScriptSchema,
  platforms: z.array(z.string()).min(1).max(12),
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

  const parsed = AdaptRequestSchema.safeParse(rawBody);
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

  const { script, platforms: rawPlatforms } = parsed.data;

  const invalidPlatforms = rawPlatforms.filter((p) => !VALID_PLATFORMS.has(p as AdaptedPlatform));
  if (invalidPlatforms.length > 0) {
    return NextResponse.json(
      { data: null, error: { code: "VALIDATION_ERROR", message: `Unknown platforms: ${invalidPlatforms.join(", ")}. Valid: ${[...VALID_PLATFORMS].join(", ")}` }, meta: null },
      { status: 400, headers },
    );
  }

  try {
    const adapted = adaptContentMultiPlatform(script as Script, rawPlatforms as AdaptedPlatform[]);

    return NextResponse.json(
      {
        data: adapted,
        error: null,
        meta: { platformCount: adapted.length, sourceFormat: script.format },
      },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "ADAPT_FAILED", message: "Failed to adapt content for platforms" }, meta: null },
      { status: 500, headers },
    );
  }
}
