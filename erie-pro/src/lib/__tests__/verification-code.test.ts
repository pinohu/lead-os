import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createHmac } from "crypto";
import {
  hashVerificationCode,
  verifyVerificationCode,
} from "../verification-code";

const TEST_SECRET = "test-verification-code-secret-16chars";

describe("verification-code", () => {
  beforeEach(() => {
    vi.stubEnv("NEXTAUTH_SECRET", TEST_SECRET);
    vi.stubEnv("VERIFICATION_CODE_SECRET", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("hashVerificationCode", () => {
    it("produces a 64-char lowercase hex HMAC-SHA256 digest", () => {
      const hash = hashVerificationCode("123456");
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it("matches the canonical HMAC-SHA256 under the configured secret", () => {
      const code = "654321";
      const expected = createHmac("sha256", TEST_SECRET).update(code).digest("hex");
      expect(hashVerificationCode(code)).toBe(expected);
    });

    it("is deterministic for the same secret + code", () => {
      expect(hashVerificationCode("111111")).toBe(hashVerificationCode("111111"));
    });

    it("produces different digests for different codes", () => {
      expect(hashVerificationCode("111111")).not.toBe(hashVerificationCode("222222"));
    });

    it("produces different digests when the secret changes", () => {
      const a = hashVerificationCode("123456");
      vi.stubEnv("NEXTAUTH_SECRET", "a-different-but-long-enough-secret-value");
      const b = hashVerificationCode("123456");
      expect(a).not.toBe(b);
    });

    it("prefers VERIFICATION_CODE_SECRET over NEXTAUTH_SECRET when both set", () => {
      const withNextAuth = hashVerificationCode("123456");
      vi.stubEnv("VERIFICATION_CODE_SECRET", "dedicated-code-secret-value-1234");
      const withDedicated = hashVerificationCode("123456");
      expect(withDedicated).not.toBe(withNextAuth);
      // And it should equal HMAC under the dedicated secret
      expect(withDedicated).toBe(
        createHmac("sha256", "dedicated-code-secret-value-1234").update("123456").digest("hex")
      );
    });

    it("throws when neither secret is set", () => {
      vi.stubEnv("NEXTAUTH_SECRET", "");
      vi.stubEnv("VERIFICATION_CODE_SECRET", "");
      expect(() => hashVerificationCode("123456")).toThrow(
        /must be set \(min 16 chars\)/
      );
    });

    it("throws when the secret is too short (<16 chars)", () => {
      vi.stubEnv("NEXTAUTH_SECRET", "short");
      expect(() => hashVerificationCode("123456")).toThrow(/min 16 chars/);
    });

    it("does not contain the raw code as a substring", () => {
      const code = "424242";
      expect(hashVerificationCode(code)).not.toContain(code);
    });
  });

  describe("verifyVerificationCode", () => {
    it("returns true for a matching code", () => {
      const hash = hashVerificationCode("999111");
      expect(verifyVerificationCode("999111", hash)).toBe(true);
    });

    it("returns false for a mismatched code", () => {
      const hash = hashVerificationCode("999111");
      expect(verifyVerificationCode("999112", hash)).toBe(false);
    });

    it("returns false for an empty stored hash", () => {
      expect(verifyVerificationCode("123456", "")).toBe(false);
    });

    it("returns false for a stored hash of a different length", () => {
      // Shorter-than-expected hex string (32 chars instead of 64)
      const truncated = hashVerificationCode("123456").slice(0, 32);
      expect(verifyVerificationCode("123456", truncated)).toBe(false);
    });

    it("returns false (not throw) when the secret is missing", () => {
      const hash = hashVerificationCode("555555");
      vi.stubEnv("NEXTAUTH_SECRET", "");
      vi.stubEnv("VERIFICATION_CODE_SECRET", "");
      // The compare path should swallow the throw and return false so the
      // caller's "wrong code" UX still fires gracefully (while the server
      // also fails closed — no successful verification is possible).
      expect(verifyVerificationCode("555555", hash)).toBe(false);
    });

    it("returns false for non-string inputs", () => {
      // @ts-expect-error deliberate bad input
      expect(verifyVerificationCode(123456, "abc")).toBe(false);
      // @ts-expect-error deliberate bad input
      expect(verifyVerificationCode("123456", null)).toBe(false);
    });

    it("returns false when given a stored hash with odd-length hex", () => {
      // Buffer.from(oddHex, "hex") truncates — ensure we still reject.
      expect(verifyVerificationCode("123456", "abc")).toBe(false);
    });
  });
});
