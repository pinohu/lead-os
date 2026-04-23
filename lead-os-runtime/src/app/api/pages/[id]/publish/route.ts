import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { publishPage } from "@/lib/page-builder";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  try {
    const { id } = await params;
    const page = publishPage(id);

    if (!page) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: `Page "${id}" not found` }, meta: null },
        { status: 404, headers },
      );
    }

    return NextResponse.json({ data: page, error: null, meta: null }, { headers });
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "PUBLISH_FAILED", message: "Failed to publish page" }, meta: null },
      { status: 500, headers },
    );
  }
}
