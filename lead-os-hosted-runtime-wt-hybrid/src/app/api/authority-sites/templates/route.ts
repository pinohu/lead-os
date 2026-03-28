import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { listNicheTemplates } from "@/lib/integrations/authority-site-adapter";

export const dynamic = "force-dynamic";

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const templates = listNicheTemplates();

  return NextResponse.json(
    { data: templates, error: null, meta: { total: templates.length } },
    { headers },
  );
}
