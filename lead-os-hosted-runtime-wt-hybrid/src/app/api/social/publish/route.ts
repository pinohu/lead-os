import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import {
  recordContent,
  updateContentStatus,
  getContentByTenant,
  isDuplicate,
} from "@/lib/social-content-memory";

const PublishRequestSchema = z.object({
  tenantId: z.string().min(1).max(100),
  platform: z.string().min(1).max(64),
  topic: z.string().min(1).max(500),
  hookText: z.string().min(1).max(2000),
  angleText: z.string().min(1).max(2000),
  dryRun: z.boolean().optional().default(true),
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

  const parsed = PublishRequestSchema.safeParse(rawBody);
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

  try {
    const { tenantId, platform, topic, hookText, angleText, dryRun } = parsed.data;

    const duplicate = isDuplicate(tenantId, topic, hookText, angleText);

    if (dryRun) {
      return NextResponse.json(
        {
          data: {
            dryRun: true,
            wouldPublish: !duplicate,
            isDuplicate: duplicate,
            platform,
            topic,
            hookText,
            angleText,
          },
          error: null,
          meta: { mode: "dry-run" },
        },
        { headers },
      );
    }

    if (duplicate) {
      return NextResponse.json(
        { data: null, error: { code: "DUPLICATE_CONTENT", message: "This content has already been published. Use different angle or hook." }, meta: null },
        { status: 409, headers },
      );
    }

    const entry = recordContent(tenantId, {
      platform,
      topic,
      hookText,
      angleText,
      status: "published",
      metrics: {
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        saves: 0,
        clickThroughRate: 0,
        engagementRate: 0,
      },
      publishedAt: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        data: entry,
        error: null,
        meta: { published: true },
      },
      { status: 201, headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "PUBLISH_FAILED", message: "Failed to publish content" }, meta: null },
      { status: 500, headers },
    );
  }
}
