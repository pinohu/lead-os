import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { getDeployment } from "@/lib/auto-deploy";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const { jobId } = await params;

  const job = getDeployment(jobId);
  if (!job) {
    return NextResponse.json(
      { data: null, error: { code: "NOT_FOUND", message: `Deployment not found: ${jobId}` }, meta: null },
      { status: 404, headers },
    );
  }

  return NextResponse.json(
    { data: job, error: null, meta: null },
    { headers },
  );
}
