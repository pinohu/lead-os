import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { createAudience, listAudiences } from "@/lib/integrations/markopolo-adapter";

const PlatformSchema = z.enum(["facebook", "google", "tiktok", "snapchat", "linkedin"]);
const AudienceTypeSchema = z.enum(["lookalike", "retargeting", "custom", "interest"]);

const CreateAudienceSchema = z.object({
  name: z.string().min(1).max(200),
  platform: PlatformSchema,
  size: z.number().int().min(0),
  type: AudienceTypeSchema,
  sourceData: z.string().max(2000).optional(),
  tenantId: z.string().max(200).optional(),
});

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId") ?? undefined;
    const audiences = await listAudiences(tenantId);

    return NextResponse.json(
      { data: audiences, error: null, meta: { count: audiences.length } },
      { headers },
    );
  } catch (err) {
    console.error("[markopolo/audiences GET]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to list audiences" }, meta: null },
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
    const validation = CreateAudienceSchema.safeParse(raw);

    if (!validation.success) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: validation.error.issues }, meta: null },
        { status: 422, headers },
      );
    }

    const audience = await createAudience(validation.data);

    return NextResponse.json(
      { data: audience, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    console.error("[markopolo/audiences POST]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "CREATE_FAILED", message: "Failed to create audience" }, meta: null },
      { status: 500, headers },
    );
  }
}
