import { NextRequest, NextResponse } from "next/server";
import {
  getDynastySite,
  saveDynastySite,
  type DynastyLandingConfig,
} from "../../../../../lib/dynasty-landing-engine.ts";
import { requireOperatorApiSession } from "../../../../../lib/operator-auth.ts";
import { buildCorsHeaders } from "../../../../../lib/cors.ts";

export const dynamic = "force-dynamic";

interface CloneRequestBody {
  /** Tenant to associate the cloned config with */
  tenantId: string;
  /** Optional explicit slug for the clone. Defaults to `<source-slug>-<tenantId>` */
  slug?: string;
  /** Optional field-level overrides applied on top of the cloned config */
  overrides?: Partial<DynastyLandingConfig>;
}

/**
 * POST /api/sites/[slug]/clone
 *
 * Creates a tenant-scoped copy of a preset dynasty site config. Allows
 * partial field overrides for white-label customization. Requires operator auth.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  const { slug } = await params;

  try {
    const source = await getDynastySite(slug);
    if (!source) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: `Source site '${slug}' not found` }, meta: {} },
        { status: 404, headers },
      );
    }

    const body = (await request.json()) as CloneRequestBody;

    if (!body.tenantId || typeof body.tenantId !== "string") {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "tenantId is required" }, meta: {} },
        { status: 400, headers },
      );
    }

    const cloneSlug = body.slug ?? `${slug}-${body.tenantId}`;

    // Prevent overrides from changing slug, tenantId, or timestamps
    const { slug: _s, tenantId: _t, createdAt: _c, updatedAt: _u, ...safeOverrides } =
      (body.overrides ?? {}) as Partial<DynastyLandingConfig> & {
        createdAt?: string;
        updatedAt?: string;
      };

    const cloned = await saveDynastySite({
      ...source,
      ...safeOverrides,
      slug: cloneSlug,
      tenantId: body.tenantId,
      status: "draft",
    });

    return NextResponse.json(
      { data: cloned, error: null, meta: { clonedFrom: slug, tenantId: body.tenantId } },
      { status: 201, headers },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to clone site";
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
