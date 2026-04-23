import test from "node:test";
import assert from "node:assert/strict";
import {
  createUser,
  createApiKey,
  createSession,
  validateApiKey,
  validateSession,
  hasPermission,
  resetAuthStore,
  type UserRole,
} from "../src/lib/auth-system.ts";

// ---------------------------------------------------------------------------
// The auth-middleware.ts module imports NextResponse which requires the full
// Next.js runtime. We test the underlying auth-system functions that power
// authenticateRequest and requireAuth. These functions contain all the real
// authentication and authorization logic.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function setupActiveUser(
  role: UserRole = "operator",
  email?: string,
) {
  return createUser({
    email: email ?? `auth-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
    name: "Auth Test User",
    tenantId: "tenant-auth-test",
    role,
    status: "active",
  });
}

// ---------------------------------------------------------------------------
// validateApiKey — valid key
// ---------------------------------------------------------------------------

test("validateApiKey returns user and permissions for valid key", async () => {
  resetAuthStore();

  const user = await setupActiveUser();
  const keyResult = await createApiKey(user.id, "test-key", ["read:leads", "write:leads"]);
  assert.ok(keyResult);

  const result = await validateApiKey(keyResult.rawKey);

  assert.ok(result);
  assert.equal(result.user.id, user.id);
  assert.equal(result.user.tenantId, "tenant-auth-test");
  assert.deepEqual(result.permissions, ["read:leads", "write:leads"]);
});

// ---------------------------------------------------------------------------
// validateApiKey — invalid key
// ---------------------------------------------------------------------------

test("validateApiKey returns null for unknown key", async () => {
  resetAuthStore();

  const result = await validateApiKey(
    "los_0000000000000000000000000000000000000000000000000000000000000000",
  );

  assert.equal(result, null);
});

test("validateApiKey returns null for non-los prefix", async () => {
  resetAuthStore();

  const result = await validateApiKey("bad_prefix_key");

  assert.equal(result, null);
});

test("validateApiKey returns null for empty string", async () => {
  resetAuthStore();

  const result = await validateApiKey("");

  assert.equal(result, null);
});

// ---------------------------------------------------------------------------
// validateApiKey — suspended user
// ---------------------------------------------------------------------------

test("validateApiKey returns null when user is suspended", async () => {
  resetAuthStore();

  const user = await createUser({
    email: "suspended-key@example.com",
    name: "Suspended User",
    tenantId: "tenant-auth-test",
    role: "operator",
    status: "active",
  });
  const keyResult = await createApiKey(user.id, "soon-suspended", ["read:leads"]);
  assert.ok(keyResult);

  // Verify key works initially
  const validResult = await validateApiKey(keyResult.rawKey);
  assert.ok(validResult);

  // Suspend the user by directly modifying the in-memory store via the
  // updateUser path
  const { updateUser } = await import("../src/lib/auth-system.ts");
  await updateUser(user.id, { status: "suspended" });

  const result = await validateApiKey(keyResult.rawKey);
  assert.equal(result, null);
});

// ---------------------------------------------------------------------------
// validateSession — valid session
// ---------------------------------------------------------------------------

test("validateSession returns session for valid token", async () => {
  resetAuthStore();

  const user = await setupActiveUser("admin");
  const sessionResult = await createSession(user.id);
  assert.ok(sessionResult);

  const session = await validateSession(sessionResult.token);

  assert.ok(session);
  assert.equal(session.userId, user.id);
  assert.equal(session.tenantId, "tenant-auth-test");
  assert.equal(session.role, "admin");
});

// ---------------------------------------------------------------------------
// validateSession — invalid session
// ---------------------------------------------------------------------------

test("validateSession returns null for unknown token", async () => {
  resetAuthStore();

  const result = await validateSession(
    "sess_0000000000000000000000000000000000000000000000000000000000000000",
  );

  assert.equal(result, null);
});

test("validateSession returns null for non-sess prefix", async () => {
  resetAuthStore();

  const result = await validateSession("bad_prefix_token");

  assert.equal(result, null);
});

test("validateSession returns null for empty string", async () => {
  resetAuthStore();

  const result = await validateSession("");

  assert.equal(result, null);
});

// ---------------------------------------------------------------------------
// createSession — suspended user
// ---------------------------------------------------------------------------

test("createSession returns null for suspended user", async () => {
  resetAuthStore();

  const user = await createUser({
    email: "no-session@example.com",
    name: "Suspended",
    tenantId: "tenant-auth-test",
    role: "operator",
    status: "suspended",
  });

  const result = await createSession(user.id);

  assert.equal(result, null);
});

test("createSession returns null for nonexistent user", async () => {
  resetAuthStore();

  const result = await createSession("nonexistent-user-id");

  assert.equal(result, null);
});

// ---------------------------------------------------------------------------
// hasPermission — RBAC
// ---------------------------------------------------------------------------

test("hasPermission returns true for owner on any permission", () => {
  assert.equal(hasPermission("owner", "read:leads"), true);
  assert.equal(hasPermission("owner", "write:billing"), true);
  assert.equal(hasPermission("owner", "write:provisioning"), true);
  assert.equal(hasPermission("owner", "arbitrary:permission"), true);
});

test("hasPermission returns correct results for admin role", () => {
  assert.equal(hasPermission("admin", "read:leads"), true);
  assert.equal(hasPermission("admin", "write:leads"), true);
  assert.equal(hasPermission("admin", "read:analytics"), true);
  assert.equal(hasPermission("admin", "write:team"), true);
  assert.equal(hasPermission("admin", "write:billing"), false);
});

test("hasPermission returns correct results for operator role", () => {
  assert.equal(hasPermission("operator", "read:leads"), true);
  assert.equal(hasPermission("operator", "write:leads"), true);
  assert.equal(hasPermission("operator", "read:analytics"), true);
  assert.equal(hasPermission("operator", "write:team"), false);
  assert.equal(hasPermission("operator", "write:settings"), false);
});

test("hasPermission returns correct results for viewer role", () => {
  assert.equal(hasPermission("viewer", "read:leads"), true);
  assert.equal(hasPermission("viewer", "read:analytics"), true);
  assert.equal(hasPermission("viewer", "write:leads"), false);
  assert.equal(hasPermission("viewer", "write:funnels"), false);
  assert.equal(hasPermission("viewer", "write:billing"), false);
});

test("hasPermission returns correct results for billing-admin role", () => {
  assert.equal(hasPermission("billing-admin", "read:billing"), true);
  assert.equal(hasPermission("billing-admin", "write:billing"), true);
  assert.equal(hasPermission("billing-admin", "read:usage"), true);
  assert.equal(hasPermission("billing-admin", "read:analytics"), true);
  assert.equal(hasPermission("billing-admin", "read:leads"), false);
  assert.equal(hasPermission("billing-admin", "write:leads"), false);
});

// ---------------------------------------------------------------------------
// API key permissions scoping
// ---------------------------------------------------------------------------

test("API key can be created with specific permissions", async () => {
  resetAuthStore();

  const user = await setupActiveUser("admin");
  const keyResult = await createApiKey(user.id, "scoped-key", ["read:leads"]);
  assert.ok(keyResult);

  const validated = await validateApiKey(keyResult.rawKey);
  assert.ok(validated);
  assert.deepEqual(validated.permissions, ["read:leads"]);
});

test("API key can be created with empty permissions", async () => {
  resetAuthStore();

  const user = await setupActiveUser("admin");
  const keyResult = await createApiKey(user.id, "empty-perms", []);
  assert.ok(keyResult);

  const validated = await validateApiKey(keyResult.rawKey);
  assert.ok(validated);
  assert.deepEqual(validated.permissions, []);
});

// ---------------------------------------------------------------------------
// API key — createApiKey returns null for nonexistent user
// ---------------------------------------------------------------------------

test("createApiKey returns null for nonexistent user", async () => {
  resetAuthStore();

  const result = await createApiKey("nonexistent-user", "orphan-key", ["read:leads"]);

  assert.equal(result, null);
});

// ---------------------------------------------------------------------------
// Session token format
// ---------------------------------------------------------------------------

test("session token starts with sess_ prefix", async () => {
  resetAuthStore();

  const user = await setupActiveUser();
  const sessionResult = await createSession(user.id);
  assert.ok(sessionResult);

  assert.ok(sessionResult.token.startsWith("sess_"));
});

test("API key raw key starts with los_ prefix", async () => {
  resetAuthStore();

  const user = await setupActiveUser();
  const keyResult = await createApiKey(user.id, "prefix-check", ["read:leads"]);
  assert.ok(keyResult);

  assert.ok(keyResult.rawKey.startsWith("los_"));
});

// ---------------------------------------------------------------------------
// Multiple sessions for same user
// ---------------------------------------------------------------------------

test("multiple sessions can be created for the same user", async () => {
  resetAuthStore();

  const user = await setupActiveUser();
  const session1 = await createSession(user.id);
  const session2 = await createSession(user.id);
  assert.ok(session1);
  assert.ok(session2);

  assert.notEqual(session1.token, session2.token);

  const validated1 = await validateSession(session1.token);
  const validated2 = await validateSession(session2.token);
  assert.ok(validated1);
  assert.ok(validated2);
  assert.equal(validated1.userId, validated2.userId);
});
