import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { deepEnrichCompany } from "@/lib/integrations/firecrawl-mcp-connector";
import { z } from "zod";

const EnrichSchema = z.object({
  domain: z.string().min(1).max(500),
});

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const raw = await request.json();
    const validation = EnrichSchema.safeParse(raw);

    if (!validation.success) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: validation.error.issues }, meta: null },
        { status: 422, headers },
      );
    }

    const profile = await deepEnrichCompany(validation.data.domain);

    return NextResponse.json(
      { data: profile, error: null, meta: null },
      { headers },
    );
  } catch (err) {
    return NextResponse.json(
      { data: null, error: { code: "ENRICH_FAILED", message: err instanceof Error ? err.message : "Company enrichment failed" }, meta: null },
      { status: 500, headers },
    );
  }
}
