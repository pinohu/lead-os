import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { runCronsBySchedule } from "@/lib/optimization-crons";
import { tenantConfig } from "@/lib/tenant";

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

const VALID_SCHEDULES = new Set(["daily", "weekly", "monthly"]);

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Content-Type must be application/json" }, meta: null },
        { status: 415, headers },
      );
    }

    const body = await request.json();

    if (!body.schedule || !VALID_SCHEDULES.has(body.schedule)) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "schedule must be daily, weekly, or monthly" }, meta: null },
        { status: 400, headers },
      );
    }

    const tenantId = typeof body.tenantId === "string" ? body.tenantId : tenantConfig.tenantId;
    const results = await runCronsBySchedule(tenantId, body.schedule);

    const allOk = results.every((r) => r.ok);

    return NextResponse.json(
      {
        data: results,
        error: allOk ? null : { code: "PARTIAL_FAILURE", message: "Some cron jobs failed" },
        meta: { schedule: body.schedule, total: results.length, succeeded: results.filter((r) => r.ok).length },
      },
      { status: allOk ? 200 : 207, headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "CRON_FAILED", message: "Failed to run optimization crons" }, meta: null },
      { status: 500, headers },
    );
  }
}
