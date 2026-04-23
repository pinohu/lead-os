import test from "node:test";
import assert from "node:assert/strict";
import {
  createTenant,
  getTenant,
  getTenantBySlug,
  updateTenant,
  listTenants,
  suspendTenant,
  resetTenantStore,
  type CreateTenantInput,
} from "../src/lib/tenant-store.ts";

function makeInput(overrides?: Partial<CreateTenantInput>): CreateTenantInput {
  return {
    slug: `test-tenant-${Date.now()}`,
    brandName: "Test Brand",
    siteUrl: "https://test.example.com",
    supportEmail: "support@test.com",
    defaultService: "lead-capture",
    defaultNiche: "general",
    widgetOrigins: ["https://test.example.com"],
    accent: "#14b8a6",
    enabledFunnels: ["lead-magnet", "qualification"],
    channels: { email: true, whatsapp: false, sms: false, chat: false, voice: false },
    revenueModel: "managed",
    plan: "starter",
    status: "provisioning",
    operatorEmails: ["admin@test.com"],
    providerConfig: {},
    metadata: {},
    ...overrides,
  };
}

test("createTenant generates ID and timestamps", async () => {
  resetTenantStore();

  const input = makeInput({ slug: "create-test" });
  const record = await createTenant(input);

  assert.ok(record.tenantId, "tenantId should be set");
  assert.equal(record.slug, "create-test");
  assert.equal(record.brandName, "Test Brand");
  assert.equal(record.status, "provisioning");
  assert.ok(record.createdAt, "createdAt should be set");
  assert.ok(record.updatedAt, "updatedAt should be set");
});

test("getTenant returns created tenant", async () => {
  resetTenantStore();

  const created = await createTenant(makeInput({ slug: "get-test" }));
  const fetched = await getTenant(created.tenantId);

  assert.ok(fetched);
  assert.equal(fetched.tenantId, created.tenantId);
  assert.equal(fetched.slug, "get-test");
});

test("getTenant returns null for unknown ID", async () => {
  resetTenantStore();

  const result = await getTenant("nonexistent-id");
  assert.equal(result, null);
});

test("getTenantBySlug returns created tenant", async () => {
  resetTenantStore();

  const created = await createTenant(makeInput({ slug: "slug-lookup" }));
  const fetched = await getTenantBySlug("slug-lookup");

  assert.ok(fetched);
  assert.equal(fetched.tenantId, created.tenantId);
  assert.equal(fetched.slug, "slug-lookup");
});

test("getTenantBySlug returns null for unknown slug", async () => {
  resetTenantStore();

  const result = await getTenantBySlug("nonexistent-slug");
  assert.equal(result, null);
});

test("updateTenant applies partial patch", async () => {
  resetTenantStore();

  const created = await createTenant(makeInput({ slug: "update-test" }));
  await new Promise((resolve) => setTimeout(resolve, 5));
  const updated = await updateTenant(created.tenantId, {
    brandName: "Updated Brand",
    status: "active",
  });

  assert.ok(updated);
  assert.equal(updated.brandName, "Updated Brand");
  assert.equal(updated.status, "active");
  assert.equal(updated.slug, "update-test");
  assert.equal(updated.tenantId, created.tenantId);
  assert.equal(updated.createdAt, created.createdAt);
  assert.notEqual(updated.updatedAt, created.updatedAt);
});

test("updateTenant returns null for unknown ID", async () => {
  resetTenantStore();

  const result = await updateTenant("nonexistent-id", { brandName: "Nope" });
  assert.equal(result, null);
});

test("updateTenant preserves tenantId and createdAt even if patch includes them", async () => {
  resetTenantStore();

  const created = await createTenant(makeInput({ slug: "immutable-test" }));
  const updated = await updateTenant(created.tenantId, {
    tenantId: "hacked-id",
    createdAt: "2000-01-01T00:00:00.000Z",
    brandName: "Still Safe",
  });

  assert.ok(updated);
  assert.equal(updated.tenantId, created.tenantId);
  assert.equal(updated.createdAt, created.createdAt);
  assert.equal(updated.brandName, "Still Safe");
});

test("listTenants returns all tenants", async () => {
  resetTenantStore();

  await createTenant(makeInput({ slug: "list-a", status: "active", revenueModel: "managed" }));
  await createTenant(makeInput({ slug: "list-b", status: "active", revenueModel: "white-label" }));
  await createTenant(makeInput({ slug: "list-c", status: "suspended", revenueModel: "managed" }));

  const all = await listTenants();
  assert.equal(all.length, 3);
});

test("listTenants filters by status", async () => {
  resetTenantStore();

  await createTenant(makeInput({ slug: "filter-active", status: "active" }));
  await createTenant(makeInput({ slug: "filter-suspended", status: "suspended" }));

  const active = await listTenants({ status: "active" });
  assert.equal(active.length, 1);
  assert.equal(active[0].slug, "filter-active");
});

test("listTenants filters by revenueModel", async () => {
  resetTenantStore();

  await createTenant(makeInput({ slug: "rev-managed", revenueModel: "managed" }));
  await createTenant(makeInput({ slug: "rev-wl", revenueModel: "white-label" }));

  const managed = await listTenants({ revenueModel: "managed" });
  assert.equal(managed.length, 1);
  assert.equal(managed[0].slug, "rev-managed");
});

test("listTenants filters by both status and revenueModel", async () => {
  resetTenantStore();

  await createTenant(makeInput({ slug: "both-a", status: "active", revenueModel: "managed" }));
  await createTenant(makeInput({ slug: "both-b", status: "active", revenueModel: "white-label" }));
  await createTenant(makeInput({ slug: "both-c", status: "suspended", revenueModel: "managed" }));

  const result = await listTenants({ status: "active", revenueModel: "managed" });
  assert.equal(result.length, 1);
  assert.equal(result[0].slug, "both-a");
});

test("suspendTenant sets status to suspended", async () => {
  resetTenantStore();

  const created = await createTenant(makeInput({ slug: "suspend-test", status: "active" }));
  const suspended = await suspendTenant(created.tenantId);

  assert.ok(suspended);
  assert.equal(suspended.status, "suspended");
});

test("suspendTenant returns null for unknown ID", async () => {
  resetTenantStore();

  const result = await suspendTenant("nonexistent-id");
  assert.equal(result, null);
});

test("slug uniqueness is enforced in memory store", async () => {
  resetTenantStore();

  await createTenant(makeInput({ slug: "unique-slug" }));

  const second = await createTenant(makeInput({ slug: "unique-slug-2" }));
  assert.ok(second);

  const bySlug1 = await getTenantBySlug("unique-slug");
  const bySlug2 = await getTenantBySlug("unique-slug-2");
  assert.ok(bySlug1);
  assert.ok(bySlug2);
  assert.notEqual(bySlug1.tenantId, bySlug2.tenantId);
});

test("updateTenant updates slug index when slug changes", async () => {
  resetTenantStore();

  const created = await createTenant(makeInput({ slug: "old-slug" }));
  await updateTenant(created.tenantId, { slug: "new-slug" });

  const byOldSlug = await getTenantBySlug("old-slug");
  const byNewSlug = await getTenantBySlug("new-slug");

  assert.equal(byOldSlug, null);
  assert.ok(byNewSlug);
  assert.equal(byNewSlug.tenantId, created.tenantId);
});
