import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { validateSafe } from "@/lib/canonical-schema";
import { deploySite } from "@/lib/integrations/hosted-runtime-adapter";

export const dynamic = "force-dynamic";

const DeploySchema = z.object({
  html: z.string().min(1),
  css: z.string().min(1),
  js: z.string().optional(),
  assets: z.array(z.object({
    name: z.string().min(1),
    content: z.string().min(1),
  })).optional(),
});

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ siteId: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const { siteId } = await params;

  try {
    const body = await request.json();
    const validation = validateSafe(DeploySchema, body);
    if (!validation.valid) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Validation failed", details: validation.errors }, meta: null },
        { status: 422, headers },
      );
    }

    const result = await deploySite(siteId, validation.data!);
    return NextResponse.json(
      { data: result, error: null, meta: null },
      { status: 200, headers },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Deploy failed";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json(
      { data: null, error: { code: "DEPLOY_FAILED", message }, meta: null },
      { status, headers },
    );
  }
}
