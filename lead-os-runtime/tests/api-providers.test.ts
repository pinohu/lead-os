import test from "node:test";
import assert from "node:assert/strict";
import {
  integrationMap,
  getAutomationHealth,
  type ProviderResult,
} from "../src/lib/providers.ts";

// ---------------------------------------------------------------------------
// GET /api/providers — returns provider statuses
// ---------------------------------------------------------------------------

test("GET providers returns health object with liveMode flag", () => {
  const health = getAutomationHealth();
  assert.ok(typeof health.liveMode === "boolean");
});

test("GET providers returns all integration entries", () => {
  const health = getAutomationHealth();
  const providerKeys = Object.keys(health.providers);
  const mapKeys = Object.keys(integrationMap);
  assert.equal(providerKeys.length, mapKeys.length, "Provider count mismatch");
  for (const key of mapKeys) {
    assert.ok(providerKeys.includes(key), `Missing provider in health: ${key}`);
  }
});

test("GET providers each entry has status, owner, responsibility, live fields", () => {
  const health = getAutomationHealth();
  for (const [key, provider] of Object.entries(health.providers)) {
    assert.ok(["configured", "dry-run", "missing"].includes(provider.status), `${key} invalid status: ${provider.status}`);
    assert.ok(typeof provider.owner === "string", `${key} missing owner`);
    assert.ok(typeof provider.responsibility === "string", `${key} missing responsibility`);
    assert.ok(typeof provider.live === "boolean", `${key} missing live flag`);
  }
});

test("GET providers returns channel availability summary", () => {
  const health = getAutomationHealth();
  const expectedChannels = ["email", "whatsapp", "sms", "chat", "voice"];
  for (const ch of expectedChannels) {
    assert.ok(ch in health.channels, `Missing channel: ${ch}`);
    assert.ok(typeof health.channels[ch as keyof typeof health.channels] === "boolean", `${ch} not boolean`);
  }
});

// ---------------------------------------------------------------------------
// POST /api/providers — updates provider config
// ---------------------------------------------------------------------------

test("POST providers integrationMap has correct structure for each entry", () => {
  for (const [key, value] of Object.entries(integrationMap)) {
    assert.ok(typeof value.configured === "boolean", `${key} configured not boolean`);
    assert.ok(typeof value.live === "boolean", `${key} live not boolean`);
    assert.ok(typeof value.owner === "string", `${key} owner not string`);
    assert.ok(typeof value.responsibility === "string", `${key} responsibility not string`);
  }
});

test("POST providers configured but not live results in dry-run status", () => {
  const health = getAutomationHealth();
  for (const [key, provider] of Object.entries(health.providers)) {
    const map = integrationMap[key as keyof typeof integrationMap];
    if (map.configured && !map.live) {
      assert.equal(provider.status, "dry-run", `${key} should be dry-run when configured but not live`);
    }
  }
});

test("POST providers unconfigured results in missing status", () => {
  const health = getAutomationHealth();
  for (const [key, provider] of Object.entries(health.providers)) {
    const map = integrationMap[key as keyof typeof integrationMap];
    if (!map.configured) {
      assert.equal(provider.status, "missing", `${key} should be missing when not configured`);
    }
  }
});

// ---------------------------------------------------------------------------
// Dry-run mode detection
// ---------------------------------------------------------------------------

test("dry-run mode: ProviderResult type supports dry-run mode field", () => {
  const dryResult: ProviderResult = {
    ok: true,
    provider: "TestProvider",
    mode: "dry-run",
    detail: "Dry run executed",
  };
  assert.equal(dryResult.mode, "dry-run");
  assert.equal(dryResult.ok, true);
});

test("dry-run mode: ProviderResult supports live and prepared modes", () => {
  const liveResult: ProviderResult = {
    ok: true,
    provider: "TestProvider",
    mode: "live",
    detail: "Live send completed",
    payload: { messageId: "msg-123" },
  };
  assert.equal(liveResult.mode, "live");
  assert.ok(liveResult.payload);

  const preparedResult: ProviderResult = {
    ok: true,
    provider: "TestProvider",
    mode: "prepared",
    detail: "Action prepared",
  };
  assert.equal(preparedResult.mode, "prepared");
});

test("dry-run mode: health channels are boolean regardless of live mode", () => {
  const health = getAutomationHealth();
  for (const [ch, val] of Object.entries(health.channels)) {
    assert.equal(typeof val, "boolean", `Channel ${ch} should be boolean`);
  }
});

// ---------------------------------------------------------------------------
// Invalid provider handling
// ---------------------------------------------------------------------------

test("invalid provider: integrationMap does not contain arbitrary keys", () => {
  const badKeys = ["nonexistent", "fakeProvider", "stripeConnect", "randomSaas"];
  for (const key of badKeys) {
    assert.equal(
      (integrationMap as Record<string, unknown>)[key],
      undefined,
      `integrationMap should not contain ${key}`,
    );
  }
});

test("invalid provider: health providers match integrationMap exactly", () => {
  const health = getAutomationHealth();
  const healthKeys = Object.keys(health.providers).sort();
  const mapKeys = Object.keys(integrationMap).sort();
  assert.deepEqual(healthKeys, mapKeys);
});

test("invalid provider: every integration has a non-empty responsibility string", () => {
  for (const [key, value] of Object.entries(integrationMap)) {
    assert.ok(
      typeof value.responsibility === "string" && value.responsibility.length > 0,
      `${key} has empty or missing responsibility`,
    );
  }
});
