import test from "node:test";
import assert from "node:assert/strict";
import {
  createUser,
  getUserByEmail,
  getUserById,
  listUsers,
  updateUser,
  suspendUser,
  createApiKey,
  validateApiKey,
  revokeApiKey,
  createSession,
  validateSession,
  destroySession,
  createTeamInvite,
  acceptInvite,
  listInvites,
  hasPermission,
  resetAuthStore,
  type UserRole,
} from "../src/lib/auth-system.ts";

const TEST_TENANT = "test-tenant-auth";

test("createUser generates ID and timestamps", async () => {
  resetAuthStore();

  const user = await createUser({
    email: "Alice@Example.com",
    name: "Alice",
    tenantId: TEST_TENANT,
    role: "admin",
  });

  assert.ok(user.id, "id should be set");
  assert.equal(user.email, "alice@example.com", "email should be normalized");
  assert.equal(user.name, "Alice");
  assert.equal(user.tenantId, TEST_TENANT);
  assert.equal(user.role, "admin");
  assert.equal(user.status, "active");
  assert.ok(user.createdAt);
  assert.ok(user.updatedAt);
  assert.deepEqual(user.apiKeys, []);
});

test("getUserByEmail returns user with normalized lookup", async () => {
  resetAuthStore();

  const created = await createUser({
    email: "bob@example.com",
    name: "Bob",
    tenantId: TEST_TENANT,
    role: "operator",
  });

  const found = await getUserByEmail("Bob@Example.com", TEST_TENANT);
  assert.ok(found);
  assert.equal(found.id, created.id);
  assert.equal(found.email, "bob@example.com");
});

test("getUserByEmail returns null for non-existent user", async () => {
  resetAuthStore();
  const found = await getUserByEmail("nobody@example.com", TEST_TENANT);
  assert.equal(found, null);
});

test("getUserById returns user", async () => {
  resetAuthStore();

  const created = await createUser({
    email: "charlie@example.com",
    name: "Charlie",
    tenantId: TEST_TENANT,
    role: "viewer",
  });

  const found = await getUserById(created.id);
  assert.ok(found);
  assert.equal(found.name, "Charlie");
});

test("listUsers returns only users for the given tenant", async () => {
  resetAuthStore();

  await createUser({ email: "a@t1.com", name: "A", tenantId: "t1", role: "admin" });
  await createUser({ email: "b@t1.com", name: "B", tenantId: "t1", role: "viewer" });
  await createUser({ email: "c@t2.com", name: "C", tenantId: "t2", role: "operator" });

  const t1Users = await listUsers("t1");
  assert.equal(t1Users.length, 2);
  assert.ok(t1Users.every((u) => u.tenantId === "t1"));
});

test("updateUser changes role and name", async () => {
  resetAuthStore();

  const user = await createUser({
    email: "update@example.com",
    name: "Original",
    tenantId: TEST_TENANT,
    role: "viewer",
  });

  const updated = await updateUser(user.id, { name: "Updated", role: "admin" });
  assert.ok(updated);
  assert.equal(updated.name, "Updated");
  assert.equal(updated.role, "admin");
  assert.ok(updated.updatedAt, "updatedAt should be set");
});

test("suspendUser sets status to suspended", async () => {
  resetAuthStore();

  const user = await createUser({
    email: "suspend@example.com",
    name: "Suspend Me",
    tenantId: TEST_TENANT,
    role: "operator",
  });

  const suspended = await suspendUser(user.id);
  assert.ok(suspended);
  assert.equal(suspended.status, "suspended");
});

test("createApiKey returns raw key with los_ prefix", async () => {
  resetAuthStore();

  const user = await createUser({
    email: "apikey@example.com",
    name: "Key User",
    tenantId: TEST_TENANT,
    role: "admin",
  });

  const result = await createApiKey(user.id, "My Key", ["read:leads", "write:leads"]);
  assert.ok(result);
  assert.ok(result.rawKey.startsWith("los_"), "raw key should start with los_");
  assert.equal(result.record.prefix, result.rawKey.slice(0, 8));
  assert.deepEqual(result.record.permissions, ["read:leads", "write:leads"]);

  const refreshedUser = await getUserById(user.id);
  assert.ok(refreshedUser);
  assert.equal(refreshedUser.apiKeys.length, 1);
});

