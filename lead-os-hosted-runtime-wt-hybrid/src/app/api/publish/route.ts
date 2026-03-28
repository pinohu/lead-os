import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { publishPost, getPublishHistory, type SocialPlatform } from "@/lib/integrations/social-publisher";

const VALID_PLATFORMS: SocialPlatform[] = ["tiktok", "instagram", "youtube", "facebook", "linkedin", "x", "threads"];

const PublishPostSchema = z.object({
  tenantId: z.string().min(1).max(100),
  post: z.object({
    platform: z.enum(["tiktok", "instagram", "youtube", "facebook", "linkedin", "x", "threads"]),
    content: z.string().min(1).max(5000),
    mediaUrls: z.array(z.string().url()).optional(),
    hashtags: z.array(z.string()).optional(),
    scheduledAt: z.string().datetime().optional(),
    metadata: z.record(z.string()).optional(),
  }),
});

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId");
    const platform = url.searchParams.get("platform") as SocialPlatform | null;
    const limit = parseInt(url.searchParams.get("limit") ?? "50", 10);

    if (!tenantId) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "tenantId query parameter is required" }, meta: null },
        { status: 400, headers },
      );
    }

    if (platform && !VALID_PLATFORMS.includes(platform)) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: `Invalid platform: ${platform}` }, meta: null },
        { status: 400, headers },
      );
    }

    const history = await getPublishHistory(tenantId, platform ?? undefined, isNaN(limit) ? 50 : Math.min(limit, 200));

    return NextResponse.json(
      { data: history, error: null, meta: { count: history.length } },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to fetch publish history" }, meta: null },
      { status: 500, headers },
    );
  }
}

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const raw = await request.json();
    const validation = PublishPostSchema.safeParse(raw);

    if (!validation.success) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: validation.error.issues }, meta: null },
        { status: 422, headers },
      );
    }

    const { tenantId, post } = validation.data;
    const result = await publishPost(tenantId, post);

    return NextResponse.json(
      { data: result, error: null, meta: null },
      { status: 201, headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "PUBLISH_FAILED", message: "Failed to publish post" }, meta: null },
      { status: 500, headers },
    );
  }
}
