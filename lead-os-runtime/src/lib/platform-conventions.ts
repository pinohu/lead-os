// src/lib/platform-conventions.ts
// Single place to import deployment-wide rules (single-tenant + billing helpers).

export { tenantConfig } from "@/lib/tenant";
export { assertPricingExecutionAllowed, getBillingGateState, assertApiAccessTierAllows } from "@/lib/billing/entitlements";
export { requireAlignedTenant, getRequestTenantId } from "@/lib/api-mutation-guard";