test("validateApiKey returns user and permissions for correct key", async () => {
  resetAuthStore();

  const user = await createUser({
    email: "validate@example.com",
    name: "Validate User",
    tenantId: TEST_TENANT,
    role: "operator",
  });

  const result = await createApiKey(user.id, "Test Key", ["read:leads"]);
  assert.ok(result);

  const validated = await validateApiKey(result.rawKey);
  assert.ok(validated);
  assert.equal(validated.user.id, user.id);
  assert.deepEqual(validated.permissions, ["read:leads"]);
});

test("validateApiKey returns null for wrong key", async () => {
  resetAuthStore();

  const user = await createUser({
    email: "wrongkey@example.com",
    name: "Wrong Key",
    tenantId: TEST_TENANT,
    role: "operator",
  });

  await createApiKey(user.id, "Key", ["read:leads"]);

  const validated = await validateApiKey("los_0000000000000000000000000000000000000000000000000000000000000000");
  assert.equal(validated, null);
});

test("validateApiKey returns null for non-los_ prefix", async () => {
  resetAuthStore();
  const validated = await validateApiKey("invalid_key_here");
  assert.equal(validated, null);
});

test("revokeApiKey removes the key", async () => {
  resetAuthStore();

  const user = await createUser({
    email: "revoke@example.com",
    name: "Revoke User",
    tenantId: TEST_TENANT,
    role: "admin",
  });

  const result = await createApiKey(user.id, "Revocable", ["read:leads"]);
  assert.ok(result);

  const revoked = await revokeApiKey(result.record.id);
  assert.equal(revoked, true);

  const validated = await validateApiKey(result.rawKey);
  assert.equal(validated, null);

  const refreshedUser = await getUserById(user.id);
  assert.ok(refreshedUser);
  assert.equal(refreshedUser.apiKeys.length, 0);
});

test("createSession returns token with sess_ prefix", async () => {
  resetAuthStore();

  const user = await createUser({
    email: "session@example.com",
    name: "Session User",
    tenantId: TEST_TENANT,
    role: "admin",
  });

  const result = await createSession(user.id);
  assert.ok(result);
  assert.ok(result.token.startsWith("sess_"));
  assert.equal(result.session.userId, user.id);
  assert.equal(result.session.tenantId, TEST_TENANT);
  assert.equal(result.session.role, "admin");
});

test("validateSession returns session for valid token", async () => {
  resetAuthStore();

  const user = await createUser({
    email: "validsess@example.com",
    name: "Valid",
    tenantId: TEST_TENANT,
    role: "viewer",
  });

  const result = await createSession(user.id);
  assert.ok(result);

  const session = await validateSession(result.token);
  assert.ok(session);
  assert.equal(session.userId, user.id);
});

test("validateSession returns null for invalid token", async () => {
  resetAuthStore();
  const session = await validateSession("sess_invalid_token_here");
  assert.equal(session, null);
});

test("destroySession invalidates the session", async () => {
  resetAuthStore();

  const user = await createUser({
    email: "destroy@example.com",
    name: "Destroy",
    tenantId: TEST_TENANT,
    role: "admin",
  });

  const result = await createSession(user.id);
  assert.ok(result);

  await destroySession(result.token);

  const session = await validateSession(result.token);
  assert.equal(session, null);
});

test("createSession returns null for suspended user", async () => {
  resetAuthStore();

  const user = await createUser({
    email: "suspended@example.com",
    name: "Suspended",
    tenantId: TEST_TENANT,
    role: "admin",
  });

  await suspendUser(user.id);

  const result = await createSession(user.id);
  assert.equal(result, null);
});

