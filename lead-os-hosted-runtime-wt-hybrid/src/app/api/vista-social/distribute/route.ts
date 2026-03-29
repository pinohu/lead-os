import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { distributeCopilotContent } from "@/lib/integrations/vista-social-adapter";

const DistributeSchema = z.object({
  content: z.string().min(1).max(63206),
  platforms: z.array(
    z.enum(["facebook", "instagram", "twitter", "linkedin", "tiktok", "pinterest", "youtube"]),
  ).min(1),
  tenantId: z.string().min(1).optional(),
});

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const raw = await request.json();
    const validation = DistributeSchema.safeParse(raw);

    if (!validation.success) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: validation.error.issues }, meta: null },
        { status: 422, headers },
      );
    }

    const { content, platforms, tenantId } = validation.data;
    const posts = await distributeCopilotContent(content, platforms, tenantId);

    return NextResponse.json(
      { data: posts, error: null, meta: { count: posts.length } },
      { status: 201, headers },
    );
  } catch (err) {
    console.error("[vista-social/distribute POST]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "DISTRIBUTE_FAILED", message: "Failed to distribute content" }, meta: null },
      { status: 500, headers },
    );
  }
}
