import { NextResponse } from "next/server";
import { buildCorsHeaders } from "@/lib/cors";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { getTenant, updateTenant } from "@/lib/tenant-store";

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

const MAX_TENANT_ID_LENGTH = 64;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  try {
    const { tenantId } = await params;

    if (!tenantId || tenantId.length > MAX_TENANT_ID_LENGTH) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Tenant not found" }, meta: null },
        { status: 404, headers },
      );
    }

    const tenant = await getTenant(tenantId);
    if (!tenant) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Tenant not found" }, meta: null },
        { status: 404, headers },
      );
    }

    return NextResponse.json(
      { data: tenant, error: null, meta: null },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "FETCH_FAILED", message: "Failed to fetch tenant" }, meta: null },
      { status: 500, headers },
    );
  }
}

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/;
const MAX_BRAND_NAME_LENGTH = 200;
const MAX_URL_LENGTH = 500;
const MAX_EMAIL_LENGTH = 254;
const VALID_STATUSES = new Set(["provisioning", "active", "suspended", "cancelled"]);
const VALID_REVENUE_MODELS = new Set(["managed", "white-label", "implementation", "directory"]);
const VALID_PLANS = new Set(["starter", "growth", "enterprise", "custom"]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> },
) {
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

    const { tenantId } = await params;

    if (!tenantId || tenantId.length > MAX_TENANT_ID_LENGTH) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Tenant not found" }, meta: null },
        { status: 404, headers },
      );
    }

    const existing = await getTenant(tenantId);
    if (!existing) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Tenant not found" }, meta: null },
        { status: 404, headers },
      );
    }

    const body = await request.json();
    const patch: Record<string, unknown> = {};

    if (body.slug !== undefined) {
      if (typeof body.slug !== "string" || !SLUG_PATTERN.test(body.slug)) {
        return NextResponse.json(
          { data: null, error: { code: "VALIDATION_ERROR", message: "slug must be 3-50 lowercase alphanumeric characters with hyphens" }, meta: null },
          { status: 400, headers },
        );
      }
      patch.slug = body.slug;
    }

    if (body.brandName !== undefined) {
      if (typeof body.brandName !== "string" || body.brandName.trim().length === 0 || body.brandName.length > MAX_BRAND_NAME_LENGTH) {
        return NextResponse.json(
          { data: null, error: { code: "VALIDATION_ERROR", message: "brandName must be a non-empty string" }, meta: null },
          { status: 400, headers },
        );
      }
      patch.brandName = body.brandName.trim();
    }

    if (body.siteUrl !== undefined) {
      if (typeof body.siteUrl !== "string" || body.siteUrl.trim().length === 0 || body.siteUrl.length > MAX_URL_LENGTH) {
        return NextResponse.json(
          { data: null, error: { code: "VALIDATION_ERROR", message: "siteUrl must be a valid non-empty string" }, meta: null },
          { status: 400, headers },
        );
      }
      patch.siteUrl = body.siteUrl.trim();
    }

    if (body.supportEmail !== undefined) {
      if (typeof body.supportEmail !== "string" || body.supportEmail.trim().length === 0 || body.supportEmail.length > MAX_EMAIL_LENGTH) {
        return NextResponse.json(
          { data: null, error: { code: "VALIDATION_ERROR", message: "supportEmail must be a valid non-empty string" }, meta: null },
          { status: 400, headers },
        );
      }
      patch.supportEmail = body.supportEmail.trim();
    }

    if (body.status !== undefined) {
      if (!VALID_STATUSES.has(body.status)) {
        return NextResponse.json(
          { data: null, error: { code: "VALIDATION_ERROR", message: `status must be one of: ${[...VALID_STATUSES].join(", ")}` }, meta: null },
          { status: 400, headers },
        );
      }
      patch.status = body.status;
    }

    if (body.revenueModel !== undefined) {
      if (!VALID_REVENUE_MODELS.has(body.revenueModel)) {
        return NextResponse.json(
          { data: null, error: { code: "VALIDATION_ERROR", message: `revenueModel must be one of: ${[...VALID_REVENUE_MODELS].join(", ")}` }, meta: null },
          { status: 400, headers },
        );
      }
      patch.revenueModel = body.revenueModel;
    }

    if (body.plan !== undefined) {
      if (!VALID_PLANS.has(body.plan)) {
        return NextResponse.json(
          { data: null, error: { code: "VALIDATION_ERROR", message: `plan must be one of: ${[...VALID_PLANS].join(", ")}` }, meta: null },
          { status: 400, headers },
        );
      }
      patch.plan = body.plan;
    }

    if (body.accent !== undefined) {
      if (typeof body.accent !== "string") {
        return NextResponse.json(
          { data: null, error: { code: "VALIDATION_ERROR", message: "accent must be a string" }, meta: null },
          { status: 400, headers },
        );
      }
      patch.accent = body.accent.trim();
    }

    if (body.widgetOrigins !== undefined) {
      if (!Array.isArray(body.widgetOrigins)) {
        return NextResponse.json(
          { data: null, error: { code: "VALIDATION_ERROR", message: "widgetOrigins must be an array" }, meta: null },
          { status: 400, headers },
        );
      }
      patch.widgetOrigins = body.widgetOrigins.filter((o: unknown) => typeof o === "string");
    }

    if (body.enabledFunnels !== undefined) {
      if (!Array.isArray(body.enabledFunnels)) {
        return NextResponse.json(
          { data: null, error: { code: "VALIDATION_ERROR", message: "enabledFunnels must be an array" }, meta: null },
          { status: 400, headers },
        );
      }
      patch.enabledFunnels = body.enabledFunnels.filter((f: unknown) => typeof f === "string");
    }

    if (body.channels !== undefined) {
      if (typeof body.channels !== "object" || body.channels === null) {
        return NextResponse.json(
          { data: null, error: { code: "VALIDATION_ERROR", message: "channels must be an object" }, meta: null },
          { status: 400, headers },
        );
      }
      patch.channels = body.channels;
    }

    if (body.operatorEmails !== undefined) {
      if (!Array.isArray(body.operatorEmails) || body.operatorEmails.length === 0) {
        return NextResponse.json(
          { data: null, error: { code: "VALIDATION_ERROR", message: "operatorEmails must be a non-empty array" }, meta: null },
          { status: 400, headers },
        );
      }
      patch.operatorEmails = body.operatorEmails.map((e: string) => e.trim().toLowerCase());
    }

    if (body.providerConfig !== undefined) {
      if (typeof body.providerConfig !== "object" || body.providerConfig === null) {
        return NextResponse.json(
          { data: null, error: { code: "VALIDATION_ERROR", message: "providerConfig must be an object" }, meta: null },
          { status: 400, headers },
        );
      }
      patch.providerConfig = body.providerConfig;
    }

    if (body.metadata !== undefined) {
      if (typeof body.metadata !== "object" || body.metadata === null) {
        return NextResponse.json(
          { data: null, error: { code: "VALIDATION_ERROR", message: "metadata must be an object" }, meta: null },
          { status: 400, headers },
        );
      }
      patch.metadata = body.metadata;
    }

    if (body.stripeCustomerId !== undefined) {
      patch.stripeCustomerId = body.stripeCustomerId;
    }
    if (body.stripeSubscriptionId !== undefined) {
      patch.stripeSubscriptionId = body.stripeSubscriptionId;
    }

    const updated = await updateTenant(tenantId, patch);
    if (!updated) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Tenant not found" }, meta: null },
        { status: 404, headers },
      );
    }

    return NextResponse.json(
      { data: updated, error: null, meta: null },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "UPDATE_FAILED", message: "Failed to update tenant" }, meta: null },
      { status: 400, headers },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> },
) {
  const headers = buildCorsHeaders(request.headers.get("origin"));
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return auth.response;

  try {
    const { tenantId } = await params;

    if (!tenantId || tenantId.length > MAX_TENANT_ID_LENGTH) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Tenant not found" }, meta: null },
        { status: 404, headers },
      );
    }

    const updated = await updateTenant(tenantId, { status: "cancelled" });
    if (!updated) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Tenant not found" }, meta: null },
        { status: 404, headers },
      );
    }

    return NextResponse.json(
      { data: updated, error: null, meta: null },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "DELETE_FAILED", message: "Failed to cancel tenant" }, meta: null },
      { status: 500, headers },
    );
  }
}