test("RBAC: owner has all permissions", () => {
  assert.equal(hasPermission("owner", "read:leads"), true);
  assert.equal(hasPermission("owner", "write:billing"), true);
  assert.equal(hasPermission("owner", "write:team"), true);
  assert.equal(hasPermission("owner", "anything:random"), true);
});

test("RBAC: admin has team and settings but not billing", () => {
  assert.equal(hasPermission("admin", "read:leads"), true);
  assert.equal(hasPermission("admin", "write:team"), true);
  assert.equal(hasPermission("admin", "write:settings"), true);
  assert.equal(hasPermission("admin", "write:billing"), false);
});

test("RBAC: operator has read/write leads but not team", () => {
  assert.equal(hasPermission("operator", "read:leads"), true);
  assert.equal(hasPermission("operator", "write:leads"), true);
  assert.equal(hasPermission("operator", "read:analytics"), true);
  assert.equal(hasPermission("operator", "write:team"), false);
  assert.equal(hasPermission("operator", "write:settings"), false);
});

test("RBAC: viewer is read-only", () => {
  assert.equal(hasPermission("viewer", "read:leads"), true);
  assert.equal(hasPermission("viewer", "read:analytics"), true);
  assert.equal(hasPermission("viewer", "write:leads"), false);
  assert.equal(hasPermission("viewer", "write:team"), false);
});

test("RBAC: billing-admin has billing and analytics only", () => {
  assert.equal(hasPermission("billing-admin", "read:analytics"), true);
  assert.equal(hasPermission("billing-admin", "write:billing"), true);
  assert.equal(hasPermission("billing-admin", "read:usage"), true);
  assert.equal(hasPermission("billing-admin", "read:leads"), false);
  assert.equal(hasPermission("billing-admin", "write:team"), false);
});

test("createTeamInvite creates pending invite with 72h expiry", async () => {
  resetAuthStore();

  const invite = await createTeamInvite("new@example.com", TEST_TENANT, "operator", "inviter-id");

  assert.ok(invite.id);
  assert.equal(invite.email, "new@example.com");
  assert.equal(invite.tenantId, TEST_TENANT);
  assert.equal(invite.role, "operator");
  assert.equal(invite.invitedBy, "inviter-id");
  assert.equal(invite.status, "pending");

  const expiresMs = new Date(invite.expiresAt).getTime() - Date.now();
  const seventyTwoHoursMs = 72 * 60 * 60 * 1000;
  assert.ok(expiresMs > seventyTwoHoursMs - 5000 && expiresMs <= seventyTwoHoursMs);
});

test("acceptInvite creates user from invite", async () => {
  resetAuthStore();

  const invite = await createTeamInvite("accept@example.com", TEST_TENANT, "viewer", "inviter-id");
  const user = await acceptInvite(invite.id, "Accepted User");

  assert.ok(user);
  assert.equal(user.email, "accept@example.com");
  assert.equal(user.name, "Accepted User");
  assert.equal(user.role, "viewer");
  assert.equal(user.tenantId, TEST_TENANT);
  assert.equal(user.status, "active");
});

test("acceptInvite returns null for already accepted invite", async () => {
  resetAuthStore();

  const invite = await createTeamInvite("double@example.com", TEST_TENANT, "operator", "inviter-id");
  await acceptInvite(invite.id, "First");
  const second = await acceptInvite(invite.id, "Second");
  assert.equal(second, null);
});

test("acceptInvite returns null for non-existent invite", async () => {
  resetAuthStore();
  const result = await acceptInvite("non-existent-id", "Nobody");
  assert.equal(result, null);
});

test("listInvites returns invites for tenant", async () => {
  resetAuthStore();

  await createTeamInvite("inv1@example.com", TEST_TENANT, "viewer", "inviter");
  await createTeamInvite("inv2@example.com", TEST_TENANT, "operator", "inviter");
  await createTeamInvite("inv3@example.com", "other-tenant", "admin", "inviter");

  const invites = await listInvites(TEST_TENANT);
  assert.equal(invites.length, 2);
  assert.ok(invites.every((i) => i.tenantId === TEST_TENANT));
});
