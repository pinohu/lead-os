import { NextResponse } from "next/server";
import { getPage, renderPageToHtml } from "@/lib/page-builder";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const page = getPage(id);

    if (!page) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: `Page "${id}" not found` }, meta: null },
        { status: 404 },
      );
    }

    if (page.status !== "published") {
      return NextResponse.json(
        { data: null, error: { code: "NOT_PUBLISHED", message: "Page is not published" }, meta: null },
        { status: 404 },
      );
    }

    const html = renderPageToHtml(page);

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=60, s-maxage=300",
      },
    });
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "RENDER_FAILED", message: "Failed to render page" }, meta: null },
      { status: 500 },
    );
  }
}
