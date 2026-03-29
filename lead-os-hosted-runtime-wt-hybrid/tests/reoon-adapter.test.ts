import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveReoonConfig,
  isReoonDryRun,
  verifySingleEmail,
  verifyBulkEmails,
  verifyAndStore,
  getStoredVerification,
  getVerificationStats,
  shouldSendToEmail,
  verifyEmailViaReoon,
  resetReoonStore,
} from "../src/lib/integrations/reoon-adapter.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clearReoonEnv() {
  delete process.env.REOON_API_KEY;
  delete process.env.REOON_BASE_URL;
}

// ---------------------------------------------------------------------------
// Config resolution
// ---------------------------------------------------------------------------

test("resolveReoonConfig returns null when no API key", () => {
  clearReoonEnv();
  const cfg = resolveReoonConfig();
  assert.equal(cfg, null);
});

test("resolveReoonConfig returns config when API key is set", () => {
  clearReoonEnv();
  process.env.REOON_API_KEY = "rk-test-123";
  const cfg = resolveReoonConfig();
  assert.ok(cfg);
  assert.equal(cfg.apiKey, "rk-test-123");
  assert.equal(cfg.baseUrl, "https://emailverifier.reoon.com/api/v1");
  clearReoonEnv();
});

test("resolveReoonConfig uses custom base URL from env", () => {
  clearReoonEnv();
  process.env.REOON_API_KEY = "rk-test";
  process.env.REOON_BASE_URL = "https://custom.reoon.com/api/v2";
  const cfg = resolveReoonConfig();
  assert.ok(cfg);
  assert.equal(cfg.baseUrl, "https://custom.reoon.com/api/v2");
  clearReoonEnv();
});

// ---------------------------------------------------------------------------
// Dry-run detection
// ---------------------------------------------------------------------------

test("isReoonDryRun returns true when no API key", () => {
  clearReoonEnv();
  assert.equal(isReoonDryRun(), true);
});

test("isReoonDryRun returns false when API key is set", () => {
  clearReoonEnv();
  process.env.REOON_API_KEY = "rk-test";
  assert.equal(isReoonDryRun(), false);
  clearReoonEnv();
});

// ---------------------------------------------------------------------------
// Single email verification (dry-run)
// ---------------------------------------------------------------------------

test("verifySingleEmail returns valid for normal email", async () => {
  clearReoonEnv();
  const result = await verifySingleEmail("user@example.com");
  assert.equal(result.status, "valid");
  assert.equal(result.score, 95);
  assert.equal(result.mxRecords, true);
  assert.equal(result.smtpCheck, true);
  assert.equal(result.disposable, false);
  assert.equal(result.email, "user@example.com");
});

test("verifySingleEmail returns valid for test-containing email", async () => {
  clearReoonEnv();
  const result = await verifySingleEmail("test-user@example.com");
  assert.equal(result.status, "valid");
  assert.ok(result.score > 0);
});

test("verifySingleEmail returns invalid for bad-containing email", async () => {
  clearReoonEnv();
  const result = await verifySingleEmail("bad-address@nowhere.com");
  assert.equal(result.status, "invalid");
  assert.equal(result.score, 10);
  assert.equal(result.mxRecords, false);
  assert.equal(result.smtpCheck, false);
});

test("verifySingleEmail returns invalid for invalid-containing email", async () => {
  clearReoonEnv();
  const result = await verifySingleEmail("invalid-user@domain.com");
  assert.equal(result.status, "invalid");
});

test("verifySingleEmail returns risky for risky-containing email", async () => {
  clearReoonEnv();
  const result = await verifySingleEmail("risky-lead@catchall.com");
  assert.equal(result.status, "risky");
  assert.equal(result.score, 45);
  assert.equal(result.mxRecords, true);
});

test("verifySingleEmail returns disposable for disposable-containing email", async () => {
  clearReoonEnv();
  const result = await verifySingleEmail("user@disposable-mail.com");
  assert.equal(result.status, "disposable");
  assert.equal(result.disposable, true);
  assert.equal(result.score, 15);
});

test("verifySingleEmail returns disposable for tempmail-containing email", async () => {
  clearReoonEnv();
  const result = await verifySingleEmail("user@tempmail.org");
  assert.equal(result.status, "disposable");
});

