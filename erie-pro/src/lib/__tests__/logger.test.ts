import { describe, it, expect, vi, beforeEach } from "vitest";

// We need to test the logger module, but it reads process.env at module level.
// Set env before importing.
beforeEach(() => {
  vi.restoreAllMocks();
});

describe("logger", () => {
  it("exports info, warn, error, debug methods", async () => {
    const { logger } = await import("../logger");
    expect(typeof logger.info).toBe("function");
    expect(typeof logger.warn).toBe("function");
    expect(typeof logger.error).toBe("function");
    expect(typeof logger.debug).toBe("function");
  });

  it("calls console.log for info level", async () => {
    const mod = await import("../logger");
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    mod.logger.info("test-tag", "hello world");
    expect(spy).toHaveBeenCalledTimes(1);
    // Logger outputs structured JSON in non-dev mode (test env)
    const output = spy.mock.calls[0][0] as string;
    expect(output).toContain("test-tag");
    expect(output).toContain("hello world");
    spy.mockRestore();
  });

  it("calls console.error for error level", async () => {
    const mod = await import("../logger");
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    mod.logger.error("test-tag", "something broke");
    expect(spy).toHaveBeenCalledTimes(1);
    const output = spy.mock.calls[0][0] as string;
    expect(output).toContain("error");
    expect(output).toContain("something broke");
    spy.mockRestore();
  });

  // ── Secret redaction ──────────────────────────────────────────────

  it("redacts the value of any `password` field", async () => {
    const mod = await import("../logger");
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    mod.logger.info("auth", { email: "jane@example.com", password: "hunter2" });
    const out = spy.mock.calls[0][0] as string;
    expect(out).not.toContain("hunter2");
    expect(out).toContain("***");
    spy.mockRestore();
  });

  it("redacts passwordHash, apiKey, rawKey, token, authorization fields", async () => {
    const mod = await import("../logger");
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    mod.logger.info("x", {
      passwordHash: "$2b$10$abcdefghijklmnopqrstuv",
      apiKey: "ep_abcdef1234567890abcdef1234567890",
      rawKey: "ep_f00df00df00df00df00df00df00df00d",
      token: "jwt.something.signed",
      authorization: "Bearer xyz.abc.def",
    });
    const out = spy.mock.calls[0][0] as string;
    expect(out).not.toMatch(/\$2b\$10/);
    expect(out).not.toMatch(/ep_[a-f0-9]+/);
    expect(out).not.toContain("jwt.something.signed");
    expect(out).not.toMatch(/Bearer\s+xyz/);
    spy.mockRestore();
  });

  it("redacts Stripe secret keys embedded in free-form strings", async () => {
    const mod = await import("../logger");
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    mod.logger.error(
      "stripe",
      "Failed with key sk_live_abcd1234EFGHwxyz5678 and whsec_qwertyuiop123456"
    );
    const out = spy.mock.calls[0][0] as string;
    expect(out).not.toMatch(/sk_live_abcd1234EFGHwxyz5678/);
    expect(out).not.toMatch(/whsec_qwertyuiop123456/);
    expect(out).toContain("sk_live_***");
    expect(out).toContain("whsec_***");
    spy.mockRestore();
  });

  it("redacts `Bearer <token>` in headers strings", async () => {
    const mod = await import("../logger");
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    mod.logger.warn(
      "proxy",
      "Incoming request authorization: Bearer abcd1234efgh5678.jwt.payload"
    );
    const out = spy.mock.calls[0][0] as string;
    expect(out).not.toMatch(/Bearer\s+abcd/);
    expect(out).toContain("Bearer ***");
    spy.mockRestore();
  });

  it("still redacts emails and phone numbers (regression check)", async () => {
    const mod = await import("../logger");
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    mod.logger.info("contact", "Contact jane@example.com or (814) 555-0199");
    const out = spy.mock.calls[0][0] as string;
    expect(out).not.toContain("jane@example.com");
    expect(out).not.toContain("555-0199");
    expect(out).toContain("j***@example.com");
    expect(out).toContain("***-**-0199");
    spy.mockRestore();
  });
});
