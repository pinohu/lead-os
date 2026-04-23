import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { createCreativeJob, listCreativeJobs, CREATIVE_JOB_TYPES } from "@/lib/creative-scheduler";
import type { CreativeJobType } from "@/lib/creative-scheduler";

const VALID_TYPES = new Set<CreativeJobType>(CREATIVE_JOB_TYPES.map((t) => t.type));
const VALID_SCHEDULES = new Set(["daily", "weekly", "monthly"]);

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "tenantId is required" }, meta: null },
        { status: 400, headers },
      );
    }

    const jobs = await listCreativeJobs(tenantId);
    return NextResponse.json(
      { data: jobs, error: null, meta: { count: jobs.length } },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "LIST_FAILED", message: "Failed to list creative jobs" }, meta: null },
      { status: 500, headers },
    );
  }
}

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const body = await request.json();

    if (!body.tenantId || typeof body.tenantId !== "string") {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "tenantId is required" }, meta: null },
        { status: 400, headers },
      );
    }

    if (!body.type || !VALID_TYPES.has(body.type as CreativeJobType)) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: `type must be one of: ${[...VALID_TYPES].join(", ")}` }, meta: null },
        { status: 400, headers },
      );
    }

    if (!body.schedule || !VALID_SCHEDULES.has(body.schedule)) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "schedule must be daily, weekly, or monthly" }, meta: null },
        { status: 400, headers },
      );
    }

    const job = await createCreativeJob({
      tenantId: body.tenantId,
      type: body.type as CreativeJobType,
      schedule: body.schedule,
      config: body.config ?? {},
    });

    return NextResponse.json(
      { data: job, error: null, meta: null },
      { status: 201, headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "CREATE_FAILED", message: "Failed to create creative job" }, meta: null },
      { status: 500, headers },
    );
  }
}
