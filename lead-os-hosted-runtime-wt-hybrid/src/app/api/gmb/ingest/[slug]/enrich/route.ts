import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { isAIEnabled } from "@/lib/ai-client";
import { enrichLandingPage } from "@/lib/ai-content-enricher";

export const dynamic = "force-dynamic";

/**
 * POST /api/gmb/ingest/[slug]/enrich
 *
 * Enriches a landing page's content with AI-generated copy improvements.
 * Requires AI to be configured via environment variables.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const auth = await requireOperatorApiSession(request);
  if (auth.response) {
    return auth.response;
  }

  if (!isAIEnabled()) {
    return NextResponse.json(
      {
        data: null,
        error: { code: "AI_NOT_CONFIGURED", message: "AI provider not configured" },
        meta: null,
      },
      { status: 503, headers },
    );
  }

  try {
    const { slug } = await params;

    let tone: string | undefined;
    try {
      const body = await request.json();
      if (body && typeof body.tone === "string") {
        tone = body.tone;
      }
    } catch {
      // Empty body is acceptable — defaults apply.
    }

    const result = await enrichLandingPage(slug, tone);

    if (!result) {
      return NextResponse.json(
        {
          data: null,
          error: { code: "NOT_FOUND", message: `Landing page "${slug}" not found` },
          meta: null,
        },
        { status: 404, headers },
      );
    }

    return NextResponse.json(
      { data: result, error: null, meta: null },
      { headers },
    );
  } catch (err) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "ENRICHMENT_FAILED",
          message: err instanceof Error ? err.message : "Failed to enrich landing page",
        },
        meta: null,
      },
      { status: 500, headers },
    );
  }
}
