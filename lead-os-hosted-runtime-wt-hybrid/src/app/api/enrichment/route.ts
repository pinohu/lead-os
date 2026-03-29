import { NextResponse } from "next/server";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import {
  enrichAndStore,
  getEnrichmentStats,
  type PersonEnrichmentInput,
  type CompanyEnrichmentInput,
} from "@/lib/integrations/databar-adapter";

export async function POST(request: Request) {
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "INVALID_JSON", message: "Request body must be valid JSON" }, meta: null },
      { status: 400 },
    );
  }

  const type = body.type as string | undefined;
  if (type !== "person" && type !== "company") {
    return NextResponse.json(
      { data: null, error: { code: "VALIDATION_FAILED", message: "type must be \"person\" or \"company\"" }, meta: null },
      { status: 400 },
    );
  }

  const tenantId = (body.tenantId as string) ?? undefined;

  if (type === "person") {
    const input: PersonEnrichmentInput = {
      email: body.email as string | undefined,
      linkedinUrl: body.linkedinUrl as string | undefined,
      firstName: body.firstName as string | undefined,
      lastName: body.lastName as string | undefined,
      company: body.company as string | undefined,
    };

    if (!input.email && !input.linkedinUrl && !(input.firstName && input.lastName && input.company)) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_FAILED", message: "Provide email, linkedinUrl, or firstName+lastName+company" }, meta: null },
        { status: 400 },
      );
    }

    const result = await enrichAndStore(input, "person", tenantId);
    return NextResponse.json({ data: result, error: null, meta: null }, { status: result.ok ? 200 : 500 });
  }

  const input: CompanyEnrichmentInput = {
    domain: body.domain as string | undefined,
    name: body.name as string | undefined,
    linkedinUrl: body.linkedinUrl as string | undefined,
  };

  if (!input.domain && !input.name && !input.linkedinUrl) {
    return NextResponse.json(
      { data: null, error: { code: "VALIDATION_FAILED", message: "Provide domain, name, or linkedinUrl" }, meta: null },
      { status: 400 },
    );
  }

  const result = await enrichAndStore(input, "company", tenantId);
  return NextResponse.json({ data: result, error: null, meta: null }, { status: result.ok ? 200 : 500 });
}

export async function GET(request: Request) {
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  const url = new URL(request.url);
  const tenantId = url.searchParams.get("tenantId") ?? undefined;
  const stats = await getEnrichmentStats(tenantId);

  return NextResponse.json({ data: stats, error: null, meta: null });
}
