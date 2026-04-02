import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { registerDataSource, listDataSources } from "@/lib/integrations/meiro-cdp-adapter";

const RegisterSourceSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(["website", "form", "chat", "phone", "email", "api", "import"]),
  tenantId: z.string().min(1).optional(),
});

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId") ?? undefined;

    const sources = await listDataSources(tenantId);

    return NextResponse.json(
      { data: sources, error: null, meta: { count: sources.length } },
      { headers },
    );
  } catch (err) {
    logger.error("meiro/sources GET failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to list data sources" }, meta: null },
      { status: 500, headers },
    );
  }
}

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const raw = await request.json();
    const validation = RegisterSourceSchema.safeParse(raw);

    if (!validation.success) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: validation.error.issues }, meta: null },
        { status: 422, headers },
      );
    }

    const source = await registerDataSource(validation.data);

    return NextResponse.json(
      { data: source, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    logger.error("meiro/sources POST failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "CREATE_FAILED", message: "Failed to register data source" }, meta: null },
      { status: 500, headers },
    );
  }
}
