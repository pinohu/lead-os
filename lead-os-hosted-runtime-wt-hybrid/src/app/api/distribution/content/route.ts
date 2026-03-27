import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import {
  generateBlogOutline,
  generateSocialPosts,
  scheduleContent,
  listContentSchedules,
  listBlogOutlines,
  type SocialPlatform,
} from "@/lib/distribution-engine";

const VALID_PLATFORMS = new Set<SocialPlatform>(["twitter", "linkedin", "instagram"]);

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const body = await request.json();
    const { action } = body as { action?: string };

    if (action === "blog-outline") {
      const { niche, topic, targetKeyword } = body as {
        niche?: string;
        topic?: string;
        targetKeyword?: string;
      };

      if (!niche || !topic || !targetKeyword) {
        return NextResponse.json(
          { data: null, error: { code: "VALIDATION_ERROR", message: "niche, topic, and targetKeyword are required" }, meta: null },
          { status: 400, headers },
        );
      }

      const outline = await generateBlogOutline(niche, topic, targetKeyword);
      return NextResponse.json(
        { data: outline, error: null, meta: { action: "blog-outline" } },
        { status: 201, headers },
      );
    }

    if (action === "social-posts") {
      const { niche, contentPiece, platforms } = body as {
        niche?: string;
        contentPiece?: { id: string; title: string; summary: string };
        platforms?: string[];
      };

      if (!niche || !contentPiece || !platforms || !Array.isArray(platforms)) {
        return NextResponse.json(
          { data: null, error: { code: "VALIDATION_ERROR", message: "niche, contentPiece, and platforms are required" }, meta: null },
          { status: 400, headers },
        );
      }

      const validPlatforms = platforms.filter((p): p is SocialPlatform =>
        VALID_PLATFORMS.has(p as SocialPlatform),
      );

      if (validPlatforms.length === 0) {
        return NextResponse.json(
          { data: null, error: { code: "VALIDATION_ERROR", message: "At least one valid platform is required (twitter, linkedin, instagram)" }, meta: null },
          { status: 400, headers },
        );
      }

      const posts = await generateSocialPosts(niche, contentPiece, validPlatforms);
      return NextResponse.json(
        { data: posts, error: null, meta: { action: "social-posts", count: posts.length } },
        { status: 201, headers },
      );
    }

    if (action === "schedule") {
      const { tenantId, contentPlan } = body as {
        tenantId?: string;
        contentPlan?: { contentType: "blog" | "social" | "seo-page"; contentId: string; title: string; publishAt: string }[];
      };

      if (!tenantId || !contentPlan || !Array.isArray(contentPlan) || contentPlan.length === 0) {
        return NextResponse.json(
          { data: null, error: { code: "VALIDATION_ERROR", message: "tenantId and contentPlan array are required" }, meta: null },
          { status: 400, headers },
        );
      }

      const schedules = await scheduleContent(tenantId, contentPlan);
      return NextResponse.json(
        { data: schedules, error: null, meta: { action: "schedule", count: schedules.length } },
        { status: 201, headers },
      );
    }

    return NextResponse.json(
      { data: null, error: { code: "VALIDATION_ERROR", message: "action must be one of: blog-outline, social-posts, schedule" }, meta: null },
      { status: 400, headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "GENERATION_FAILED", message: "Failed to process content request" }, meta: null },
      { status: 500, headers },
    );
  }
}

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId");
    const type = url.searchParams.get("type");

    if (!tenantId) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "tenantId is required" }, meta: null },
        { status: 400, headers },
      );
    }

    if (type === "outlines") {
      const outlines = listBlogOutlines(tenantId);
      return NextResponse.json(
        { data: outlines, error: null, meta: { count: outlines.length, type: "outlines" } },
        { headers },
      );
    }

    const schedules = listContentSchedules(tenantId);
    return NextResponse.json(
      { data: schedules, error: null, meta: { count: schedules.length, type: "schedules" } },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to list content" }, meta: null },
      { status: 500, headers },
    );
  }
}
