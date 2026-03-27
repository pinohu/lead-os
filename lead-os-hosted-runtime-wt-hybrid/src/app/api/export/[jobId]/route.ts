import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { getExportJob } from "@/lib/data-pipeline";

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  try {
    const { jobId } = await params;
    const job = await getExportJob(jobId);

    if (!job) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Export job not found" }, meta: null },
        { status: 404, headers },
      );
    }

    return NextResponse.json(
      { data: job, error: null, meta: null },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to fetch export job" }, meta: null },
      { status: 500, headers },
    );
  }
}
