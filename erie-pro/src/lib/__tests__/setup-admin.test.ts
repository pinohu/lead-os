import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {},
}));

vi.mock("@/lib/audit-log", () => ({
  audit: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
  },
}));

import { POST } from "@/app/api/setup-admin/route";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

function setupRequest(token: string) {
  return new Request("http://localhost:3002/api/setup-admin", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-admin-setup-token": token,
    },
    body: JSON.stringify({
      email: "admin@example.com",
      password: "password123",
      token,
    }),
  });
}

describe("setup-admin token gate", () => {
  it("rejects requests when ADMIN_SETUP_TOKEN is not configured", async () => {
    process.env.ALLOW_ADMIN_SETUP = "true";
    delete process.env.ADMIN_SETUP_TOKEN;

    const response = await POST(setupRequest("candidate"));

    expect(response.status).toBe(403);
  });

  it("rejects wrong setup tokens", async () => {
    process.env.ALLOW_ADMIN_SETUP = "true";
    process.env.ADMIN_SETUP_TOKEN = "setup-secret";

    const response = await POST(setupRequest("wrong-secret"));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      error: "Invalid setup token.",
    });
  });

  it("does not throw for different-length setup tokens", async () => {
    process.env.ALLOW_ADMIN_SETUP = "true";
    process.env.ADMIN_SETUP_TOKEN = "setup-secret";

    await expect(POST(setupRequest("x"))).resolves.toHaveProperty("status", 403);
  });
});
