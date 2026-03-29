import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import {
  getIdentifiedVisitors,
  recordVisitor,
} from "@/lib/integrations/happierleads-adapter";

const PageViewSchema = z.object({
  url: z.string().min(1),
  title: z.string().min(1),
  duration: z.number().min(0),
  timestamp: z.string().min(1),
});

const RecordVisitorSchema = z.object({
  companyName: z.string().min(1).max(500),
  domain: z.string().min(1).max(500),
  industry: z.string().min(1).max(200),
  size: z.string().min(1).max(100),
  revenue: z.string().max(100).optional(),
  location: z.string().min(1).max(500),
  country: z.string().min(1).max(10),
  pageViews: z.array(PageViewSchema).default([]),
  totalVisits: z.number().int().min(0).default(1),
  firstVisitAt: z.string().min(1),
  lastVisitAt: z.string().min(1),
  engagementScore: z.number().min(0).max(100),
  tenantId: z.string().min(1).optional(),
});

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const url = new URL(request.url);
    const filter = {
      minEngagement: url.searchParams.has("minEngagement")
        ? Number(url.searchParams.get("minEngagement"))
        : undefined,
      industry: url.searchParams.get("industry") ?? undefined,
      location: url.searchParams.get("location") ?? undefined,
      dateFrom: url.searchParams.get("dateFrom") ?? undefined,
      dateTo: url.searchParams.get("dateTo") ?? undefined,
      minVisits: url.searchParams.has("minVisits")
        ? Number(url.searchParams.get("minVisits"))
        : undefined,
    };

    const visitors = await getIdentifiedVisitors(filter);

    return NextResponse.json(
      { data: visitors, error: null, meta: { count: visitors.length } },
      { headers },
    );
  } catch (err) {
    console.error("[happierleads/visitors GET]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to fetch visitors" }, meta: null },
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
    const validation = RecordVisitorSchema.safeParse(raw);

    if (!validation.success) {
      return NextResponse.json(
        {
          data: null,
          error: { code: "VALIDATION_ERROR", message: "Invalid input", details: validation.error.issues },
          meta: null,
        },
        { status: 422, headers },
      );
    }

    const visitor = await recordVisitor(validation.data);

    return NextResponse.json(
      { data: visitor, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    console.error("[happierleads/visitors POST]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "CREATE_FAILED", message: "Failed to record visitor" }, meta: null },
      { status: 500, headers },
    );
  }
}
