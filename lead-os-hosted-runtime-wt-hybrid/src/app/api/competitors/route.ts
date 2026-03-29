import { NextResponse } from "next/server";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import {
  addCompetitor,
  listCompetitors,
  generateCompetitorId,
  type TrackedCompetitor,
} from "@/lib/competitor-store";
import { tenantConfig } from "@/lib/tenant";

export async function GET(request: Request) {
  const auth = await requireOperatorApiSession(request);
  if (auth.response) {
    return auth.response;
  }

  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenantId") ?? tenantConfig.tenantId;

  const competitors = await listCompetitors(tenantId);

  return NextResponse.json({
    data: competitors,
    error: null,
    meta: { total: competitors.length, tenantId },
  });
}

export async function POST(request: Request) {
  const auth = await requireOperatorApiSession(request);
  if (auth.response) {
    return auth.response;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "INVALID_JSON", message: "Request body must be valid JSON", details: [] }, meta: null },
      { status: 400 },
    );
  }

  const input = body as { url?: unknown; name?: unknown; nicheSlug?: unknown; tenantId?: unknown };

  if (typeof input.url !== "string" || !input.url.trim()) {
    return NextResponse.json(
      { data: null, error: { code: "VALIDATION_FAILED", message: "url is required", details: [{ field: "url", issue: "Must be a non-empty string" }] }, meta: null },
      { status: 400 },
    );
  }

  if (typeof input.name !== "string" || !input.name.trim()) {
    return NextResponse.json(
      { data: null, error: { code: "VALIDATION_FAILED", message: "name is required", details: [{ field: "name", issue: "Must be a non-empty string" }] }, meta: null },
      { status: 400 },
    );
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(input.url.trim());
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "VALIDATION_FAILED", message: "url is not a valid URL", details: [{ field: "url", issue: "Must be a valid absolute URL" }] }, meta: null },
      { status: 400 },
    );
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    return NextResponse.json(
      { data: null, error: { code: "VALIDATION_FAILED", message: "url must use http or https", details: [{ field: "url", issue: "Protocol must be http or https" }] }, meta: null },
      { status: 400 },
    );
  }

  const tenantId = typeof input.tenantId === "string" ? input.tenantId : tenantConfig.tenantId;
  const now = new Date().toISOString();

  const competitor: TrackedCompetitor = {
    id: generateCompetitorId(),
    tenantId,
    url: parsedUrl.toString(),
    name: input.name.trim(),
    nicheSlug: typeof input.nicheSlug === "string" && input.nicheSlug.trim() ? input.nicheSlug.trim() : undefined,
    scrapeCount: 0,
    status: "active",
    createdAt: now,
    updatedAt: now,
  };

  const created = await addCompetitor(competitor);

  return NextResponse.json(
    { data: created, error: null, meta: null },
    { status: 201 },
  );
}
