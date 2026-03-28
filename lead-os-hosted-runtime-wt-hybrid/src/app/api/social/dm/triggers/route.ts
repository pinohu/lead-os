import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { createDMTrigger, getDMTriggers } from "@/lib/dm-conversion-engine";

const DMResponseSchema = z.object({
  initialMessage: z.string().min(1).max(1000),
  followUpMessages: z.array(z.string().max(1000)).max(10),
  leadCaptureFields: z.array(z.string().max(64)).max(10),
  leadMagnetSlug: z.string().max(128).optional(),
  bookingLink: z.string().url().optional(),
});

const CreateTriggerSchema = z.object({
  platform: z.string().min(1).max(64),
  triggerType: z.enum(["comment-keyword", "story-reply", "post-engagement", "direct-message"]),
  keywords: z.array(z.string().max(128)).min(1).max(50),
  response: DMResponseSchema,
  funnelTarget: z.string().min(1).max(128),
  active: z.boolean().default(true),
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
    const platform = url.searchParams.get("platform") ?? undefined;

    if (!tenantId) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "tenantId is required" }, meta: null },
        { status: 400, headers },
      );
    }

    const triggers = getDMTriggers(tenantId, platform);

    return NextResponse.json(
      { data: triggers, error: null, meta: { count: triggers.length } },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "LIST_FAILED", message: "Failed to list DM triggers" }, meta: null },
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
    const parsed = CreateTriggerSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid trigger data",
            details: parsed.error.issues,
          },
          meta: null,
        },
        { status: 400, headers },
      );
    }

    const trigger = await createDMTrigger(tenantId, parsed.data);

    return NextResponse.json({ data: trigger, error: null, meta: null }, { status: 201, headers });
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "CREATE_FAILED", message: "Failed to create DM trigger" }, meta: null },
      { status: 500, headers },
    );
  }
}
