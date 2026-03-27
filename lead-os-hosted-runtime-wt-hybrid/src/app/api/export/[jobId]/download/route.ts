import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { getExportJob, getExportData } from "@/lib/data-pipeline";

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
  const corsHeaders = buildCorsHeaders(request.headers.get("origin"));
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  try {
    const { jobId } = await params;
    const job = await getExportJob(jobId);

    if (!job) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Export job not found" }, meta: null },
        { status: 404, headers: corsHeaders },
      );
    }

    if (job.status !== "completed") {
      return NextResponse.json(
        { data: null, error: { code: "NOT_READY", message: `Export job is ${job.status}` }, meta: null },
        { status: 409, headers: corsHeaders },
      );
    }

    const data = await getExportData(jobId);
    if (!data) {
      return NextResponse.json(
        { data: null, error: { code: "DATA_MISSING", message: "Export data not found" }, meta: null },
        { status: 404, headers: corsHeaders },
      );
    }

    const contentType = job.format === "csv" ? "text/csv" : "application/json";
    const extension = job.format === "csv" ? "csv" : "json";
    const filename = `lead-os-${job.type}-export-${job.id.slice(0, 8)}.${extension}`;

    return new NextResponse(data, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "DOWNLOAD_FAILED", message: "Failed to download export" }, meta: null },
      { status: 500, headers: corsHeaders },
    );
  }
}
