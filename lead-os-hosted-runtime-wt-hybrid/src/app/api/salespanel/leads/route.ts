import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { createLead, listLeads } from "@/lib/integrations/salespanel-adapter";

const CreateLeadSchema = z.object({
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  company: z.string().optional(),
  source: z.enum(["website", "email", "form", "chat", "api", "import"]).optional(),
  tenantId: z.string().optional(),
});

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const raw = await request.json();
    const validation = CreateLeadSchema.safeParse(raw);

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

    const lead = await createLead(validation.data);

    return NextResponse.json(
      { data: lead, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    logger.error("salespanel/leads POST failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "CREATE_FAILED", message: "Failed to create lead" }, meta: null },
      { status: 500, headers },
    );
  }
}

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  const { response: authError } = await requireOperatorApiSession(request);
  if (authError) return authError;

  try {
    const url = new URL(request.url);
    const source = url.searchParams.get("source") ?? undefined;
    const temperature = url.searchParams.get("temperature") ?? undefined;
    const minScoreParam = url.searchParams.get("minScore");
    const minScore = minScoreParam ? Number(minScoreParam) : undefined;
    const tenantId = url.searchParams.get("tenantId") ?? undefined;

    const leads = await listLeads({
      source: source as "website" | "email" | "form" | "chat" | "api" | "import" | undefined,
      temperature,
      minScore,
      tenantId,
    });

    return NextResponse.json(
      { data: leads, error: null, meta: { count: leads.length } },
      { headers },
    );
  } catch (err) {
    logger.error("salespanel/leads GET failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { data: null, error: { code: "LIST_FAILED", message: "Failed to list leads" }, meta: null },
      { status: 500, headers },
    );
  }
}
