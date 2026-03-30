import { NextRequest, NextResponse } from "next/server";
import {
  getDynastySite,
  saveDynastySite,
  deleteDynastySite,
  type DynastyLandingConfig,
} from "../../../../lib/dynasty-landing-engine.ts";
import { requireOperatorApiSession } from "../../../../lib/operator-auth.ts";
import { buildCorsHeaders } from "../../../../lib/cors.ts";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const { slug } = await params;

  try {
    const config = await getDynastySite(slug);
    if (!config) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: `Site '${slug}' not found` }, meta: {} },
        { status: 404, headers },
      );
    }
    return NextResponse.json({ data: config, error: null, meta: {} }, { headers });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to get site";
    return NextResponse.json(
      { data: null, error: { code: "INTERNAL_ERROR", message }, meta: {} },
      { status: 500, headers },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  const { slug } = await params;

  try {
    const existing = await getDynastySite(slug);
    if (!existing) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: `Site '${slug}' not found` }, meta: {} },
        { status: 404, headers },
      );
    }

    const body = (await request.json()) as Partial<DynastyLandingConfig>;
    // Prevent slug and tenantId reassignment via PATCH body
    const { slug: _s, tenantId: _t, createdAt: _c, ...safeOverrides } = body;
    const updated = await saveDynastySite({ ...existing, ...safeOverrides });

    return NextResponse.json({ data: updated, error: null, meta: {} }, { headers });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update site";
    return NextResponse.json(
      { data: null, error: { code: "INTERNAL_ERROR", message }, meta: {} },
      { status: 500, headers },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  const { slug } = await params;

  try {
    const existed = await deleteDynastySite(slug);
    if (!existed) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: `Site '${slug}' not found` }, meta: {} },
        { status: 404, headers },
      );
    }
    return new NextResponse(null, { status: 204, headers });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete site";
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
