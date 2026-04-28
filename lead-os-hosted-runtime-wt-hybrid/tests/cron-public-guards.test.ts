// tests/cron-public-guards.test.ts
import assert from "node:assert/strict";
import { describe, it, after } from "node:test";
import { requireCronAuthOrFail, requireDeployTenantIdOrFail } from "../src/lib/api/cron-public-guards.ts";

describe("cron-public-guards", () => {
  const prevCron = process.env.CRON_SECRET;
  const prevAuth = process.env.LEAD_OS_AUTH_SECRET;
  const prevEnforce = process.env.LEAD_OS_SINGLE_TENANT_ENFORCE;

  after(() => {
    process.env.CRON_SECRET = prevCron;
    process.env.LEAD_OS_AUTH_SECRET = prevAuth;
    process.env.LEAD_OS_SINGLE_TENANT_ENFORCE = prevEnforce;
  });

  it("requireCronAuthOrFail rejects missing secret", () => {
    delete process.env.CRON_SECRET;
    process.env.LEAD_OS_AUTH_SECRET = "auth-secret-must-not-authorize-cron";
    const res = requireCronAuthOrFail(new Request("https://x/api/cron/test"));
    assert.ok(res);
    assert.equal(res.status, 503);
  });

  it("requireCronAuthOrFail does not accept LEAD_OS_AUTH_SECRET as cron fallback", () => {
    delete process.env.CRON_SECRET;
    process.env.LEAD_OS_AUTH_SECRET = "auth-secret-must-not-authorize-cron";
    const res = requireCronAuthOrFail(
      new Request("https://x/api/cron/test", {
        headers: { authorization: "Bearer auth-secret-must-not-authorize-cron" },
      }),
    );
    assert.ok(res);
    assert.equal(res.status, 503);
  });

  it("requireCronAuthOrFail rejects bad bearer", () => {
    process.env.CRON_SECRET = "super-secret-cron";
    delete process.env.LEAD_OS_AUTH_SECRET;
    const res = requireCronAuthOrFail(
      new Request("https://x/api/cron/test", { headers: { authorization: "Bearer wrong" } }),
    );
    assert.ok(res);
    assert.equal(res.status, 401);
  });

  it("requireCronAuthOrFail accepts x-cron-secret", () => {
    process.env.CRON_SECRET = "super-secret-cron";
    const res = requireCronAuthOrFail(
      new Request("https://x/api/cron/test", { headers: { "x-cron-secret": "super-secret-cron" } }),
    );
    assert.equal(res, null);
  });

  it("requireDeployTenantIdOrFail allows any tenant when enforcement disabled", () => {
    process.env.LEAD_OS_SINGLE_TENANT_ENFORCE = "false";
    const res = requireDeployTenantIdOrFail("other-tenant", "test");
    assert.equal(res, null);
  });
});
