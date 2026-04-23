import { NextResponse } from "next/server";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import {
  getCompetitor,
  updateCompetitor,
  removeCompetitor,
  getLatestSnapshot,
  type TrackedCompetitor,
} from "@/lib/competitor-store";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const auth = await requireOperatorApiSession(request);
  if (auth.response) {
    return auth.response;
  }

  const { id } = await context.params;
  const competitor = await getCompetitor(id);

  if (!competitor) {
    return NextResponse.json(
      { data: null, error: { code: "NOT_FOUND", message: "Competitor not found", details: [] }, meta: null },
      { status: 404 },
    );
  }

  const latestSnapshot = await getLatestSnapshot(id);

  return NextResponse.json({
    data: { competitor, latestSnapshot: latestSnapshot ?? null },
    error: null,
    meta: null,
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireOperatorApiSession(request);
  if (auth.response) {
    return auth.response;
  }

  const { id } = await context.params;
  const competitor = await getCompetitor(id);

  if (!competitor) {
    return NextResponse.json(
      { data: null, error: { code: "NOT_FOUND", message: "Competitor not found", details: [] }, meta: null },
      { status: 404 },
    );
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

  const patch = body as {
    name?: unknown;
    url?: unknown;
    nicheSlug?: unknown;
    status?: unknown;
  };

  const updated: TrackedCompetitor = { ...competitor };

  if (typeof patch.name === "string" && patch.name.trim()) {
    updated.name = patch.name.trim();
  }

  if (typeof patch.url === "string" && patch.url.trim()) {
    try {
      const parsedUrl = new URL(patch.url.trim());
      if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
        return NextResponse.json(
          { data: null, error: { code: "VALIDATION_FAILED", message: "url must use http or https", details: [{ field: "url", issue: "Protocol must be http or https" }] }, meta: null },
          { status: 400 },
        );
      }
      updated.url = parsedUrl.toString();
    } catch {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_FAILED", message: "url is not a valid URL", details: [{ field: "url", issue: "Must be a valid absolute URL" }] }, meta: null },
        { status: 400 },
      );
    }
  }

  if (typeof patch.nicheSlug === "string") {
    updated.nicheSlug = patch.nicheSlug.trim() || undefined;
  }

  if (patch.status === "active" || patch.status === "paused" || patch.status === "error") {
    updated.status = patch.status;
  }

  const result = await updateCompetitor(updated);

  return NextResponse.json({ data: result, error: null, meta: null });
}

export async function DELETE(request: Request, context: RouteContext) {
  const auth = await requireOperatorApiSession(request);
  if (auth.response) {
    return auth.response;
  }

  const { id } = await context.params;
  const competitor = await getCompetitor(id);

  if (!competitor) {
    return NextResponse.json(
      { data: null, error: { code: "NOT_FOUND", message: "Competitor not found", details: [] }, meta: null },
      { status: 404 },
    );
  }

  await removeCompetitor(id);

  return new NextResponse(null, { status: 204 });
}
