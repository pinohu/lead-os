import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import {
  searchContacts,
  getStoredContacts,
} from "@/lib/integrations/clodura-adapter";

const SearchSchema = z.object({
  companyName: z.string().optional(),
  industry: z.string().optional(),
  location: z.string().optional(),
  companySize: z.string().optional(),
  revenue: z.string().optional(),
  technology: z.string().optional(),
  jobTitle: z.string().optional(),
  department: z.string().optional(),
  seniority: z.string().optional(),
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional(),
});

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const raw = await request.json();
    const validation = SearchSchema.safeParse(raw);

    if (!validation.success) {
      return NextResponse.json(
        {
          data: null,
          error: { code: "VALIDATION_ERROR", message: "Invalid search parameters", details: validation.error.issues },
          meta: null,
        },
        { status: 422, headers },
      );
    }

    const result = await searchContacts(validation.data);

    return NextResponse.json(
      {
        data: result,
        error: null,
        meta: { total: result.total, creditsUsed: result.creditsUsed, hasMore: result.hasMore },
      },
      { headers },
    );
  } catch (err) {
    logger.error("clodura/search POST failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "SEARCH_FAILED", message: "Failed to search contacts" }, meta: null },
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
    const tenantId = url.searchParams.get("tenantId") ?? session.email;
    const limitParam = url.searchParams.get("limit");
    const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 100, 1), 100) : 100;

    const contacts = await getStoredContacts(tenantId, limit);

    return NextResponse.json(
      { data: contacts, error: null, meta: { count: contacts.length } },
      { headers },
    );
  } catch (err) {
    logger.error("clodura/search GET failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to retrieve stored contacts" }, meta: null },
      { status: 500, headers },
    );
  }
}
