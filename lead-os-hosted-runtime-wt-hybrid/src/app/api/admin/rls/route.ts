import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { generateRLSSetupSQL } from "@/lib/tenant-isolation";

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  try {
    const sql = generateRLSSetupSQL();
    return NextResponse.json(
      { data: { sql }, error: null, meta: null },
      { headers },
    );
  } catch (err) {
    logger.error("admin-rls failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "GENERATION_FAILED", message: "Failed to generate RLS SQL" }, meta: null },
      { status: 500, headers },
    );
  }
}
