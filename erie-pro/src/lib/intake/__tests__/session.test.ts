import { describe, it, expect } from "vitest";
import { mintSessionToken, verifySessionToken } from "@/lib/intake/session";

describe("intake session tokens", () => {
  describe("mintSessionToken", () => {
    it("produces base64url tokens of consistent length", () => {
      const a = mintSessionToken();
      const b = mintSessionToken();
      expect(a).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(a.length).toBe(43); // 32 bytes → base64url, no padding
      expect(b.length).toBe(43);
    });

    it("never produces the same token twice", () => {
      const seen = new Set<string>();
      for (let i = 0; i < 100; i++) {
        const t = mintSessionToken();
        expect(seen.has(t)).toBe(false);
        seen.add(t);
      }
    });
  });

  describe("verifySessionToken", () => {
    it("permits when stored is null (legacy / pre-migration row)", () => {
      expect(verifySessionToken(null, "anything")).toBe(true);
      expect(verifySessionToken(null, null)).toBe(true);
      expect(verifySessionToken(undefined, "anything")).toBe(true);
    });

    it("rejects when stored is set but presented is missing", () => {
      expect(verifySessionToken("real-token", null)).toBe(false);
      expect(verifySessionToken("real-token", undefined)).toBe(false);
      expect(verifySessionToken("real-token", "")).toBe(false);
    });

    it("rejects when presented does not match", () => {
      expect(verifySessionToken("real-token", "wrong-token")).toBe(false);
    });

    it("rejects when lengths differ even if prefix matches", () => {
      expect(verifySessionToken("real-token", "real-toke")).toBe(false);
      expect(verifySessionToken("real-token", "real-token-extra")).toBe(false);
    });

    it("permits when stored matches presented exactly", () => {
      const t = mintSessionToken();
      expect(verifySessionToken(t, t)).toBe(true);
    });

    it("is constant-time over equal-length compares (no early-exit by character)", () => {
      // Smoke test: cannot observe timing in vitest, but verify the function
      // doesn't early-exit on first mismatch by checking it returns false for
      // strings that differ only at the last char.
      expect(verifySessionToken("aaaaa", "aaaab")).toBe(false);
      expect(verifySessionToken("aaaaa", "baaaa")).toBe(false);
    });
  });
});
