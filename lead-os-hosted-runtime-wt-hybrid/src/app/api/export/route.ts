import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { createExportJob, processExportJob, listExportJobs } from "@/lib/data-pipeline";

const VALID_TYPES = new Set(["leads", "events", "analytics", "attribution"]);
const VALID_FORMATS = new Set(["csv", "json", "jsonl"]);

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId");
    if (!tenantId) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "tenantId is required" }, meta: null },
        { status: 400, headers },
      );
    }

    const jobs = await listExportJobs(tenantId);
    return NextResponse.json(
      { data: jobs, error: null, meta: { count: jobs.length } },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "LIST_FAILED", message: "Failed to list export jobs" }, meta: null },
      { status: 500, headers },
    );
  }
}

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  try {
    const body = await request.json();

    if (!body.tenantId || typeof body.tenantId !== "string") {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "tenantId is required" }, meta: null },
        { status: 400, headers },
      );
    }

    if (!body.type || !VALID_TYPES.has(body.type)) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: `type must be one of: ${[...VALID_TYPES].join(", ")}` }, meta: null },
        { status: 400, headers },
      );
    }

    if (!body.format || !VALID_FORMATS.has(body.format)) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: `format must be one of: ${[...VALID_FORMATS].join(", ")}` }, meta: null },
        { status: 400, headers },
      );
    }

    const filters = {
      since: typeof body.filters?.since === "string" ? body.filters.since : undefined,
      until: typeof body.filters?.until === "string" ? body.filters.until : undefined,
      niche: typeof body.filters?.niche === "string" ? body.filters.niche : undefined,
      stage: typeof body.filters?.stage === "string" ? body.filters.stage : undefined,
      minScore: typeof body.filters?.minScore === "number" ? body.filters.minScore : undefined,
    };

    const job = await createExportJob(body.tenantId, body.type, body.format, filters);

    processExportJob(job.id).catch((err: unknown) => {
      console.error(`Export job ${job.id} failed:`, err);
    });

    return NextResponse.json(
      { data: job, error: null, meta: null },
      { status: 201, headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "CREATE_FAILED", message: "Failed to create export job" }, meta: null },
      { status: 500, headers },
    );
  }
}
