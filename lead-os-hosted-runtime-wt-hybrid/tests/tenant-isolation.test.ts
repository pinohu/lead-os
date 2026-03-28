import test from "node:test";
import assert from "node:assert/strict";
import {
  checkRateLimit,
  getTenantQuota,
  generateRLSPolicy,
  generateRLSSetupSQL,
  sanitizeTenantId,
  enforceTenantBoundary,
  TenantBoundaryError,
  type TenantQuota,
} from "../src/lib/tenant-isolation.ts";

// ---------------------------------------------------------------------------
// Plan quotas — getTenantQuota
// ---------------------------------------------------------------------------

test("getTenantQuota returns starter quotas by default", () => {
  const quota = getTenantQuota("tenant-1");

  assert.equal(quota.tenantId, "tenant-1");
  assert.equal(quota.maxLeadsPerMinute, 10);
  assert.equal(quota.maxApiCallsPerMinute, 60);
  assert.equal(quota.maxEmailsPerHour, 100);
  assert.equal(quota.maxStorageMB, 500);
});

test("getTenantQuota returns correct quotas for growth plan", () => {
  const quota = getTenantQuota("tenant-2", "growth");

  assert.equal(quota.tenantId, "tenant-2");
  assert.equal(quota.maxLeadsPerMinute, 50);
  assert.equal(quota.maxApiCallsPerMinute, 300);
  assert.equal(quota.maxEmailsPerHour, 1000);
  assert.equal(quota.maxStorageMB, 5000);
});

test("getTenantQuota returns correct quotas for enterprise plan", () => {
  const quota = getTenantQuota("tenant-3", "enterprise");

  assert.equal(quota.tenantId, "tenant-3");
  assert.equal(quota.maxLeadsPerMinute, 200);
  assert.equal(quota.maxApiCallsPerMinute, 1200);
  assert.equal(quota.maxEmailsPerHour, 10000);
  assert.equal(quota.maxStorageMB, 50000);
});

test("getTenantQuota returns correct quotas for custom plan", () => {
  const quota = getTenantQuota("tenant-4", "custom");

  assert.equal(quota.tenantId, "tenant-4");
  assert.equal(quota.maxLeadsPerMinute, 500);
  assert.equal(quota.maxApiCallsPerMinute, 3000);
  assert.equal(quota.maxEmailsPerHour, 50000);
  assert.equal(quota.maxStorageMB, 100000);
});

test("getTenantQuota falls back to starter for unknown plan", () => {
  const quota = getTenantQuota("tenant-5", "nonexistent-plan");

  assert.equal(quota.maxLeadsPerMinute, 10);
  assert.equal(quota.maxApiCallsPerMinute, 60);
});

test("getTenantQuota sets the tenantId on the returned quota", () => {
  const quota = getTenantQuota("my-specific-tenant", "growth");

  assert.equal(quota.tenantId, "my-specific-tenant");
});

// ---------------------------------------------------------------------------
// Tenant rate limiting — checkRateLimit
// ---------------------------------------------------------------------------

test("checkRateLimit allows requests under the limit", () => {
  const result = checkRateLimit("rl-tenant-1", "/api/test-endpoint", 5, 60_000);

  assert.equal(result.allowed, true);
  assert.ok(result.remaining >= 0);
});

test("checkRateLimit blocks requests over the limit", () => {
  const endpoint = `/api/block-test-${Date.now()}`;
  for (let i = 0; i < 3; i++) {
    checkRateLimit("rl-tenant-2", endpoint, 3, 60_000);
  }

  const blocked = checkRateLimit("rl-tenant-2", endpoint, 3, 60_000);

  assert.equal(blocked.allowed, false);
  assert.equal(blocked.remaining, 0);
});

test("checkRateLimit tracks different tenants independently", () => {
  const endpoint = `/api/independent-${Date.now()}`;

  checkRateLimit("rl-tenant-a", endpoint, 1, 60_000);
  const blockedA = checkRateLimit("rl-tenant-a", endpoint, 1, 60_000);
  assert.equal(blockedA.allowed, false);

  const allowedB = checkRateLimit("rl-tenant-b", endpoint, 1, 60_000);
  assert.equal(allowedB.allowed, true);
});

test("checkRateLimit tracks different endpoints independently", () => {
  const suffix = Date.now();
  const endpointX = `/api/endpoint-x-${suffix}`;
  const endpointY = `/api/endpoint-y-${suffix}`;

  checkRateLimit("rl-tenant-3", endpointX, 1, 60_000);
  const blockedX = checkRateLimit("rl-tenant-3", endpointX, 1, 60_000);
  assert.equal(blockedX.allowed, false);

  const allowedY = checkRateLimit("rl-tenant-3", endpointY, 1, 60_000);
  assert.equal(allowedY.allowed, true);
});

