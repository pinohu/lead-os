import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

// Force-unset the ANTHROPIC_API_KEY so callAnthropic returns null and
// classifyNiche takes the keyword-fallback path. This lets the tests run
// without making real API calls and without mocking fetch.
const originalKey = process.env.ANTHROPIC_API_KEY;

describe("classifyNiche (keyword fallback)", () => {
  beforeEach(() => {
    delete process.env.ANTHROPIC_API_KEY;
    vi.resetModules();
  });

  afterEach(() => {
    if (originalKey !== undefined) {
      process.env.ANTHROPIC_API_KEY = originalKey;
    }
  });

  it("identifies plumbing from a free-text problem", async () => {
    const { classifyNiche } = await import("@/lib/intake/anthropic-client");
    const result = await classifyNiche("I need a plumber for a leaky pipe");
    expect(result.source).toBe("keyword-fallback");
    expect(result.primary).toBe("plumbing");
    expect(result.candidates[0].slug).toBe("plumbing");
  });

  it("identifies hvac from a no-heat problem", async () => {
    const { classifyNiche } = await import("@/lib/intake/anthropic-client");
    const result = await classifyNiche("furnace stopped working last night, no heat");
    expect(result.primary).toBe("hvac");
  });

  it("identifies water damage restoration from a flooded basement", async () => {
    const { classifyNiche } = await import("@/lib/intake/anthropic-client");
    const result = await classifyNiche("basement flooded after heavy rain, need water damage cleanup");
    expect(["restoration", "plumbing"]).toContain(result.primary);
  });

  it("returns no primary when nothing matches", async () => {
    const { classifyNiche } = await import("@/lib/intake/anthropic-client");
    const result = await classifyNiche("zzz completely unrelated gibberish words");
    // Either null primary, or hinted niche if provided. With no hint and no
    // keyword matches we expect null.
    expect(result.primary).toBeNull();
  });

  it("honors the hinted niche when no keyword matches", async () => {
    const { classifyNiche } = await import("@/lib/intake/anthropic-client");
    const result = await classifyNiche("zzz unrelated gibberish", "plumbing");
    expect(result.primary).toBe("plumbing");
  });

  it("returns empty for blank input", async () => {
    const { classifyNiche } = await import("@/lib/intake/anthropic-client");
    const result = await classifyNiche("");
    expect(result.primary).toBeNull();
    expect(result.candidates).toEqual([]);
  });

  it("returns at most 3 candidates", async () => {
    const { classifyNiche } = await import("@/lib/intake/anthropic-client");
    const result = await classifyNiche("repair installation cleaning service");
    expect(result.candidates.length).toBeLessThanOrEqual(3);
  });

  it("sorts candidates by confidence descending", async () => {
    const { classifyNiche } = await import("@/lib/intake/anthropic-client");
    const result = await classifyNiche("electrician wiring panel upgrade outlet");
    for (let i = 0; i < result.candidates.length - 1; i++) {
      expect(result.candidates[i].confidence).toBeGreaterThanOrEqual(
        result.candidates[i + 1].confidence
      );
    }
  });
});
