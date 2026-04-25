import { describe, it, expect } from "vitest";
import { safeCallbackUrl } from "../safe-redirect";

describe("safeCallbackUrl", () => {
  describe("accepts same-origin relative paths", () => {
    it("accepts a simple rooted path", () => {
      expect(safeCallbackUrl("/dashboard")).toBe("/dashboard");
    });

    it("accepts a rooted path with query string", () => {
      expect(safeCallbackUrl("/dashboard/leads?filter=open")).toBe(
        "/dashboard/leads?filter=open",
      );
    });

    it("accepts a rooted path with fragment", () => {
      expect(safeCallbackUrl("/settings#notifications")).toBe(
        "/settings#notifications",
      );
    });

    it("accepts a deeply nested path", () => {
      expect(safeCallbackUrl("/admin/founding/cohort-2")).toBe(
        "/admin/founding/cohort-2",
      );
    });

    it("accepts root itself", () => {
      expect(safeCallbackUrl("/")).toBe("/");
    });
  });

  describe("rejects off-origin and hostile inputs", () => {
    it("rejects absolute https URL", () => {
      expect(safeCallbackUrl("https://evil.com")).toBe("/dashboard");
    });

    it("rejects absolute http URL", () => {
      expect(safeCallbackUrl("http://evil.com/steal")).toBe("/dashboard");
    });

    it("rejects protocol-relative URL (//host)", () => {
      expect(safeCallbackUrl("//evil.com/steal")).toBe("/dashboard");
    });

    it("rejects backslash-prefixed protocol-relative URL", () => {
      expect(safeCallbackUrl("/\\evil.com")).toBe("/dashboard");
    });

    it("rejects javascript: scheme", () => {
      expect(safeCallbackUrl("javascript:alert(1)")).toBe("/dashboard");
    });

    it("rejects data: scheme", () => {
      expect(safeCallbackUrl("data:text/html,<script>alert(1)</script>")).toBe(
        "/dashboard",
      );
    });

    it("rejects relative-upward paths (no leading slash)", () => {
      expect(safeCallbackUrl("../foo")).toBe("/dashboard");
    });

    it("rejects bare relative paths", () => {
      expect(safeCallbackUrl("dashboard")).toBe("/dashboard");
    });

    it("rejects UNC-style backslashes", () => {
      expect(safeCallbackUrl("\\\\evil.com")).toBe("/dashboard");
    });
  });

  describe("handles empty and non-string inputs", () => {
    it("returns fallback for null", () => {
      expect(safeCallbackUrl(null)).toBe("/dashboard");
    });

    it("returns fallback for undefined", () => {
      expect(safeCallbackUrl(undefined)).toBe("/dashboard");
    });

    it("returns fallback for empty string", () => {
      expect(safeCallbackUrl("")).toBe("/dashboard");
    });
  });

  describe("custom fallback", () => {
    it("uses the custom fallback when given", () => {
      expect(safeCallbackUrl("https://evil.com", "/home")).toBe("/home");
    });

    it("returns the raw path on success regardless of fallback", () => {
      expect(safeCallbackUrl("/dashboard", "/home")).toBe("/dashboard");
    });
  });
});
