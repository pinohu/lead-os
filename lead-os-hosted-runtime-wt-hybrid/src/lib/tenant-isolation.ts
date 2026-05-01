import { createRateLimiter } from "./rate-limiter.ts";

export interface RateLimitEntry {
  tenantId: string;
  endpoint: string;
  windowStart: number;
  count: number;
}

export interface TenantQuota {
  tenantId: string;
  maxLeadsPerMinute: number;
  maxApiCallsPerMinute: number;
  maxEmailsPerHour: number;
  maxStorageMB: number;
}

const PLAN_QUOTAS: Record<string, TenantQuota> = {
  starter: {
    tenantId: "",
    maxLeadsPerMinute: 10,
    maxApiCallsPerMinute: 60,
    maxEmailsPerHour: 100,
    maxStorageMB: 500,
  },
  growth: {
    tenantId: "",
    maxLeadsPerMinute: 50,
    maxApiCallsPerMinute: 300,
    maxEmailsPerHour: 1000,
    maxStorageMB: 5000,
  },
  enterprise: {
    tenantId: "",
    maxLeadsPerMinute: 200,
    maxApiCallsPerMinute: 1200,
    maxEmailsPerHour: 10000,
    maxStorageMB: 50000,
  },
  custom: {
    tenantId: "",
    maxLeadsPerMinute: 500,
    maxApiCallsPerMinute: 3000,
    maxEmailsPerHour: 50000,
    maxStorageMB: 100000,
  },
};

const rateLimiters = new Map<string, ReturnType<typeof createRateLimiter>>();

function getOrCreateLimiter(windowMs: number, limit: number): ReturnType<typeof createRateLimiter> {
  const key = `${windowMs}:${limit}`;
  let limiter = rateLimiters.get(key);
  if (!limiter) {
    limiter = createRateLimiter({ windowMs, maxRequests: limit });
    rateLimiters.set(key, limiter);
  }
  return limiter;
}

export function checkRateLimit(
  tenantId: string,
  endpoint: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; remaining: number; resetAt: number } {
  const limiter = getOrCreateLimiter(windowMs, limit);
  const key = `${tenantId}:${endpoint}`;
  return limiter.check(key);
}

export function getTenantQuota(tenantId: string, plan?: string): TenantQuota {
  const tier = plan ?? "starter";
  const base = PLAN_QUOTAS[tier] ?? PLAN_QUOTAS.starter;
  return { ...base, tenantId };
}

const LEAD_OS_TABLES = [
  { table: "lead_os_leads", column: "tenant_id" },
  { table: "lead_os_events", column: "tenant_id" },
  { table: "lead_os_email_tracking", column: "tenant_id" },
  { table: "lead_os_attribution_touches", column: "tenant_id" },
  { table: "lead_os_experiment_assignments", column: "tenant_id" },
  { table: "lead_os_marketplace_leads", column: "tenant_id" },
  { table: "lead_os_lead_magnet_deliveries", column: "tenant_id" },
  { table: "lead_os_provider_executions", column: "tenant_id" },
  { table: "lead_os_workflow_runs", column: "tenant_id" },
  { table: "lead_os_booking_jobs", column: "tenant_id" },
  { table: "lead_os_document_jobs", column: "tenant_id" },
  { table: "lead_os_tenants", column: "id" },
  { table: "lead_os_export_jobs", column: "tenant_id" },
  { table: "lead_os_analytics_snapshots", column: "tenant_id" },
  { table: "lead_os_deletion_requests", column: "tenant_id" },
  { table: "lead_os_webhook_endpoints", column: "tenant_id" },
  { table: "lead_os_webhook_deliveries", column: "tenant_id" },
  { table: "lead_os_product_events", column: "tenant_id" },
];

export function generateRLSPolicy(tableName: string, tenantIdColumn: string): string {
  const policyName = `rls_${tableName}_tenant_isolation`;
  return [
    `-- Enable RLS on ${tableName}`,
    `ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;`,
    ``,
    `-- Drop existing policy if any`,
    `DROP POLICY IF EXISTS ${policyName} ON ${tableName};`,
    ``,
    `-- Create tenant isolation policy`,
    `CREATE POLICY ${policyName} ON ${tableName}`,
    `  USING (${tenantIdColumn} = current_setting('app.current_tenant_id', true))`,
    `  WITH CHECK (${tenantIdColumn} = current_setting('app.current_tenant_id', true));`,
    ``,
  ].join("\n");
}

export function generateRLSSetupSQL(): string {
  const header = [
    "-- Lead OS: Row-Level Security Setup",
    "-- Run this SQL against your PostgreSQL database to enable tenant isolation.",
    "-- Before each query, set the tenant context:",
    "--   SET LOCAL app.current_tenant_id = 'tenant-uuid-here';",
    "",
    "-- Create the GUC parameter if not exists",
    "DO $$ BEGIN",
    "  PERFORM set_config('app.current_tenant_id', '', true);",
    "EXCEPTION WHEN OTHERS THEN",
    "  NULL;",
    "END $$;",
    "",
  ].join("\n");

  const policies = LEAD_OS_TABLES.map((t) => generateRLSPolicy(t.table, t.column)).join("\n");

  return header + policies;
}

const TENANT_ID_PATTERN = /^[a-f0-9-]{36}$/;

export function sanitizeTenantId(input: string): string {
  const trimmed = input.trim().toLowerCase();
  if (!TENANT_ID_PATTERN.test(trimmed)) {
    throw new Error("Invalid tenant ID format");
  }
  return trimmed;
}

export function enforceTenantBoundary(tenantId: string, requestTenantId: string): void {
  if (tenantId !== requestTenantId) {
    throw new TenantBoundaryError(
      `Tenant boundary violation: requested ${requestTenantId} but authenticated as ${tenantId}`,
    );
  }
}

export class TenantBoundaryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TenantBoundaryError";
  }
}
