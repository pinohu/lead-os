import test from "node:test";
import assert from "node:assert/strict";
import {
  storeCredential,
  getCredential,
  getCredentialPublic,
  listCredentials,
  deleteCredential,
  getAvailableProviders,
  getEnabledCapabilities,
  encryptValue,
  decryptValue,
  PROVIDER_CATALOG,
  _getCredentialStoreForTesting,
} from "../src/lib/credentials-vault.ts";

// ---------------------------------------------------------------------------
// Encryption roundtrip
// ---------------------------------------------------------------------------

test("encryptValue and decryptValue produce a valid roundtrip", () => {
  const plaintext = JSON.stringify({ api_key: "sk-test-123", secret: "very-secret" });
  const { encrypted, iv, authTag } = encryptValue(plaintext);
  const decrypted = decryptValue(encrypted, iv, authTag);
  assert.equal(decrypted, plaintext);
});

test("encryption produces different ciphertext for same plaintext (random IV)", () => {
  const plaintext = "same-text";
  const first = encryptValue(plaintext);
  const second = encryptValue(plaintext);
  assert.notEqual(first.encrypted, second.encrypted);
  assert.notEqual(first.iv, second.iv);
});

test("decryption fails with wrong auth tag", () => {
  const { encrypted, iv } = encryptValue("test-data");
  assert.throws(() => {
    decryptValue(encrypted, iv, "0000000000000000000000000000000000000000");
  });
});

// ---------------------------------------------------------------------------
// Store and retrieve
// ---------------------------------------------------------------------------

test("storeCredential stores and getCredential retrieves decrypted credentials", () => {
  const store = _getCredentialStoreForTesting();
  store.clear();

  storeCredential("t1", "github", "api-key", { token: "ghp_abc123" });
  const creds = getCredential("t1", "github");
  assert.ok(creds);
  assert.equal(creds.token, "ghp_abc123");
});

test("storeCredential returns public info without secrets", () => {
  const store = _getCredentialStoreForTesting();
  store.clear();

  const result = storeCredential("t1", "stripe", "api-key", {
    secret_key: "sk_test_abc",
    webhook_secret: "whsec_xyz",
  });

  assert.equal(result.provider, "stripe");
  assert.equal(result.status, "active");
  assert.ok(result.capabilities.includes("billing"));
  // Verify no secrets in the public response
  assert.equal((result as unknown as Record<string, unknown>).encryptedCredentials, undefined);
});

test("storeCredential rejects unknown provider", () => {
  const store = _getCredentialStoreForTesting();
  store.clear();

  assert.throws(() => {
    storeCredential("t1", "nonexistent-provider", "api-key", { key: "val" });
  }, /Unknown provider/);
});

test("storeCredential rejects missing required fields", () => {
  const store = _getCredentialStoreForTesting();
  store.clear();

  assert.throws(() => {
    storeCredential("t1", "stripe", "api-key", { secret_key: "sk_test" });
    // missing webhook_secret
  }, /Missing required fields/);
});

test("storeCredential overwrites existing credential for same tenant+provider", () => {
  const store = _getCredentialStoreForTesting();
  store.clear();

  storeCredential("t1", "github", "api-key", { token: "old-token" });
  storeCredential("t1", "github", "api-key", { token: "new-token" });

  const creds = getCredential("t1", "github");
  assert.ok(creds);
  assert.equal(creds.token, "new-token");

  // Should still be one entry, not two
  const list = listCredentials("t1");
  assert.equal(list.length, 1);
});

// ---------------------------------------------------------------------------
// List without exposing secrets
// ---------------------------------------------------------------------------

test("listCredentials returns public info only", () => {
  const store = _getCredentialStoreForTesting();
  store.clear();

  storeCredential("t1", "github", "api-key", { token: "ghp_secret" });
  storeCredential("t1", "openai", "api-key", { api_key: "sk-secret" });

  const list = listCredentials("t1");
  assert.equal(list.length, 2);

  for (const entry of list) {
    assert.ok(entry.provider);
    assert.ok(entry.capabilities.length > 0);
    assert.equal((entry as unknown as Record<string, unknown>).encryptedCredentials, undefined);
  }
});

