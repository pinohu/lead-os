import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { getCrawlStatus } from "@/lib/integrations/firecrawl-adapter";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const { jobId } = await params;

  try {
    const status = await getCrawlStatus(jobId);

    return NextResponse.json(
      { data: status, error: null, meta: null },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "NOT_FOUND", message: `Crawl job ${jobId} not found` }, meta: null },
      { status: 404, headers },
    );
  }
}
