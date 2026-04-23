import { NextResponse } from "next/server";
import { z } from "zod";
import { buildCorsHeaders } from "@/lib/cors";
import { validateSafe } from "@/lib/canonical-schema";
import { generateAuthoritySite } from "@/lib/integrations/authority-site-adapter";

export const dynamic = "force-dynamic";

const GenerateSiteSchema = z.object({
  tenantId: z.string().min(1).max(100),
  niche: z.string().min(1).max(100),
  businessName: z.string().min(1).max(200),
  location: z.string().min(1).max(200),
  services: z.array(z.string().min(1).max(200)).min(1).max(20),
  domain: z.string().max(253).optional(),
  template: z.string().min(1).max(100),
});

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  try {
    const body = await request.json();
    const validation = validateSafe(GenerateSiteSchema, body);
    if (!validation.valid) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Validation failed", details: validation.errors }, meta: null },
        { status: 422, headers },
      );
    }

    const site = await generateAuthoritySite(validation.data!.tenantId, {
      niche: validation.data!.niche,
      businessName: validation.data!.businessName,
      location: validation.data!.location,
      services: validation.data!.services,
      domain: validation.data!.domain,
      template: validation.data!.template,
    });

    return NextResponse.json(
      { data: site, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Site generation failed";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json(
      { data: null, error: { code: "GENERATE_FAILED", message }, meta: null },
      { status, headers },
    );
  }
}
