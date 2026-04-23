import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { runSeoAudit, getSeoAuditHistory } from "@/lib/integrations/plerdy-adapter";

const AuditSchema = z.object({
  url: z.string().min(1).max(2048),
});

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const raw = await request.json();
    const validation = AuditSchema.safeParse(raw);

    if (!validation.success) {
      return NextResponse.json(
        {
          data: null,
          error: { code: "VALIDATION_ERROR", message: "Invalid input", details: validation.error.issues },
          meta: null,
        },
        { status: 422, headers },
      );
    }

    const audit = await runSeoAudit(validation.data.url);

    return NextResponse.json(
      { data: audit, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    logger.error("plerdy/seo POST failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "AUDIT_FAILED", message: "Failed to run SEO audit" }, meta: null },
      { status: 500, headers },
    );
  }
}

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { session, response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const url = new URL(request.url);
    const filterUrl = url.searchParams.get("url") ?? undefined;

    const history = await getSeoAuditHistory(filterUrl);

    return NextResponse.json(
      { data: history, error: null, meta: { count: history.length } },
      { headers },
    );
  } catch (err) {
    logger.error("plerdy/seo GET failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to fetch audit history" }, meta: null },
      { status: 500, headers },
    );
  }
}
