import test from "node:test";
import assert from "node:assert/strict";
import {
  registerWebhook,
  signWebhookPayload,
  deliverWebhook,
  getDeliveryHistory,
  pauseEndpointOnFailure,
  listWebhooks,
  deleteWebhook,
  getWebhook,
  resetWebhookStore,
} from "../src/lib/webhook-registry.ts";

test.beforeEach(() => {
  resetWebhookStore();
});

// ---------------------------------------------------------------------------
// registerWebhook
// ---------------------------------------------------------------------------

test("registerWebhook creates endpoint with generated secret", async () => {
  const endpoint = await registerWebhook("tenant-1", "https://example.com/hook", ["lead.created"]);

  assert.ok(endpoint.id);
  assert.equal(endpoint.tenantId, "tenant-1");
  assert.equal(endpoint.url, "https://example.com/hook");
  assert.deepEqual(endpoint.events, ["lead.created"]);
  assert.ok(endpoint.secret.startsWith("whsec_"));
  assert.equal(endpoint.status, "active");
  assert.equal(endpoint.failureCount, 0);
  assert.ok(endpoint.createdAt);
  assert.ok(endpoint.updatedAt);
});

// ---------------------------------------------------------------------------
// signWebhookPayload
// ---------------------------------------------------------------------------

test("signWebhookPayload produces consistent HMAC", () => {
  const payload = '{"event":"lead.created"}';
  const secret = "whsec_test123";

  const sig1 = signWebhookPayload(payload, secret);
  const sig2 = signWebhookPayload(payload, secret);

  assert.equal(sig1, sig2);
  assert.ok(sig1.length > 0);
});

test("signWebhookPayload with different payloads produces different signatures", () => {
  const secret = "whsec_test123";

  const sig1 = signWebhookPayload('{"event":"lead.created"}', secret);
  const sig2 = signWebhookPayload('{"event":"lead.updated"}', secret);

  assert.notEqual(sig1, sig2);
});

// ---------------------------------------------------------------------------
// deliverWebhook
// ---------------------------------------------------------------------------

test("deliverWebhook stores delivery record", async () => {
  const endpoint = await registerWebhook("tenant-1", "https://example.com/hook", ["lead.created"]);

  const delivery = await deliverWebhook(endpoint.id, "lead.created", { leadId: "abc" });

  assert.ok(delivery.id);
  assert.equal(delivery.endpointId, endpoint.id);
  assert.equal(delivery.event, "lead.created");
  assert.deepEqual(delivery.payload, { leadId: "abc" });
  assert.ok(delivery.attempts >= 1);
  assert.ok(delivery.createdAt);
});

// ---------------------------------------------------------------------------
// getDeliveryHistory
// ---------------------------------------------------------------------------

test("getDeliveryHistory returns deliveries sorted by creation", async () => {
  const endpoint = await registerWebhook("tenant-1", "https://example.com/hook", ["lead.created"]);

  const d1 = await deliverWebhook(endpoint.id, "lead.created", { seq: 1 });

  // Re-activate if failed after delivery attempt
  const current = await getWebhook(endpoint.id);
  if (current && current.status !== "active") {
    current.status = "active";
    current.failureCount = 0;
  }

  const d2 = await deliverWebhook(endpoint.id, "lead.created", { seq: 2 });

  const history = await getDeliveryHistory(endpoint.id);

  assert.ok(history.length >= 2);
  // Sorted by createdAt DESC
  assert.ok(history[0].createdAt >= history[1].createdAt);
});

// ---------------------------------------------------------------------------
// pauseEndpointOnFailure
// ---------------------------------------------------------------------------

test("pauseEndpointOnFailure sets status to failed after threshold", async () => {
  const endpoint = await registerWebhook("tenant-1", "https://example.com/hook", ["lead.created"]);

  await pauseEndpointOnFailure(endpoint.id);

  const updated = await getWebhook(endpoint.id);
  assert.ok(updated);
  assert.equal(updated.status, "failed");
});

// ---------------------------------------------------------------------------
// listWebhooks
// ---------------------------------------------------------------------------

test("listWebhooks filters by tenantId", async () => {
  await registerWebhook("tenant-1", "https://example.com/hook1", ["lead.created"]);
  await registerWebhook("tenant-2", "https://example.com/hook2", ["lead.updated"]);
  await registerWebhook("tenant-1", "https://example.com/hook3", ["lead.deleted"]);

  const tenant1Hooks = await listWebhooks("tenant-1");
  const tenant2Hooks = await listWebhooks("tenant-2");

  assert.equal(tenant1Hooks.length, 2);
  assert.equal(tenant2Hooks.length, 1);
  assert.ok(tenant1Hooks.every((h) => h.tenantId === "tenant-1"));
  assert.ok(tenant2Hooks.every((h) => h.tenantId === "tenant-2"));
});

// ---------------------------------------------------------------------------
// deleteWebhook
// ---------------------------------------------------------------------------

test("deleteWebhook removes endpoint", async () => {
  const endpoint = await registerWebhook("tenant-1", "https://example.com/hook", ["lead.created"]);

  const result = await deleteWebhook(endpoint.id);
  assert.equal(result, true);

  const fetched = await getWebhook(endpoint.id);
  assert.equal(fetched, null);
});
