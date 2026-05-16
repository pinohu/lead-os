import { describe, it, expect } from "vitest";
import { __test } from "@/lib/intake/feature-flag";

describe("feature flag bucketing", () => {
  describe("hashToBucket", () => {
    it("returns a number in [0, 100)", () => {
      for (let i = 0; i < 100; i++) {
        const bucket = __test.hashToBucket(`session-${i}`);
        expect(bucket).toBeGreaterThanOrEqual(0);
        expect(bucket).toBeLessThan(100);
      }
    });

    it("is deterministic for the same session id", () => {
      const sid = "test-session-abc-123";
      const a = __test.hashToBucket(sid);
      const b = __test.hashToBucket(sid);
      expect(a).toBe(b);
    });

    it("produces approximately uniform distribution", () => {
      // 1000 random session ids; expect roughly 500 in [0, 50)
      const samples = 1000;
      let underHalf = 0;
      for (let i = 0; i < samples; i++) {
        const sid = `session-${i}-${Math.random()}`;
        if (__test.hashToBucket(sid) < 50) underHalf++;
      }
      // Allow generous tolerance: 40-60% should fall under half
      expect(underHalf).toBeGreaterThan(400);
      expect(underHalf).toBeLessThan(600);
    });
  });

  describe("parseCookie", () => {
    it("returns null for undefined", () => {
      expect(__test.parseCookie(undefined)).toBeNull();
    });

    it("returns null for invalid JSON", () => {
      expect(__test.parseCookie("not-json")).toBeNull();
    });

    it("returns null for invalid variant", () => {
      const v = encodeURIComponent(JSON.stringify({ sid: "x", variant: "bogus" }));
      expect(__test.parseCookie(v)).toBeNull();
    });

    it("parses a valid cookie", () => {
      const v = encodeURIComponent(
        JSON.stringify({ sid: "abc123", variant: "intake" })
      );
      const parsed = __test.parseCookie(v);
      expect(parsed?.sid).toBe("abc123");
      expect(parsed?.variant).toBe("intake");
    });
  });

  describe("serializeCookie", () => {
    it("round-trips through parseCookie", () => {
      const orig = { sid: "test-sid-xyz", variant: "form" as const };
      const serialized = __test.serializeCookie(orig);
      const parsed = __test.parseCookie(serialized);
      expect(parsed).toEqual(orig);
    });
  });
});
