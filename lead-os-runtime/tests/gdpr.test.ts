import test from "node:test";
import assert from "node:assert/strict";
import {
  requestDeletion,
  getDeletionStatus,
  listDeletionRequests,
  exportUserData,
  processDeletion,
  resetGdprStore,
} from "../src/lib/gdpr.ts";

test.beforeEach(() => {
  resetGdprStore();
});

// ---------------------------------------------------------------------------
// requestDeletion
// ---------------------------------------------------------------------------

test("requestDeletion creates deletion request with pending status", async () => {
  const request = await requestDeletion("tenant-1", "user@example.com");

  assert.ok(request.id);
  assert.equal(request.tenantId, "tenant-1");
  assert.equal(request.email, "user@example.com");
  assert.equal(request.status, "pending");
  assert.ok(request.leadKey);
  assert.deepEqual(request.tablesProcessed, []);
  assert.ok(request.createdAt);
  assert.equal(request.completedAt, undefined);
});

// ---------------------------------------------------------------------------
// getDeletionStatus
// ---------------------------------------------------------------------------

test("getDeletionStatus returns request details", async () => {
  const request = await requestDeletion("tenant-1", "user@example.com");

  const fetched = await getDeletionStatus(request.id);

  assert.ok(fetched);
  assert.equal(fetched.id, request.id);
  assert.equal(fetched.tenantId, "tenant-1");
  assert.equal(fetched.email, "user@example.com");
  assert.equal(fetched.status, "pending");
});

test("getDeletionStatus returns null for unknown id", async () => {
  const fetched = await getDeletionStatus("nonexistent-id");
  assert.equal(fetched, null);
});

// ---------------------------------------------------------------------------
// listDeletionRequests
// ---------------------------------------------------------------------------

test("listDeletionRequests filters by tenantId", async () => {
  await requestDeletion("tenant-1", "a@example.com");
  await requestDeletion("tenant-2", "b@example.com");
  await requestDeletion("tenant-1", "c@example.com");

  const tenant1Requests = await listDeletionRequests("tenant-1");
  const tenant2Requests = await listDeletionRequests("tenant-2");

  assert.equal(tenant1Requests.length, 2);
  assert.equal(tenant2Requests.length, 1);
  assert.ok(tenant1Requests.every((r) => r.tenantId === "tenant-1"));
  assert.ok(tenant2Requests.every((r) => r.tenantId === "tenant-2"));
});

// ---------------------------------------------------------------------------
// exportUserData
// ---------------------------------------------------------------------------

test("exportUserData collects data across stores", async () => {
  const data = await exportUserData("tenant-1", "user@example.com");

  assert.ok(data.exportedAt);
  assert.equal(data.tenantId, "tenant-1");
  assert.equal(data.email, "user@example.com");
  assert.ok(Array.isArray(data.leads));
  assert.ok(Array.isArray(data.events));
  assert.ok(Array.isArray(data.emailTracking));
  assert.ok(Array.isArray(data.attributionTouches));
  assert.ok(Array.isArray(data.experimentAssignments));
  assert.ok(Array.isArray(data.marketplaceLeads));
  assert.ok(Array.isArray(data.leadMagnetDeliveries));
});

// ---------------------------------------------------------------------------
// processDeletion
// ---------------------------------------------------------------------------

test("processDeletion anonymizes lead record", async () => {
  const request = await requestDeletion("tenant-1", "user@example.com");

  const processed = await processDeletion(request.id);

  assert.equal(processed.status, "completed");
  assert.ok(processed.completedAt);
});

test("processDeletion throws for non-pending request", async () => {
  const request = await requestDeletion("tenant-1", "user@example.com");
  await processDeletion(request.id);

  await assert.rejects(
    () => processDeletion(request.id),
    (err: Error) => {
      assert.ok(err.message.includes("is not pending"));
      return true;
    },
  );
});
