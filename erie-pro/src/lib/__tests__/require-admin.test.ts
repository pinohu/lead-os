import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the `auth()` call from NextAuth so we can drive the session.
const authMock = vi.fn();
vi.mock("@/lib/auth", () => ({
  auth: () => authMock(),
}));

import { requireAdmin, requireAdminSession } from "../require-admin";

describe("requireAdmin", () => {
  beforeEach(() => {
    authMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns null for a logged-in admin", async () => {
    authMock.mockResolvedValue({
      user: { id: "u1", email: "admin@example.com", role: "admin" },
    });
    expect(await requireAdmin()).toBeNull();
  });

  it("returns 401 when session has no user", async () => {
    authMock.mockResolvedValue(null);
    const res = await requireAdmin();
    expect(res).not.toBeNull();
    expect(res!.status).toBe(401);
  });

  it("returns 401 when user has no role", async () => {
    authMock.mockResolvedValue({
      user: { id: "u1", email: "someone@example.com" },
    });
    const res = await requireAdmin();
    expect(res!.status).toBe(401);
  });

  it("returns 401 when user role is `provider` (non-admin)", async () => {
    authMock.mockResolvedValue({
      user: { id: "u1", email: "provider@example.com", role: "provider" },
    });
    const res = await requireAdmin();
    expect(res!.status).toBe(401);
  });

  it("rejects role casing variants — `Admin` is NOT `admin`", async () => {
    authMock.mockResolvedValue({
      user: { id: "u1", email: "admin@example.com", role: "Admin" },
    });
    const res = await requireAdmin();
    expect(res!.status).toBe(401);
  });

  it("rejects role with extra whitespace (defense against token drift)", async () => {
    authMock.mockResolvedValue({
      user: { id: "u1", email: "admin@example.com", role: "admin " },
    });
    const res = await requireAdmin();
    expect(res!.status).toBe(401);
  });
});

describe("requireAdminSession", () => {
  beforeEach(() => {
    authMock.mockReset();
  });

  it("returns ok:true with session for a valid admin", async () => {
    const sessionFixture = {
      user: { id: "u1", email: "admin@example.com", role: "admin" },
    };
    authMock.mockResolvedValue(sessionFixture);
    const res = await requireAdminSession();
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.session.user.email).toBe("admin@example.com");
    }
  });

  it("returns ok:false with 401 response when unauthenticated", async () => {
    authMock.mockResolvedValue(null);
    const res = await requireAdminSession();
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.response.status).toBe(401);
    }
  });

  it("returns ok:false when role is not admin", async () => {
    authMock.mockResolvedValue({
      user: { id: "u1", email: "x@example.com", role: "provider" },
    });
    const res = await requireAdminSession();
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.response.status).toBe(401);
    }
  });
});
