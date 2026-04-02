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
});
