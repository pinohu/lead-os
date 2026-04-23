import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { createTenant, listTenants, type CreateTenantInput } from "@/lib/tenant-store";

export async function GET(request: Request) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  try {
    const url = new URL(request.url);
    const status = url.searchParams.get("status") as CreateTenantInput["status"] | null;
    const revenueModel = url.searchParams.get("revenueModel") as CreateTenantInput["revenueModel"] | null;

    const tenants = await listTenants({
      status: status ?? undefined,
      revenueModel: revenueModel ?? undefined,
    });

    return NextResponse.json(
      { data: tenants, error: null, meta: { count: tenants.length } },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "LIST_FAILED", message: "Failed to list tenants" }, meta: null },
      { status: 500, headers },
    );
  }
}

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/;
const MAX_BRAND_NAME_LENGTH = 200;
const MAX_URL_LENGTH = 500;
const MAX_EMAIL_LENGTH = 254;
const MAX_NICHE_LENGTH = 100;
const MAX_OPERATOR_EMAILS = 50;
const VALID_REVENUE_MODELS = new Set(["managed", "white-label", "implementation", "directory"]);
const VALID_PLANS = new Set(["starter", "growth", "enterprise", "custom"]);

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
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "slug must be 3-50 lowercase alphanumeric characters with hyphens, starting and ending with alphanumeric" }, meta: null },
        { status: 400, headers },
      );
    }

    if (!body.brandName || typeof body.brandName !== "string" || body.brandName.trim().length === 0) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "brandName is required" }, meta: null },
        { status: 400, headers },
      );
    }
    if (body.brandName.length > MAX_BRAND_NAME_LENGTH) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: `brandName must not exceed ${MAX_BRAND_NAME_LENGTH} characters` }, meta: null },
        { status: 400, headers },
      );
    }

    if (!body.siteUrl || typeof body.siteUrl !== "string" || body.siteUrl.trim().length === 0) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "siteUrl is required" }, meta: null },
        { status: 400, headers },
      );
    }
    if (body.siteUrl.length > MAX_URL_LENGTH) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: `siteUrl must not exceed ${MAX_URL_LENGTH} characters` }, meta: null },
        { status: 400, headers },
      );
    }

    if (!body.supportEmail || typeof body.supportEmail !== "string" || body.supportEmail.trim().length === 0) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "supportEmail is required" }, meta: null },
        { status: 400, headers },
      );
    }
    if (body.supportEmail.length > MAX_EMAIL_LENGTH) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: `supportEmail must not exceed ${MAX_EMAIL_LENGTH} characters` }, meta: null },
        { status: 400, headers },
      );
    }

    if (!body.defaultNiche || typeof body.defaultNiche !== "string" || body.defaultNiche.trim().length === 0) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "defaultNiche is required" }, meta: null },
        { status: 400, headers },
      );
    }
    if (body.defaultNiche.length > MAX_NICHE_LENGTH) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: `defaultNiche must not exceed ${MAX_NICHE_LENGTH} characters` }, meta: null },
        { status: 400, headers },
      );
    }

    if (!body.revenueModel || !VALID_REVENUE_MODELS.has(body.revenueModel)) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: `revenueModel must be one of: ${[...VALID_REVENUE_MODELS].join(", ")}` }, meta: null },
        { status: 400, headers },
      );
    }

    if (!body.plan || !VALID_PLANS.has(body.plan)) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: `plan must be one of: ${[...VALID_PLANS].join(", ")}` }, meta: null },
        { status: 400, headers },
      );
    }

    if (!body.operatorEmails || !Array.isArray(body.operatorEmails) || body.operatorEmails.length === 0) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "operatorEmails must be a non-empty array" }, meta: null },
        { status: 400, headers },
      );
    }
    if (body.operatorEmails.length > MAX_OPERATOR_EMAILS) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: `operatorEmails must not exceed ${MAX_OPERATOR_EMAILS} entries` }, meta: null },
        { status: 400, headers },
      );
    }
    for (const email of body.operatorEmails) {
      if (typeof email !== "string" || email.trim().length === 0 || email.length > MAX_EMAIL_LENGTH) {
        return NextResponse.json(
          { data: null, error: { code: "VALIDATION_ERROR", message: "Each operatorEmail must be a valid non-empty string" }, meta: null },
          { status: 400, headers },
        );
      }
    }

    const input: CreateTenantInput = {
      slug: body.slug,
      brandName: body.brandName.trim(),
      siteUrl: body.siteUrl.trim(),
      supportEmail: body.supportEmail.trim(),
      defaultService: typeof body.defaultService === "string" ? body.defaultService.trim() : "lead-capture",
      defaultNiche: body.defaultNiche.trim(),
      widgetOrigins: Array.isArray(body.widgetOrigins) ? body.widgetOrigins.filter((o: unknown) => typeof o === "string") : [],
      accent: typeof body.accent === "string" ? body.accent.trim() : "#14b8a6",
      enabledFunnels: Array.isArray(body.enabledFunnels)
        ? body.enabledFunnels.filter((f: unknown) => typeof f === "string")
        : ["lead-magnet", "qualification", "chat", "webinar", "authority", "checkout", "retention", "rescue", "referral", "continuity"],
      channels: body.channels ?? { email: true, whatsapp: false, sms: false, chat: false, voice: false },
      revenueModel: body.revenueModel,
      plan: body.plan,
      status: "provisioning",
      operatorEmails: body.operatorEmails.map((e: string) => e.trim().toLowerCase()),
      providerConfig: typeof body.providerConfig === "object" && body.providerConfig !== null ? body.providerConfig : {},
      metadata: typeof body.metadata === "object" && body.metadata !== null ? body.metadata : {},
    };

    const tenant = await createTenant(input);

    return NextResponse.json(
      { data: tenant, error: null, meta: null },
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
      { data: null, error: { code: "CREATE_FAILED", message: "Failed to create tenant" }, meta: null },
      { status: 400, headers },
    );
  }
}
