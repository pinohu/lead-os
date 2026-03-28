import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { search, LEAD_OS_INDEXES } from "@/lib/integrations/search-engine";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  const { searchParams } = new URL(request.url);
  const index = searchParams.get("index");
  const query = searchParams.get("q") ?? "";

  if (!index) {
    return NextResponse.json(
      { data: null, error: { code: "VALIDATION_ERROR", message: "index query parameter is required" }, meta: null },
      { status: 400, headers },
    );
  }

  const knownIndexes = LEAD_OS_INDEXES.map((i) => i.name);
  if (!knownIndexes.includes(index)) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "VALIDATION_ERROR",
          message: `Unknown index "${index}". Valid indexes: ${knownIndexes.join(", ")}`,
        },
        meta: null,
      },
      { status: 400, headers },
    );
  }

  const rawLimit = parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10);
  const limit = isNaN(rawLimit) || rawLimit < 1 ? DEFAULT_LIMIT : Math.min(rawLimit, MAX_LIMIT);
  const offset = Math.max(0, parseInt(searchParams.get("offset") ?? "0", 10) || 0);
  const filters = searchParams.get("filters") ?? undefined;
  const sortParam = searchParams.get("sort");
  const sort = sortParam ? sortParam.split(",").map((s) => s.trim()).filter(Boolean) : undefined;
  const facetsParam = searchParams.get("facets");
  const facets = facetsParam ? facetsParam.split(",").map((s) => s.trim()).filter(Boolean) : undefined;

  try {
    const result = await search(index, query, { filters, sort, limit, offset, facets });
    return NextResponse.json(
      { data: result, error: null, meta: { index, query, limit, offset } },
      { status: 200, headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "SEARCH_ERROR", message: "Search failed" }, meta: null },
      { status: 500, headers },
    );
  }
}