test("verifySingleEmail returns unknown for unknown-containing email", async () => {
  clearReoonEnv();
  const result = await verifySingleEmail("unknown-status@server.com");
  assert.equal(result.status, "unknown");
  assert.equal(result.score, 50);
});

test("verifySingleEmail returns unknown for timeout-containing email", async () => {
  clearReoonEnv();
  const result = await verifySingleEmail("timeout@slow-server.com");
  assert.equal(result.status, "unknown");
});

test("verifySingleEmail detects role-based accounts", async () => {
  clearReoonEnv();
  const result = await verifySingleEmail("info@company.com");
  assert.equal(result.roleAccount, true);
  assert.equal(result.status, "valid");
  assert.equal(result.score, 70);
});

test("verifySingleEmail detects admin role accounts", async () => {
  clearReoonEnv();
  const result = await verifySingleEmail("admin@company.com");
  assert.equal(result.roleAccount, true);
});

test("verifySingleEmail detects support role accounts", async () => {
  clearReoonEnv();
  const result = await verifySingleEmail("support@company.com");
  assert.equal(result.roleAccount, true);
});

test("verifySingleEmail detects free provider (gmail)", async () => {
  clearReoonEnv();
  const result = await verifySingleEmail("user@gmail.com");
  assert.equal(result.freeProvider, true);
  assert.equal(result.status, "valid");
});

test("verifySingleEmail detects free provider (yahoo)", async () => {
  clearReoonEnv();
  const result = await verifySingleEmail("user@yahoo.com");
  assert.equal(result.freeProvider, true);
});

// ---------------------------------------------------------------------------
// Bulk verification
// ---------------------------------------------------------------------------

test("verifyBulkEmails returns results for all emails", async () => {
  clearReoonEnv();
  const emails = ["good@example.com", "bad@example.com", "risky@example.com"];
  const results = await verifyBulkEmails(emails);
  assert.equal(results.length, 3);
  assert.equal(results[0].status, "valid");
  assert.equal(results[1].status, "invalid");
  assert.equal(results[2].status, "risky");
});

test("verifyBulkEmails handles empty array", async () => {
  clearReoonEnv();
  const results = await verifyBulkEmails([]);
  assert.equal(results.length, 0);
});

// ---------------------------------------------------------------------------
// Store and retrieve
// ---------------------------------------------------------------------------

test("verifyAndStore stores result and getStoredVerification retrieves it", async () => {
  clearReoonEnv();
  resetReoonStore();

  const result = await verifyAndStore("stored@example.com", "tenant-1");
  assert.equal(result.status, "valid");

  const cached = await getStoredVerification("stored@example.com");
  assert.ok(cached);
  assert.equal(cached.email, "stored@example.com");
  assert.equal(cached.status, "valid");

  resetReoonStore();
});

test("verifyAndStore returns cached result on second call", async () => {
  clearReoonEnv();
  resetReoonStore();

  const first = await verifyAndStore("cached@example.com");
  const second = await verifyAndStore("cached@example.com");
  assert.deepEqual(first, second);

  resetReoonStore();
});

test("getStoredVerification returns null for unknown email", async () => {
  clearReoonEnv();
  resetReoonStore();
  const result = await getStoredVerification("nonexistent@example.com");
  assert.equal(result, null);
});

// ---------------------------------------------------------------------------
// Stats computation
// ---------------------------------------------------------------------------

test("getVerificationStats computes correct statistics", async () => {
  clearReoonEnv();
  resetReoonStore();

  await verifyAndStore("valid1@example.com", "t1");
  await verifyAndStore("valid2@example.com", "t1");
  await verifyAndStore("bad-email@example.com", "t1");
  await verifyAndStore("risky-lead@example.com", "t1");
  await verifyAndStore("disposable@tempmail.com", "t1");

  const stats = await getVerificationStats();
  assert.equal(stats.total, 5);
  assert.equal(stats.valid, 2);
  assert.equal(stats.invalid, 1);
  assert.equal(stats.risky, 1);
  assert.equal(stats.disposable, 1);
  assert.equal(stats.validRate, 40);

  resetReoonStore();
});

