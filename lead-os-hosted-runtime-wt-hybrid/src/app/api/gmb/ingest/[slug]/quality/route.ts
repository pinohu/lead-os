import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { getLandingPage } from "@/lib/landing-page-generator";
import { scoreContentQuality } from "@/lib/content-quality-scorer";
import type { IngestedBusinessProfile } from "@/lib/gmb-ingestor";

export const dynamic = "force-dynamic";

/**
 * Builds a minimal fallback profile when the page has no associated ingested
 * profile. Populated from the landing page metadata so section scoring still
 * works, but completeness and review quality default to zero.
 */
function buildDefaultProfile(page: {
  slug: string;
  businessName: string;
  niche: string;
  industry: string;
  geo: { city: string; state: string; country: string };
}): IngestedBusinessProfile {
  return {
    slug: page.slug,
    businessName: page.businessName,
    address: "",
    city: page.geo.city,
    state: page.geo.state,
    postalCode: "",
    country: page.geo.country,
    niche: page.niche,
    industry: page.industry as IngestedBusinessProfile["industry"],
    description: "",
    primaryCategory: "",
    additionalCategories: [],
    topReviews: [],
    photos: [],
    hours: [],
    attributes: [],
    faq: [],
    listingCompleteness: 0,
    reviewQuality: 0,
    digitalPresenceGap: 0,
    ingestedAt: new Date().toISOString(),
  };
}

/**
 * GET /api/gmb/ingest/[slug]/quality
 *
 * Scores the content quality of a landing page identified by slug. Returns a
 * full ContentQualityReport with per-section scores, SEO score, accessibility
 * flags, and remediation recommendations.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const auth = await requireOperatorApiSession(request);
  if (auth.response) {
    return auth.response;
  }

  try {
    const { slug } = await params;
    const page = await getLandingPage(slug);

    if (!page) {
      return NextResponse.json(
        {
          data: null,
          error: { code: "NOT_FOUND", message: `Landing page "${slug}" not found` },
          meta: null,
        },
        { status: 404, headers },
      );
    }

    const metadata = (page as unknown as Record<string, unknown>).ingestedProfile;
    const profile: IngestedBusinessProfile = metadata
      ? (metadata as IngestedBusinessProfile)
      : buildDefaultProfile(page);

    const report = scoreContentQuality(page, profile);

    return NextResponse.json(
      { data: report, error: null, meta: null },
      { headers },
    );
  } catch (err) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "QUALITY_SCORE_FAILED",
          message: err instanceof Error ? err.message : "Failed to score content quality",
        },
        meta: null,
      },
      { status: 500, headers },
    );
  }
}
