import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { generateSeoPage, listSeoPages } from "@/lib/distribution-engine";

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const body = await request.json();
    const { niche, keyword, template } = body as {
      niche?: string;
      keyword?: string;
      template?: string;
    };

    if (!niche || !keyword) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "niche and keyword are required" }, meta: null },
        { status: 400, headers },
      );
    }

    const page = await generateSeoPage(niche, keyword, template ?? "standard");

    return NextResponse.json(
      { data: page, error: null, meta: { generatedAt: page.createdAt } },
      { status: 201, headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "GENERATION_FAILED", message: "Failed to generate SEO page" }, meta: null },
      { status: 500, headers },
    );
  }
}

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId") ?? undefined;
    const pages = listSeoPages(tenantId);

    return NextResponse.json(
      { data: pages, error: null, meta: { count: pages.length } },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to list SEO pages" }, meta: null },
      { status: 500, headers },
    );
  }
}
