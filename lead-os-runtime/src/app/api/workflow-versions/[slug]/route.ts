import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import {
  getWorkflowVersions,
  rollbackWorkflow,
} from "@/lib/workflow-versioning";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { session, response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const { slug } = await params;
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId");

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

    const versions = await getWorkflowVersions(tenantId, slug);

    return NextResponse.json(
      { data: versions, error: null, meta: { count: versions.length, slug } },
      { headers },
    );
  } catch {
    return NextResponse.json(
      {
        data: null,
        error: { code: "FETCH_FAILED", message: "Failed to fetch workflow versions" },
        meta: null,
      },
      { status: 500, headers },
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { session, response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const { slug } = await params;
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId");

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

    const body = await request.json() as { toVersion?: unknown };
    const toVersion = typeof body.toVersion === "number" ? body.toVersion : Number(body.toVersion);

    if (!Number.isInteger(toVersion) || toVersion < 1) {
      return NextResponse.json(
        {
          data: null,
          error: { code: "VALIDATION_ERROR", message: "toVersion must be a positive integer" },
          meta: null,
        },
        { status: 400, headers },
      );
    }

    const changedBy = session?.email ?? "operator";
    const newVersion = await rollbackWorkflow(tenantId, slug, toVersion, changedBy);

    return NextResponse.json(
      { data: newVersion, error: null, meta: { rolledBackTo: toVersion } },
      { status: 201, headers },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to rollback workflow";
    const isNotFound = message.includes("not found");

    return NextResponse.json(
      {
        data: null,
        error: { code: isNotFound ? "NOT_FOUND" : "ROLLBACK_FAILED", message },
        meta: null,
      },
      { status: isNotFound ? 404 : 500, headers },
    );
  }
}
