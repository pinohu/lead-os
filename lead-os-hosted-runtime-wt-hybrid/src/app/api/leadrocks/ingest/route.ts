import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { searchAndIngestAsProspects } from "@/lib/integrations/leadrocks-adapter";

const IngestSchema = z.object({
  jobTitle: z.string().optional(),
  company: z.string().optional(),
  industry: z.string().optional(),
  location: z.string().optional(),
  companySize: z.string().optional(),
  seniority: z.string().optional(),
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional(),
  tenantId: z.string().optional(),
});

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { session, response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const raw = await request.json();
    const validation = IngestSchema.safeParse(raw);

    if (!validation.success) {
      return NextResponse.json(
        {
          data: null,
          error: { code: "VALIDATION_ERROR", message: "Invalid ingest parameters", details: validation.error.issues },
          meta: null,
        },
        { status: 422, headers },
      );
    }

    const { tenantId, ...searchParams } = validation.data;
    const resolvedTenantId = tenantId ?? session.email;
    const result = await searchAndIngestAsProspects(searchParams, resolvedTenantId);

    return NextResponse.json(
      {
        data: result,
        error: null,
        meta: { contactsFound: result.contactsFound, prospectsCreated: result.prospectsCreated },
      },
      { status: 201, headers },
    );
  } catch (err) {
    console.error("[leadrocks/ingest POST]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { data: null, error: { code: "INGEST_FAILED", message: "Failed to search and ingest contacts" }, meta: null },
      { status: 500, headers },
    );
  }
}
