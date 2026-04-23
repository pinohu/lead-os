import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import {
  generateVideoSpec,
  generateRemotionCode,
  generateProductDemoScript,
  generateDataReportScript,
  generateLaunchVideoScript,
  generateWeeklyRecapScript,
} from "@/lib/video-pipeline";
import type { VideoType } from "@/lib/video-pipeline";

const VALID_TYPES = new Set<VideoType>([
  "product-demo",
  "data-report",
  "launch-video",
  "testimonial",
  "feature-highlight",
  "weekly-recap",
]);

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const body = await request.json();

    if (!body.tenantId || typeof body.tenantId !== "string") {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "tenantId is required" }, meta: null },
        { status: 400, headers },
      );
    }

    if (!body.type || !VALID_TYPES.has(body.type as VideoType)) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: `type must be one of: ${[...VALID_TYPES].join(", ")}` }, meta: null },
        { status: 400, headers },
      );
    }

    const type = body.type as VideoType;
    const tenantId = body.tenantId as string;

    let result;

    switch (type) {
      case "product-demo":
        result = await generateProductDemoScript(tenantId, body.features ?? []);
        break;
      case "data-report":
        result = await generateDataReportScript(tenantId, body.metrics ?? {});
        break;
      case "launch-video":
        result = await generateLaunchVideoScript(tenantId, body.features ?? [], body.ctaUrl ?? "");
        break;
      case "weekly-recap":
        result = await generateWeeklyRecapScript(tenantId);
        break;
      default: {
        const spec = await generateVideoSpec({
          type,
          tenantId,
          features: body.features,
          metrics: body.metrics,
          testimonials: body.testimonials,
          ctaUrl: body.ctaUrl,
          ctaText: body.ctaText,
        });
        const remotionCode = generateRemotionCode(spec);
        result = {
          spec,
          remotionCode,
          compositionId: `${type}-${tenantId}-${Date.now()}`,
          estimatedRenderTime: Math.ceil(spec.duration * 2),
        };
        break;
      }
    }

    return NextResponse.json(
      {
        data: {
          spec: result.spec,
          remotionCode: result.remotionCode,
          compositionId: result.compositionId,
        },
        error: null,
        meta: { estimatedRenderTime: result.estimatedRenderTime },
      },
      { status: 201, headers },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate video";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json(
      { data: null, error: { code: "GENERATION_FAILED", message }, meta: null },
      { status, headers },
    );
  }
}
