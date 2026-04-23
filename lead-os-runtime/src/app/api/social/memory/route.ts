import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import {
  recordContent,
  updateMetrics,
  generateContentInsights,
} from "@/lib/content-memory";

const RecordContentSchema = z.object({
  action: z.literal("record"),
  assetId: z.string().min(1).max(128),
  platform: z.string().min(1).max(64),
  hook: z.string().min(1).max(256),
  angle: z.string().min(1).max(256),
  type: z.enum(["viral", "conversion"]),
  metrics: z.object({
    impressions: z.number().nonnegative(),
    views: z.number().nonnegative(),
    watchTimeAvg: z.number().nonnegative(),
    ctr: z.number().nonnegative(),
    engagementRate: z.number().nonnegative(),
    shares: z.number().nonnegative(),
    saves: z.number().nonnegative(),
    comments: z.number().nonnegative(),
    leads: z.number().nonnegative(),
    conversions: z.number().nonnegative(),
    revenuePerView: z.number().nonnegative(),
  }),
  revenueGenerated: z.number().nonnegative(),
});

const UpdateMetricsSchema = z.object({
  action: z.literal("update-metrics"),
  assetId: z.string().min(1).max(128),
  metrics: z
    .object({
      impressions: z.number().nonnegative().optional(),
      views: z.number().nonnegative().optional(),
      watchTimeAvg: z.number().nonnegative().optional(),
      ctr: z.number().nonnegative().optional(),
      engagementRate: z.number().nonnegative().optional(),
      shares: z.number().nonnegative().optional(),
      saves: z.number().nonnegative().optional(),
      comments: z.number().nonnegative().optional(),
      leads: z.number().nonnegative().optional(),
      conversions: z.number().nonnegative().optional(),
      revenuePerView: z.number().nonnegative().optional(),
    })
    .refine((v) => Object.keys(v).length > 0, { message: "At least one metric field required" }),
});

const PostBodySchema = z.discriminatedUnion("action", [RecordContentSchema, UpdateMetricsSchema]);

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "tenantId is required" }, meta: null },
        { status: 400, headers },
      );
    }

    const insights = generateContentInsights(tenantId);

    return NextResponse.json(
      { data: insights, error: null, meta: { tenantId } },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "INSIGHTS_FAILED", message: "Failed to generate content insights" }, meta: null },
      { status: 500, headers },
    );
  }
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

    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId");
    if (!tenantId) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "tenantId is required" }, meta: null },
        { status: 400, headers },
      );
    }

    const raw = await request.json();
    const parsed = PostBodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request body",
            details: parsed.error.issues,
          },
          meta: null,
        },
        { status: 400, headers },
      );
    }

    const body = parsed.data;

    if (body.action === "record") {
      const record = await recordContent(tenantId, {
        assetId: body.assetId,
        platform: body.platform,
        hook: body.hook,
        angle: body.angle,
        type: body.type,
        metrics: body.metrics,
        revenueGenerated: body.revenueGenerated,
      });
      return NextResponse.json({ data: record, error: null, meta: null }, { status: 201, headers });
    }

    const updated = await updateMetrics(body.assetId, body.metrics);
    if (!updated) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Asset not found" }, meta: null },
        { status: 404, headers },
      );
    }

    return NextResponse.json({ data: updated, error: null, meta: null }, { headers });
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "REQUEST_FAILED", message: "Failed to process request" }, meta: null },
      { status: 500, headers },
    );
  }
}
