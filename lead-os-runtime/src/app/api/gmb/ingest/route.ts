import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { ingestGMBListing } from "@/lib/gmb-ingestor";
import {
  generateLandingPage,
  listLandingPages,
  saveLandingPage,
} from "@/lib/landing-page-generator";

export const dynamic = "force-dynamic";

const IngestSchema = z.object({
  placeId: z.string().optional(),
  name: z.string().min(1).max(200),
  address: z.string().min(1).max(500),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional().default("US"),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  primaryCategory: z.string().optional(),
  additionalCategories: z.array(z.string()).optional(),
  description: z.string().max(2000).optional(),
  rating: z.number().min(0).max(5).optional(),
  reviewCount: z.number().int().min(0).optional(),
  reviews: z
    .array(
      z.object({
        author: z.string().optional(),
        rating: z.number().min(1).max(5),
        text: z.string().max(1000).optional(),
        relativeTime: z.string().optional(),
        publishedAt: z.string().optional(),
      }),
    )
    .optional(),
  photos: z
    .array(
      z.object({
        url: z.string().url(),
        width: z.number().optional(),
        height: z.number().optional(),
        category: z
          .enum(["cover", "interior", "exterior", "product", "team", "logo", "other"])
          .optional(),
      }),
    )
    .optional(),
  hours: z
    .array(
      z.object({
        day: z.enum([
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
          "sunday",
        ]),
        open: z.string(),
        close: z.string(),
        closed: z.boolean().optional(),
      }),
    )
    .optional(),
  attributes: z
    .array(
      z.object({
        key: z.string(),
        label: z.string(),
        value: z.boolean(),
      }),
    )
    .optional(),
  qAndA: z
    .array(
      z.object({
        question: z.string(),
        answer: z.string().optional(),
      }),
    )
    .optional(),
  geo: z.object({ lat: z.number(), lng: z.number() }).optional(),
  serviceArea: z.string().optional(),
  tenantId: z.string().optional(),
  accentColor: z.string().optional(),
  leadMagnetSlug: z.string().optional(),
});

/**
 * POST /api/gmb/ingest
 *
 * Ingests a GMB listing payload, builds a business profile, generates a
 * landing page, persists it, and returns summary fields for both.
 */
export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const auth = await requireOperatorApiSession(request);
  if (auth.response) {
    return auth.response;
  }

  try {
    const raw = await request.json();
    const validation = IngestSchema.safeParse(raw);

    if (!validation.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid ingest payload",
            details: validation.error.issues,
          },
          meta: null,
        },
        { status: 400, headers },
      );
    }

    const validated = validation.data;

    const profile = ingestGMBListing(validated);

    const landingPage = generateLandingPage(profile, {
      tenantId: validated.tenantId,
      accentColor: validated.accentColor,
      leadMagnetSlug: validated.leadMagnetSlug,
    });

    await saveLandingPage(landingPage);

    return NextResponse.json(
      {
        data: {
          profile: {
            slug: profile.slug,
            businessName: profile.businessName,
            niche: profile.niche,
            industry: profile.industry,
            listingCompleteness: profile.listingCompleteness,
            reviewQuality: profile.reviewQuality,
          },
          landingPage: {
            slug: landingPage.slug,
            url: `/lp/${landingPage.slug}`,
            status: landingPage.status,
            sectionCount: landingPage.sections.length,
          },
        },
        error: null,
        meta: { ingestedAt: profile.ingestedAt },
      },
      { status: 201, headers },
    );
  } catch (err) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "INGEST_FAILED",
          message: err instanceof Error ? err.message : "Failed to ingest GMB listing",
        },
        meta: null,
      },
      { status: 500, headers },
    );
  }
}

/**
 * GET /api/gmb/ingest
 *
 * Returns a summary list of all generated landing pages, optionally filtered
 * by tenantId query parameter.
 */
export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const auth = await requireOperatorApiSession(request);
  if (auth.response) {
    return auth.response;
  }

  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId") ?? undefined;

    const pages = await listLandingPages(tenantId);

    const data = pages.map((page) => ({
      slug: page.slug,
      businessName: page.businessName,
      niche: page.niche,
      status: page.status,
      updatedAt: page.updatedAt,
    }));

    return NextResponse.json(
      { data, error: null, meta: { count: data.length } },
      { headers },
    );
  } catch (err) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "FETCH_FAILED",
          message: err instanceof Error ? err.message : "Failed to list landing pages",
        },
        meta: null,
      },
      { status: 500, headers },
    );
  }
}
