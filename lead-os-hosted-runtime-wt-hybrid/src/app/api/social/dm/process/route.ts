import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { processIncomingComment, processIncomingDM } from "@/lib/dm-conversion-engine";

const ProcessCommentSchema = z.object({
  type: z.literal("comment"),
  tenantId: z.string().min(1).max(128),
  platform: z.string().min(1).max(64),
  comment: z.string().min(1).max(2000),
});

const ProcessDMSchema = z.object({
  type: z.literal("dm"),
  tenantId: z.string().min(1).max(128),
  platform: z.string().min(1).max(64),
  userId: z.string().min(1).max(128),
  message: z.string().min(1).max(2000),
});

const ProcessSchema = z.discriminatedUnion("type", [ProcessCommentSchema, ProcessDMSchema]);

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

    const raw = await request.json();
    const parsed = ProcessSchema.safeParse(raw);
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

    if (body.type === "comment") {
      const result = await processIncomingComment(body.tenantId, body.platform, body.comment);
      return NextResponse.json({ data: result, error: null, meta: null }, { headers });
    }

    const result = await processIncomingDM(body.tenantId, body.platform, body.userId, body.message);
    return NextResponse.json({ data: result, error: null, meta: null }, { headers });
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "PROCESS_FAILED", message: "Failed to process incoming message" }, meta: null },
      { status: 500, headers },
    );
  }
}
