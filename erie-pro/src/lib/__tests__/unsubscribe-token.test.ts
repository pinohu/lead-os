import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { generateUnsubscribeToken } from "../unsubscribe-token";

describe("generateUnsubscribeToken", () => {
  const originalUnsub = process.env.UNSUBSCRIBE_SECRET;
  const originalNext = process.env.NEXTAUTH_SECRET;

  afterEach(() => {
    process.env.UNSUBSCRIBE_SECRET = originalUnsub;
    process.env.NEXTAUTH_SECRET = originalNext;
  });

  describe("with a configured secret", () => {
    beforeEach(() => {
      delete process.env.UNSUBSCRIBE_SECRET;
      process.env.NEXTAUTH_SECRET = "a-nice-long-secret-for-testing-32chars";
    });

    it("returns a deterministic 32-hex-char token", () => {
      const token = generateUnsubscribeToken("user@example.com");
      expect(token).toMatch(/^[0-9a-f]{32}$/);
    });

    it("is stable across calls for the same email", () => {
      const a = generateUnsubscribeToken("user@example.com");
      const b = generateUnsubscribeToken("user@example.com");
      expect(a).toBe(b);
    });

    it("produces different tokens for different emails", () => {
      const a = generateUnsubscribeToken("alice@example.com");
      const b = generateUnsubscribeToken("bob@example.com");
      expect(a).not.toBe(b);
    });

    it("normalizes case so UPPER and lower match", () => {
      expect(generateUnsubscribeToken("User@Example.COM")).toBe(
        generateUnsubscribeToken("user@example.com"),
      );
    });

    it("normalizes surrounding whitespace", () => {
      expect(generateUnsubscribeToken("  user@example.com  ")).toBe(
        generateUnsubscribeToken("user@example.com"),
      );
    });

    it("prefers UNSUBSCRIBE_SECRET over NEXTAUTH_SECRET when both set", () => {
      process.env.UNSUBSCRIBE_SECRET = "unsubscribe-specific-secret-16+chars";
      process.env.NEXTAUTH_SECRET = "different-value-should-not-affect-16+";
      const withUnsub = generateUnsubscribeToken("user@example.com");

      process.env.UNSUBSCRIBE_SECRET = "unsubscribe-specific-secret-16+chars";
      process.env.NEXTAUTH_SECRET = "yet-another-nextauth-value-16+chars!";
      const withDifferentNextauth = generateUnsubscribeToken("user@example.com");

      expect(withUnsub).toBe(withDifferentNextauth);
    });
  });

  describe("fail-closed when no secret is available", () => {
    it("throws when both secrets are missing", () => {
      delete process.env.UNSUBSCRIBE_SECRET;
      delete process.env.NEXTAUTH_SECRET;
      expect(() => generateUnsubscribeToken("user@example.com")).toThrow(
        /UNSUBSCRIBE_SECRET or NEXTAUTH_SECRET/,
      );
    });

    it("throws when secret is empty string", () => {
      process.env.UNSUBSCRIBE_SECRET = "";
      process.env.NEXTAUTH_SECRET = "";
      expect(() => generateUnsubscribeToken("user@example.com")).toThrow();
    });

    it("throws when secret is too short (< 16 chars)", () => {
      delete process.env.UNSUBSCRIBE_SECRET;
      process.env.NEXTAUTH_SECRET = "too-short";
      expect(() => generateUnsubscribeToken("user@example.com")).toThrow(
        /min 16 chars/,
      );
    });
  });
});
