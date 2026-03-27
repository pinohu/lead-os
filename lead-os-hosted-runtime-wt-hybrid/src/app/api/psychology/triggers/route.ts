import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { listAllTriggers } from "@/lib/psychology-engine";

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get("category");

    let triggers = listAllTriggers();

    if (category) {
      triggers = triggers.filter((t) => t.category === category);
    }

    return NextResponse.json(
      { data: triggers, error: null, meta: { count: triggers.length } },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "LIST_FAILED", message: "Failed to list triggers" }, meta: null },
      { status: 500, headers },
    );
  }
}
