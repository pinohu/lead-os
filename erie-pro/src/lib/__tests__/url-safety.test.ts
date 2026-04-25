import { describe, it, expect } from "vitest";
import { checkFetchableUrl } from "@/lib/url-safety";

describe("checkFetchableUrl", () => {
  describe("valid URLs", () => {
    it("accepts a standard https webhook URL", () => {
      expect(checkFetchableUrl("https://hooks.example.com/webhooks/x")).toEqual(
        { ok: true }
      );
    });

    it("accepts URLs with paths, queries, and ports", () => {
      expect(
        checkFetchableUrl("https://api.example.com:8443/v2/hook?id=42")
      ).toEqual({ ok: true });
    });

    it("accepts public IPv4 literals over https", () => {
      expect(checkFetchableUrl("https://8.8.8.8/endpoint")).toEqual({
        ok: true,
      });
    });
  });

  describe("scheme enforcement", () => {
    it("rejects http:// by default", () => {
      const r = checkFetchableUrl("http://example.com/hook");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason).toMatch(/https/);
    });

    it("allows http:// when explicitly opted in", () => {
      expect(
        checkFetchableUrl("http://example.com/hook", { allowHttp: true })
      ).toEqual({ ok: true });
    });

    it("rejects file://, gopher://, data:, javascript: schemes", () => {
      for (const u of [
        "file:///etc/passwd",
        "gopher://example.com/",
        "data:text/html,<script>alert(1)</script>",
        "javascript:alert(1)",
      ]) {
        expect(checkFetchableUrl(u).ok).toBe(false);
      }
    });
  });

  describe("credentials", () => {
    it("rejects URLs with embedded user:pass", () => {
      const r = checkFetchableUrl("https://user:pass@example.com/");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason).toMatch(/credentials/);
    });
  });

  describe("private IPv4 literals", () => {
    it.each([
      "https://127.0.0.1/x",
      "https://0.0.0.0/x",
      "https://10.1.2.3/x",
      "https://172.16.0.1/x",
      "https://172.31.255.255/x",
      "https://192.168.1.1/x",
      "https://169.254.169.254/latest/meta-data/", // AWS IMDS
      "https://224.0.0.1/x", // multicast
    ])("rejects %s", (url) => {
      expect(checkFetchableUrl(url).ok).toBe(false);
    });

    it("permits the boundary public address just outside 172.16/12", () => {
      expect(checkFetchableUrl("https://172.32.0.1/x")).toEqual({ ok: true });
      expect(checkFetchableUrl("https://172.15.255.255/x")).toEqual({
        ok: true,
      });
    });
  });

  describe("private IPv6 literals", () => {
    it.each([
      "https://[::1]/x",
      "https://[fc00::1]/x",
      "https://[fe80::1]/x",
      "https://[::ffff:127.0.0.1]/x",
    ])("rejects %s", (url) => {
      expect(checkFetchableUrl(url).ok).toBe(false);
    });
  });

  describe("internal hostnames", () => {
    it.each([
      "https://localhost/x",
      "https://LOCALHOST/x",
      "https://foo.local/x",
      "https://app.internal/x",
      "https://svc.cluster.local/x",
      "https://metadata.google.internal/x",
    ])("rejects %s", (url) => {
      expect(checkFetchableUrl(url).ok).toBe(false);
    });

    it("still accepts lookalike public hostnames", () => {
      // ".locally.com" is a real public suffix, not a private suffix match.
      expect(checkFetchableUrl("https://app.locally.com/x")).toEqual({
        ok: true,
      });
    });
  });

  describe("malformed input", () => {
    it("rejects non-URL strings", () => {
      const r = checkFetchableUrl("not a url");
      expect(r.ok).toBe(false);
    });

    it("rejects empty string", () => {
      expect(checkFetchableUrl("").ok).toBe(false);
    });
  });
});
