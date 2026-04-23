import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { scheduleRecurringJobs, getScheduledJobs } from "@/lib/integrations/job-queue";

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  const jobs = getScheduledJobs();
  return NextResponse.json(
    { data: { jobs, total: jobs.length }, error: null, meta: null },
    { status: 200, headers },
  );
}

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  try {
    scheduleRecurringJobs();
    const jobs = getScheduledJobs();

    return NextResponse.json(
      { data: { scheduled: jobs.length, jobs }, error: null, meta: null },
      { status: 200, headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "SCHEDULE_ERROR", message: "Failed to schedule recurring jobs" }, meta: null },
      { status: 500, headers },
    );
  }
}