test("getVerificationStats filters by tenantId", async () => {
  clearReoonEnv();
  resetReoonStore();

  await verifyAndStore("a@example.com", "tenant-a");
  await verifyAndStore("b@example.com", "tenant-b");
  await verifyAndStore("c@example.com", "tenant-a");

  const statsA = await getVerificationStats("tenant-a");
  assert.equal(statsA.total, 2);

  const statsB = await getVerificationStats("tenant-b");
  assert.equal(statsB.total, 1);

  resetReoonStore();
});

test("getVerificationStats returns zero validRate for empty store", async () => {
  clearReoonEnv();
  resetReoonStore();
  const stats = await getVerificationStats();
  assert.equal(stats.total, 0);
  assert.equal(stats.validRate, 0);
});

// ---------------------------------------------------------------------------
// shouldSendToEmail
// ---------------------------------------------------------------------------

test("shouldSendToEmail returns true for valid emails", async () => {
  clearReoonEnv();
  const result = await verifySingleEmail("good@example.com");
  assert.equal(shouldSendToEmail(result), true);
});

test("shouldSendToEmail returns false for invalid emails", async () => {
  clearReoonEnv();
  const result = await verifySingleEmail("bad@example.com");
  assert.equal(shouldSendToEmail(result), false);
});

test("shouldSendToEmail returns false for risky emails", async () => {
  clearReoonEnv();
  const result = await verifySingleEmail("risky@example.com");
  assert.equal(shouldSendToEmail(result), false);
});

test("shouldSendToEmail returns false for disposable emails", async () => {
  clearReoonEnv();
  const result = await verifySingleEmail("disposable@example.com");
  assert.equal(shouldSendToEmail(result), false);
});

test("shouldSendToEmail returns false for unknown emails", async () => {
  clearReoonEnv();
  const result = await verifySingleEmail("unknown@example.com");
  assert.equal(shouldSendToEmail(result), false);
});

// ---------------------------------------------------------------------------
// ProviderResult integration
// ---------------------------------------------------------------------------

test("verifyEmailViaReoon returns ProviderResult in dry-run mode", async () => {
  clearReoonEnv();
  const pr = await verifyEmailViaReoon("lead@company.com");
  assert.equal(pr.ok, true);
  assert.equal(pr.provider, "Reoon");
  assert.equal(pr.mode, "dry-run");
  assert.ok(pr.detail.includes("valid"));
  assert.ok(pr.payload);
  assert.equal(pr.payload.email, "lead@company.com");
  assert.equal(pr.payload.status, "valid");
});

test("verifyEmailViaReoon includes score in detail", async () => {
  clearReoonEnv();
  const pr = await verifyEmailViaReoon("bad@nowhere.com");
  assert.ok(pr.detail.includes("invalid"));
  assert.ok(pr.detail.includes("10"));
});

// ---------------------------------------------------------------------------
// Reset store
// ---------------------------------------------------------------------------

test("resetReoonStore clears all stored verifications", async () => {
  clearReoonEnv();
  resetReoonStore();

  await verifyAndStore("test@example.com");
  const before = await getStoredVerification("test@example.com");
  assert.ok(before);

  resetReoonStore();

  const after = await getStoredVerification("test@example.com");
  assert.equal(after, null);
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

test("verifySingleEmail handles empty string email", async () => {
  clearReoonEnv();
  const result = await verifySingleEmail("");
  assert.equal(result.email, "");
  assert.equal(result.status, "valid");
});

test("verifySingleEmail handles email with mixed case patterns", async () => {
  clearReoonEnv();
  const result = await verifySingleEmail("BAD-User@EXAMPLE.COM");
  assert.equal(result.status, "invalid");
});

test("verifyBulkEmails with single email returns array of one", async () => {
  clearReoonEnv();
  const results = await verifyBulkEmails(["solo@example.com"]);
  assert.equal(results.length, 1);
  assert.equal(results[0].email, "solo@example.com");
});

test("verifySingleEmail returns correct reason strings", async () => {
  clearReoonEnv();
  const valid = await verifySingleEmail("normal@example.com");
  assert.ok(valid.reason.includes("dry-run"));

  const invalid = await verifySingleEmail("bad@example.com");
  assert.ok(invalid.reason.includes("dry-run"));
});
