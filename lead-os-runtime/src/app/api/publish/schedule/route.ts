import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { schedulePost, getScheduledPosts, cancelScheduledPost } from "@/lib/integrations/social-publisher";

const SchedulePostSchema = z.object({
  tenantId: z.string().min(1).max(100),
  post: z.object({
    platform: z.enum(["tiktok", "instagram", "youtube", "facebook", "linkedin", "x", "threads"]),
    content: z.string().min(1).max(5000),
    mediaUrls: z.array(z.string().url()).optional(),
    hashtags: z.array(z.string()).optional(),
    scheduledAt: z.string().datetime(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  }),
});

const CancelSchema = z.object({
  postId: z.string().min(1),
});

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "tenantId query parameter is required" }, meta: null },
        { status: 400, headers },
      );
    }

    const scheduled = await getScheduledPosts(tenantId);

    return NextResponse.json(
      { data: scheduled, error: null, meta: { count: scheduled.length } },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to fetch scheduled posts" }, meta: null },
      { status: 500, headers },
    );
  }
}

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const raw = await request.json();
    const validation = SchedulePostSchema.safeParse(raw);

    if (!validation.success) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: validation.error.issues }, meta: null },
        { status: 422, headers },
      );
    }

    const { tenantId, post } = validation.data;
    const result = await schedulePost(tenantId, post);

    return NextResponse.json(
      { data: result, error: null, meta: null },
      { status: 201, headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "SCHEDULE_FAILED", message: "Failed to schedule post" }, meta: null },
      { status: 500, headers },
    );
  }
}

export async function DELETE(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const raw = await request.json();
    const validation = CancelSchema.safeParse(raw);

    if (!validation.success) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "postId is required" }, meta: null },
        { status: 422, headers },
      );
    }

    const cancelled = await cancelScheduledPost(validation.data.postId);

    if (!cancelled) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Scheduled post not found or could not be cancelled" }, meta: null },
        { status: 404, headers },
      );
    }

    return NextResponse.json(
      { data: { cancelled: true }, error: null, meta: null },
      { status: 200, headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "CANCEL_FAILED", message: "Failed to cancel scheduled post" }, meta: null },
      { status: 500, headers },
    );
  }
}