test("listCredentials scopes to tenant", () => {
  const store = _getCredentialStoreForTesting();
  store.clear();

  storeCredential("t1", "github", "api-key", { token: "token1" });
  storeCredential("t2", "github", "api-key", { token: "token2" });

  assert.equal(listCredentials("t1").length, 1);
  assert.equal(listCredentials("t2").length, 1);
  assert.equal(listCredentials("t3").length, 0);
});

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

test("deleteCredential removes credential", () => {
  const store = _getCredentialStoreForTesting();
  store.clear();

  storeCredential("t1", "github", "api-key", { token: "to-delete" });
  assert.ok(deleteCredential("t1", "github"));
  assert.equal(getCredential("t1", "github"), undefined);
});

test("deleteCredential returns false for nonexistent credential", () => {
  const store = _getCredentialStoreForTesting();
  store.clear();
  assert.equal(deleteCredential("t1", "nonexistent"), false);
});

// ---------------------------------------------------------------------------
// Provider catalog
// ---------------------------------------------------------------------------

test("getAvailableProviders returns full catalog", () => {
  const providers = getAvailableProviders();
  assert.ok(providers.length > 40);
  assert.ok(providers.some((p) => p.provider === "github"));
  assert.ok(providers.some((p) => p.provider === "stripe"));
  assert.ok(providers.some((p) => p.provider === "openai"));
  assert.ok(providers.some((p) => p.provider === "n8n"));
});

test("every provider in catalog has fields and enables", () => {
  for (const provider of PROVIDER_CATALOG) {
    assert.ok(provider.provider.length > 0, `provider name is empty`);
    assert.ok(provider.fields.length > 0, `${provider.provider} has no fields`);
    assert.ok(provider.enables.length > 0, `${provider.provider} has no enables`);
    assert.ok(provider.category.length > 0, `${provider.provider} has no category`);
  }
});

// ---------------------------------------------------------------------------
// Capability resolution
// ---------------------------------------------------------------------------

test("getEnabledCapabilities returns capabilities from active credentials", () => {
  const store = _getCredentialStoreForTesting();
  store.clear();

  storeCredential("t1", "github", "api-key", { token: "ghp_test" });
  storeCredential("t1", "openai", "api-key", { api_key: "sk_test" });

  const caps = getEnabledCapabilities("t1");
  assert.ok(caps.includes("auto-deploy"));
  assert.ok(caps.includes("repo-creation"));
  assert.ok(caps.includes("ai-scoring"));
  assert.ok(caps.includes("ai-chat"));
});

test("getEnabledCapabilities returns empty for tenant with no credentials", () => {
  const store = _getCredentialStoreForTesting();
  store.clear();

  const caps = getEnabledCapabilities("empty-tenant");
  assert.equal(caps.length, 0);
});

test("getEnabledCapabilities deduplicates capabilities", () => {
  const store = _getCredentialStoreForTesting();
  store.clear();

  // Both openai and anthropic enable ai-scoring, ai-chat, ai-copy
  storeCredential("t1", "openai", "api-key", { api_key: "sk_test" });
  storeCredential("t1", "anthropic", "api-key", { api_key: "sk_test" });

  const caps = getEnabledCapabilities("t1");
  const aiScoringCount = caps.filter((c) => c === "ai-scoring").length;
  assert.equal(aiScoringCount, 1);
});

// ---------------------------------------------------------------------------
// getCredentialPublic
// ---------------------------------------------------------------------------

test("getCredentialPublic returns public info for existing credential", () => {
  const store = _getCredentialStoreForTesting();
  store.clear();

  storeCredential("t1", "github", "api-key", { token: "ghp_secret" });
  const pub = getCredentialPublic("t1", "github");
  assert.ok(pub);
  assert.equal(pub.provider, "github");
  assert.equal(pub.status, "active");
  assert.equal((pub as unknown as Record<string, unknown>).encryptedCredentials, undefined);
});

test("getCredentialPublic returns undefined for nonexistent credential", () => {
  const store = _getCredentialStoreForTesting();
  store.clear();
  assert.equal(getCredentialPublic("t1", "nonexistent"), undefined);
});
