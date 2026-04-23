import { NextRequest, NextResponse } from "next/server";
import {
  listDynastySites,
  saveDynastySite,
  type DynastyLandingConfig,
  type SiteCategory,
} from "../../../lib/dynasty-landing-engine.ts";
import { requireOperatorApiSession } from "../../../lib/operator-auth.ts";
import { buildCorsHeaders } from "../../../lib/cors.ts";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  try {
    const category = request.nextUrl.searchParams.get("category") as SiteCategory | null;
    const status = request.nextUrl.searchParams.get("status") ?? undefined;
    const tenantId = request.nextUrl.searchParams.get("tenantId") ?? undefined;
    const sites = await listDynastySites({
      category: category ?? undefined,
      status,
      tenantId,
    });
    return NextResponse.json(
      { data: sites, error: null, meta: { count: sites.length } },
      { headers },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list sites";
    return NextResponse.json(
      { data: null, error: { code: "INTERNAL_ERROR", message }, meta: {} },
      { status: 500, headers },
    );
  }
}

export async function POST(request: NextRequest) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const body = (await request.json()) as DynastyLandingConfig;

    if (!body.slug || typeof body.slug !== "string") {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "slug is required" }, meta: {} },
        { status: 400, headers },
      );
    }

    const saved = await saveDynastySite(body);
    return NextResponse.json(
      { data: saved, error: null, meta: { createdAt: saved.createdAt } },
      { status: 201, headers },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create site";
    return NextResponse.json(
      { data: null, error: { code: "INTERNAL_ERROR", message }, meta: {} },
      { status: 500, headers },
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}
