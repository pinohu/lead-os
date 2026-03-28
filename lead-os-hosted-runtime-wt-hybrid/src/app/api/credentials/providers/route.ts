import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { getAvailableProviders } from "@/lib/credentials-vault";

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const providers = getAvailableProviders();

  const grouped: Record<string, typeof providers> = {};
  for (const p of providers) {
    if (!grouped[p.category]) grouped[p.category] = [];
    grouped[p.category].push(p);
  }

  return NextResponse.json(
    { data: { providers, grouped }, error: null, meta: { total: providers.length } },
    { headers },
  );
}
