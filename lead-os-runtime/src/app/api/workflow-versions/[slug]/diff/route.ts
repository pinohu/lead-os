import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { diffVersions } from "@/lib/workflow-versioning";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { session, response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;
  void session;

  try {
    const { slug } = await params;
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId");
    const fromParam = url.searchParams.get("from");
    const toParam = url.searchParams.get("to");

    if (!tenantId) {
      return NextResponse.json(
        {
          data: null,
          error: { code: "VALIDATION_ERROR", message: "tenantId is required" },
          meta: null,
        },
        { status: 400, headers },
      );
    }

    const fromVersion = parseInt(fromParam ?? "", 10);
    const toVersion = parseInt(toParam ?? "", 10);

    if (!Number.isFinite(fromVersion) || !Number.isFinite(toVersion)) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "VALIDATION_ERROR",
            message: "Query parameters 'from' and 'to' must be valid version integers",
          },
          meta: null,
        },
        { status: 400, headers },
      );
    }

    const diff = await diffVersions(tenantId, slug, fromVersion, toVersion);

    return NextResponse.json(
      { data: diff, error: null, meta: { changesCount: diff.changes.length } },
      { headers },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to diff versions";
    const isNotFound = message.includes("not found");

    return NextResponse.json(
      {
        data: null,
        error: { code: isNotFound ? "NOT_FOUND" : "DIFF_FAILED", message },
        meta: null,
      },
      { status: isNotFound ? 404 : 500, headers },
    );
  }
}