// ---------------------------------------------------------------------------
// RLS SQL generation
// ---------------------------------------------------------------------------

test("generateRLSPolicy produces valid SQL with correct table and column", () => {
  const sql = generateRLSPolicy("lead_os_leads", "tenant_id");

  assert.ok(sql.includes("ALTER TABLE lead_os_leads ENABLE ROW LEVEL SECURITY;"));
  assert.ok(sql.includes("rls_lead_os_leads_tenant_isolation"));
  assert.ok(sql.includes("tenant_id = current_setting('app.current_tenant_id', true)"));
  assert.ok(sql.includes("USING"));
  assert.ok(sql.includes("WITH CHECK"));
});

test("generateRLSPolicy handles different column names", () => {
  const sql = generateRLSPolicy("lead_os_tenants", "id");

  assert.ok(sql.includes("ALTER TABLE lead_os_tenants ENABLE ROW LEVEL SECURITY;"));
  assert.ok(sql.includes("id = current_setting('app.current_tenant_id', true)"));
});

test("generateRLSPolicy includes DROP POLICY IF EXISTS for idempotency", () => {
  const sql = generateRLSPolicy("lead_os_events", "tenant_id");

  assert.ok(sql.includes("DROP POLICY IF EXISTS rls_lead_os_events_tenant_isolation"));
});

test("generateRLSSetupSQL includes header with instructions", () => {
  const sql = generateRLSSetupSQL();

  assert.ok(sql.includes("Row-Level Security Setup"));
  assert.ok(sql.includes("SET LOCAL app.current_tenant_id"));
  assert.ok(sql.includes("set_config('app.current_tenant_id'"));
});

test("generateRLSSetupSQL generates policies for all known tables", () => {
  const sql = generateRLSSetupSQL();

  const expectedTables = [
    "lead_os_leads",
    "lead_os_events",
    "lead_os_email_tracking",
    "lead_os_tenants",
    "lead_os_webhook_endpoints",
    "lead_os_webhook_deliveries",
    "lead_os_product_events",
  ];

  for (const table of expectedTables) {
    assert.ok(sql.includes(table), `Expected SQL to include policy for ${table}`);
  }
});

// ---------------------------------------------------------------------------
// sanitizeTenantId
// ---------------------------------------------------------------------------

test("sanitizeTenantId accepts valid UUID", () => {
  const validId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
  const result = sanitizeTenantId(validId);

  assert.equal(result, validId);
});

test("sanitizeTenantId trims whitespace and lowercases", () => {
  const result = sanitizeTenantId("  A1B2C3D4-E5F6-7890-ABCD-EF1234567890  ");

  assert.equal(result, "a1b2c3d4-e5f6-7890-abcd-ef1234567890");
});

test("sanitizeTenantId throws for non-UUID strings", () => {
  assert.throws(() => sanitizeTenantId("not-a-uuid"), {
    message: "Invalid tenant ID format",
  });
});

test("sanitizeTenantId throws for empty string", () => {
  assert.throws(() => sanitizeTenantId(""), {
    message: "Invalid tenant ID format",
  });
});

test("sanitizeTenantId throws for SQL injection attempt", () => {
  assert.throws(() => sanitizeTenantId("'; DROP TABLE users; --"), {
    message: "Invalid tenant ID format",
  });
});

test("sanitizeTenantId throws for UUID with extra characters", () => {
  assert.throws(() => sanitizeTenantId("a1b2c3d4-e5f6-7890-abcd-ef1234567890extra"), {
    message: "Invalid tenant ID format",
  });
});

// ---------------------------------------------------------------------------
// enforceTenantBoundary
// ---------------------------------------------------------------------------

test("enforceTenantBoundary passes when tenant IDs match", () => {
  assert.doesNotThrow(() => enforceTenantBoundary("tenant-abc", "tenant-abc"));
});

test("enforceTenantBoundary throws TenantBoundaryError when IDs differ", () => {
  assert.throws(
    () => enforceTenantBoundary("tenant-abc", "tenant-xyz"),
    (err: unknown) => {
      assert.ok(err instanceof TenantBoundaryError);
      assert.ok(err.message.includes("Tenant boundary violation"));
      assert.ok(err.message.includes("tenant-xyz"));
      assert.ok(err.message.includes("tenant-abc"));
      return true;
    },
  );
});

test("TenantBoundaryError has correct name property", () => {
  const err = new TenantBoundaryError("test");
  assert.equal(err.name, "TenantBoundaryError");
  assert.ok(err instanceof Error);
});
