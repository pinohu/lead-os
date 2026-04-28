// src/lib/api/cron-public-guards.ts
// Defense-in-depth for cron and public allowlist routes (tenant + auth).

import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server.js";
import { tenantConfig } from "../tenant.ts";
import { pricingLog } from "../pricing/logger.ts";

function timingSafeEqualStr(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/**
 * Cron routes must not rely on middleware alone. Validates CRON_SECRET via
 * Authorization: Bearer (non-session, non-api-key) or x-cron-secret.
 */
export function requireCronAuthOrFail(request: Request): NextResponse | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    pricingLog("warn", "cron_auth_missing_secret", {});
    return NextResponse.json(
      { data: null, error: { code: "SERVICE_UNAVAILABLE", message: "Cron not configured" } },
      { status: 503 },
    );
  }

  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ?? "";
  const header = request.headers.get("x-cron-secret") ?? "";

  const bearerOk =
    Boolean(bearer) &&
    !bearer.startsWith("los_") &&
    !bearer.startsWith("sess_") &&
    timingSafeEqualStr(bearer, secret);
  const headerOk = Boolean(header) && timingSafeEqualStr(header, secret);

  if (!bearerOk && !headerOk) {
    pricingLog("warn", "cron_auth_failed", { path: new URL(request.url).pathname });
    return NextResponse.json(
      { data: null, error: { code: "UNAUTHORIZED", message: "Cron authentication required" } },
      { status: 401 },
    );
  }

  return null;
}

/**
 * When single-tenant enforcement is on, reject tenant identifiers that are not this deployment.
 */
export function requireDeployTenantIdOrFail(tenantId: string, context: string): NextResponse | null {
  if (process.env.LEAD_OS_SINGLE_TENANT_ENFORCE === "false") return null;
  if (tenantId !== tenantConfig.tenantId) {
    pricingLog("warn", "cron_tenant_mismatch", { context, tenantId, deployTenant: tenantConfig.tenantId });
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "TENANT_MISMATCH",
          message: "tenantId does not match LEAD_OS_TENANT_ID for this deployment",
        },
      },
      { status: 403 },
    );
  }
  return null;
}

export interface SafePublicExecutionInput {
  resolvedTenantId: string;
  pathname: string;
  method: string;
}

/**
 * Public routes must not resolve to a different tenant than this deployment when enforced.
 */
export function requireSafePublicExecution(ctx: SafePublicExecutionInput): NextResponse | null {
  if (process.env.LEAD_OS_SINGLE_TENANT_ENFORCE === "false") return null;
  if (ctx.resolvedTenantId !== tenantConfig.tenantId) {
    pricingLog("warn", "public_route_tenant_blocked", {
      pathname: ctx.pathname,
      method: ctx.method,
      resolvedTenantId: ctx.resolvedTenantId,
      deployTenant: tenantConfig.tenantId,
    });
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "TENANT_MISMATCH",
          message: "Tenant is not allowed on this deployment",
        },
      },
      { status: 403 },
    );
  }
  return null;
}
