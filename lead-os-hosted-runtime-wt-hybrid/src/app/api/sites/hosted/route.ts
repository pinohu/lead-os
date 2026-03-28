import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { validateSafe } from "@/lib/canonical-schema";
import { provisionSubdomain, listSites } from "@/lib/integrations/hosted-runtime-adapter";

export const dynamic = "force-dynamic";

const ProvisionSchema = z.object({
  tenantId: z.string().min(1).max(100),
  subdomain: z.string().min(1).max(63).regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/),
  templateId: z.string().max(100).optional(),
  customDomain: z.string().max(253).optional(),
  sslEnabled: z.boolean().default(true),
  cdnEnabled: z.boolean().default(true),
});

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenantId");

  if (!tenantId) {
    return NextResponse.json(
      { data: null, error: { code: "VALIDATION_ERROR", message: "tenantId query parameter is required" }, meta: null },
      { status: 400, headers },
    );
  }

  const sites = await listSites(tenantId);
  return NextResponse.json(
    { data: sites, error: null, meta: { total: sites.length } },
    { headers },
  );
}

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const body = await request.json();
    const validation = validateSafe(ProvisionSchema, body);
    if (!validation.valid) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Validation failed", details: validation.errors }, meta: null },
        { status: 422, headers },
      );
    }

    const { tenantId, subdomain, templateId, customDomain, sslEnabled, cdnEnabled } = validation.data!;
    const site = await provisionSubdomain(tenantId, { subdomain, templateId, customDomain, sslEnabled, cdnEnabled });

    return NextResponse.json(
      { data: site, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Provisioning failed";
    const status = message.includes("already taken") ? 409 : 500;
    return NextResponse.json(
      { data: null, error: { code: "PROVISION_FAILED", message }, meta: null },
      { status, headers },
    );
  }
}
