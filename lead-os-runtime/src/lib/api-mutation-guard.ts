// src/lib/api-mutation-guard.ts
// Tenant alignment for authenticated API routes (operator + tenant users).

import { tenantConfig } from "@/lib/tenant";

export function getRequestTenantId(request: Request): string | null {
  return request.headers.get("x-authenticated-tenant-id");
}

/**
 * Returns true when the caller's tenant header matches this deployment's primary tenant,
 * or when no tenant header is present (operator cookie path — tenant comes from env config).
 */
export function isTenantAlignedWithDeployment(request: Request): boolean {
  const headerTenant = getRequestTenantId(request);
  if (!headerTenant) return true;
  return headerTenant === tenantConfig.tenantId;
}

export function requireAlignedTenant(request: Request): { ok: true } | { ok: false; status: 403; message: string } {
  if (!isTenantAlignedWithDeployment(request)) {
    return { ok: false, status: 403, message: "tenant_mismatch" };
  }
  return { ok: true };
}
