import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import {
  provisionTenant,
  type ProvisionTenantInput,
} from "@/lib/tenant-provisioner";

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

const SLUG_PATTERN = /^[a-z][a-z0-9-]{1,48}[a-z0-9]$/;
const MAX_BRAND_NAME_LENGTH = 200;
const MAX_URL_LENGTH = 500;
const MAX_EMAIL_LENGTH = 254;
const MAX_NICHE_LENGTH = 100;
const VALID_REVENUE_MODELS = new Set(["managed", "white-label", "implementation", "directory"]);
const VALID_PLANS = new Set(["starter", "growth", "enterprise", "custom"]);

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function validationError(headers: Record<string, string>, message: string) {
  return NextResponse.json(
    { data: null, error: { code: "VALIDATION_ERROR", message }, meta: null },
    { status: 400, headers },
  );
}

export async function POST(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Content-Type must be application/json" }, meta: null },
        { status: 415, headers },
      );
    }

    const body = await request.json();

    if (!body.slug || typeof body.slug !== "string" || !SLUG_PATTERN.test(body.slug)) {
      return validationError(headers, "slug must be 3-50 lowercase alphanumeric characters with hyphens, starting with a letter");
    }

    if (!body.brandName || typeof body.brandName !== "string" || body.brandName.trim().length === 0) {
      return validationError(headers, "brandName is required");
    }
    if (body.brandName.length > MAX_BRAND_NAME_LENGTH) {
      return validationError(headers, `brandName must not exceed ${MAX_BRAND_NAME_LENGTH} characters`);
    }

    if (!body.siteUrl || typeof body.siteUrl !== "string" || body.siteUrl.trim().length === 0) {
      return validationError(headers, "siteUrl is required");
    }
    if (body.siteUrl.length > MAX_URL_LENGTH) {
      return validationError(headers, `siteUrl must not exceed ${MAX_URL_LENGTH} characters`);
    }
    if (!isValidUrl(body.siteUrl)) {
      return validationError(headers, "siteUrl must be a valid URL with http or https protocol");
    }

    if (!body.supportEmail || typeof body.supportEmail !== "string" || !body.supportEmail.includes("@")) {
      return validationError(headers, "supportEmail is required and must contain @");
    }
    if (body.supportEmail.length > MAX_EMAIL_LENGTH) {
      return validationError(headers, `supportEmail must not exceed ${MAX_EMAIL_LENGTH} characters`);
    }

    if (!body.operatorEmail || typeof body.operatorEmail !== "string" || !body.operatorEmail.includes("@")) {
      return validationError(headers, "operatorEmail is required and must contain @");
    }
    if (body.operatorEmail.length > MAX_EMAIL_LENGTH) {
      return validationError(headers, `operatorEmail must not exceed ${MAX_EMAIL_LENGTH} characters`);
    }

    if (!body.niche || typeof body.niche !== "string" || body.niche.trim().length === 0) {
      return validationError(headers, "niche is required");
    }
    if (body.niche.length > MAX_NICHE_LENGTH) {
      return validationError(headers, `niche must not exceed ${MAX_NICHE_LENGTH} characters`);
    }

    if (!body.revenueModel || !VALID_REVENUE_MODELS.has(body.revenueModel)) {
      return validationError(headers, `revenueModel must be one of: ${[...VALID_REVENUE_MODELS].join(", ")}`);
    }

    if (!body.plan || !VALID_PLANS.has(body.plan)) {
      return validationError(headers, `plan must be one of: ${[...VALID_PLANS].join(", ")}`);
    }

    const input: ProvisionTenantInput = {
      slug: body.slug,
      brandName: body.brandName.trim(),
      siteUrl: body.siteUrl.trim(),
      supportEmail: body.supportEmail.trim(),
      operatorEmail: body.operatorEmail.trim().toLowerCase(),
      niche: body.niche.trim(),
      industry: typeof body.industry === "string" ? body.industry.trim() : undefined,
      revenueModel: body.revenueModel,
      plan: body.plan,
      accent: typeof body.accent === "string" ? body.accent.trim() : undefined,
      enabledFunnels: Array.isArray(body.enabledFunnels)
        ? body.enabledFunnels.filter((f: unknown) => typeof f === "string")
        : undefined,
      channels: typeof body.channels === "object" && body.channels !== null
        ? body.channels
        : undefined,
    };

    const result = await provisionTenant(input);

    return NextResponse.json(
      { data: result, error: null, meta: null },
      { status: 201, headers },
    );
  } catch (error) {
    const isDuplicate = error instanceof Error && error.message.includes("unique");
    if (isDuplicate) {
      return NextResponse.json(
        { data: null, error: { code: "CONFLICT", message: "A tenant with this slug already exists" }, meta: null },
        { status: 409, headers },
      );
    }
    return NextResponse.json(
      { data: null, error: { code: "PROVISION_FAILED", message: "Failed to provision tenant" }, meta: null },
      { status: 500, headers },
    );
  }
}
