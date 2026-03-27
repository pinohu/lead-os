import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { VIDEO_TEMPLATES } from "@/lib/video-pipeline";

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  return NextResponse.json(
    { data: VIDEO_TEMPLATES, error: null, meta: { count: VIDEO_TEMPLATES.length } },
    { headers },
  );
}
