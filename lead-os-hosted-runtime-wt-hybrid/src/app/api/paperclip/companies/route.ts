import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { createCompany, listCompanies } from "@/lib/integrations/paperclip-connector";
import { z } from "zod";

const OrgNodeSchema = z.object({
  role: z.string().min(1).max(200),
  reportsTo: z.string().max(200).optional(),
  agentId: z.string().max(200).optional(),
});

const CreateCompanySchema = z.object({
  tenantId: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  orgChart: z.array(OrgNodeSchema).optional(),
});

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const companies = await listCompanies();

    return NextResponse.json(
      { data: companies, error: null, meta: { count: companies.length } },
      { headers },
    );
  } catch (err) {
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: err instanceof Error ? err.message : "Failed to list companies" }, meta: null },
      { status: 500, headers },
    );
  }
}

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const raw = await request.json();
    const validation = CreateCompanySchema.safeParse(raw);

    if (!validation.success) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: validation.error.issues }, meta: null },
        { status: 422, headers },
      );
    }

    const { tenantId, ...config } = validation.data;
    const company = await createCompany(tenantId, config);

    return NextResponse.json(
      { data: company, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    return NextResponse.json(
      { data: null, error: { code: "CREATE_FAILED", message: err instanceof Error ? err.message : "Failed to create company" }, meta: null },
      { status: 500, headers },
    );
  }
}
