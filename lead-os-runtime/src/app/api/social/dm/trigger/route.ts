import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { triggerDMSequence, getDMFunnelMetrics, type EngagementType } from "@/lib/social-dm-engine";

const TriggerDMSchema = z.object({
  tenantId: z.string().min(1).max(100),
  userId: z.string().min(1).max(200),
  userName: z.string().min(1).max(200),
  platform: z.string().min(1).max(64),
  engagementType: z.enum(["comment", "like", "share", "save", "follow", "dm"]),
  sourceContentId: z.string().min(1).max(200),
  niche: z.string().min(1).max(200).optional(),
  topic: z.string().min(1).max(500).optional(),
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

  const parsed = TriggerDMSchema.safeParse(rawBody);
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
    const sequence = triggerDMSequence(parsed.data);
    const funnel = getDMFunnelMetrics(parsed.data.tenantId);

    return NextResponse.json(
      {
        data: { sequence, funnel },
        error: null,
        meta: { tenantId: parsed.data.tenantId, platform: parsed.data.platform },
      },
      { status: 201, headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "TRIGGER_FAILED", message: "Failed to trigger DM sequence" }, meta: null },
      { status: 500, headers },
    );
  }
}
