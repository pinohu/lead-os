import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { schedulePost, publishPostNow, listPosts } from "@/lib/integrations/vista-social-adapter";

const PlatformEnum = z.enum(["facebook", "instagram", "twitter", "linkedin", "tiktok", "pinterest", "youtube"]);

const CreatePostSchema = z.object({
  profileIds: z.array(z.string().min(1)).min(1),
  content: z.string().max(63206),
  mediaUrls: z.array(z.string().url()).optional(),
  scheduledAt: z.string().datetime().optional(),
  platforms: z.array(PlatformEnum).min(1),
  tenantId: z.string().min(1).optional(),
  publishNow: z.boolean().optional(),
});

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { session, response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId") ?? session.email;
    const status = url.searchParams.get("status") ?? undefined;

    const posts = await listPosts(tenantId, status);

    return NextResponse.json(
      { data: posts, error: null, meta: { count: posts.length } },
      { headers },
    );
  } catch (err) {
    console.error("[vista-social/posts GET]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to list posts" }, meta: null },
      { status: 500, headers },
    );
  }
}

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const raw = await request.json();
    const validation = CreatePostSchema.safeParse(raw);

    if (!validation.success) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: validation.error.issues }, meta: null },
        { status: 422, headers },
      );
    }

    const { profileIds, content, mediaUrls, scheduledAt, platforms, tenantId, publishNow } = validation.data;

    let post;
    if (publishNow || !scheduledAt) {
      post = await publishPostNow({ profileIds, content, mediaUrls, platforms, tenantId });
    } else {
      post = await schedulePost({ profileIds, content, mediaUrls, scheduledAt, platforms, tenantId });
    }

    return NextResponse.json(
      { data: post, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    console.error("[vista-social/posts POST]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "CREATE_FAILED", message: "Failed to create post" }, meta: null },
      { status: 500, headers },
    );
  }
}
