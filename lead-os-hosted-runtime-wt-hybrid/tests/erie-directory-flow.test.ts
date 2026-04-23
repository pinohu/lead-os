// tests/erie-directory-flow.test.ts
import assert from "node:assert/strict";
import { describe, it, after } from "node:test";
import { shouldRunDirectoryLeadFlow } from "../src/lib/erie/directory-lead-flow";

describe("Erie directory lead flow", () => {
  const prev = process.env.LEAD_OS_DIRECTORY_TENANTS;

  after(() => {
    process.env.LEAD_OS_DIRECTORY_TENANTS = prev;
  });

  it("shouldRunDirectoryLeadFlow respects LEAD_OS_DIRECTORY_TENANTS", () => {
    process.env.LEAD_OS_DIRECTORY_TENANTS = "erie,acme";
    assert.equal(shouldRunDirectoryLeadFlow("erie"), true);
    assert.equal(shouldRunDirectoryLeadFlow("acme"), true);
    assert.equal(shouldRunDirectoryLeadFlow("other"), false);
  });

  it("defaults directory tenants to erie", () => {
    delete process.env.LEAD_OS_DIRECTORY_TENANTS;
    assert.equal(shouldRunDirectoryLeadFlow("erie"), true);
    assert.equal(shouldRunDirectoryLeadFlow("default-tenant"), false);
  });
});
