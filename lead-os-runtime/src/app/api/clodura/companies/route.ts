import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { searchCompanies } from "@/lib/integrations/clodura-adapter";

const CompanySearchSchema = z.object({
  industry: z.string().optional(),
  location: z.string().optional(),
  size: z.string().optional(),
  technology: z.string().optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const raw = await request.json();
    const validation = CompanySearchSchema.safeParse(raw);

    if (!validation.success) {
      return NextResponse.json(
        {
          data: null,
          error: { code: "VALIDATION_ERROR", message: "Invalid company search parameters", details: validation.error.issues },
          meta: null,
        },
        { status: 422, headers },
      );
    }

    const companies = await searchCompanies(validation.data);

    return NextResponse.json(
      {
        data: companies,
        error: null,
        meta: { count: companies.length },
      },
      { headers },
    );
  } catch (err) {
    logger.error("clodura/companies POST failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "SEARCH_FAILED", message: "Failed to search companies" }, meta: null },
      { status: 500, headers },
    );
  }
}
