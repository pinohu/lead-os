import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { checkRateLimit, RATE_LIMITS } from "../rate-limit";

function makeRequest(ip = "127.0.0.1"): NextRequest {
  return new NextRequest("http://localhost:3002/api/test", {
    headers: {
      "x-forwarded-for": ip,
    },
  });
}

describe("RATE_LIMITS", () => {
  it("defines limits for all endpoints", () => {
    expect(RATE_LIMITS.lead).toEqual({ limit: 5, windowSeconds: 60 });
    expect(RATE_LIMITS.claim).toEqual({ limit: 3, windowSeconds: 3600 });
    expect(RATE_LIMITS.contact).toEqual({ limit: 5, windowSeconds: 60 });
    expect(RATE_LIMITS.leadPurchase).toEqual({ limit: 10, windowSeconds: 60 });
  });
});

describe("checkRateLimit", () => {
  it("returns null (allowed) for first request", async () => {
    // Use unique IP per test to avoid cross-contamination
    const req = makeRequest("10.0.0.1");
    const result = await checkRateLimit(req, "lead");
    expect(result).toBeNull();
  });

  it("returns null for requests within limit", async () => {
    const ip = "10.0.0.2";
    for (let i = 0; i < 4; i++) {
      const result = await checkRateLimit(makeRequest(ip), "lead");
      expect(result).toBeNull();
    }
  });

  it("returns 429 response when limit is exceeded", async () => {
    const ip = "10.0.0.3";
    // Exhaust the limit (5 for lead)
    for (let i = 0; i < 5; i++) {
      await checkRateLimit(makeRequest(ip), "lead");
    }
    // 6th request should be blocked
    const result = await checkRateLimit(makeRequest(ip), "lead");
    expect(result).not.toBeNull();
    expect(result!.status).toBe(429);
  });

  it("includes Retry-After header in 429 response", async () => {
    const ip = "10.0.0.4";
    for (let i = 0; i < 5; i++) {
      await checkRateLimit(makeRequest(ip), "lead");
    }
    const result = await checkRateLimit(makeRequest(ip), "lead");
    expect(result).not.toBeNull();
    expect(result!.headers.get("Retry-After")).toBeTruthy();
    expect(result!.headers.get("X-RateLimit-Remaining")).toBe("0");
  });

  it("tracks different endpoints independently", async () => {
    const ip = "10.0.0.5";
    // Exhaust lead limit
    for (let i = 0; i < 5; i++) {
      await checkRateLimit(makeRequest(ip), "lead");
    }
    // Contact should still work (different endpoint key)
    const contactResult = await checkRateLimit(makeRequest(ip), "contact");
    expect(contactResult).toBeNull();
  });

  it("tracks different IPs independently", async () => {
    // Exhaust for IP A
    for (let i = 0; i < 5; i++) {
      await checkRateLimit(makeRequest("10.0.0.6"), "lead");
    }
    // IP B should still work
    const result = await checkRateLimit(makeRequest("10.0.0.7"), "lead");
    expect(result).toBeNull();
  });

  it("returns JSON body with error message", async () => {
    const ip = "10.0.0.8";
    for (let i = 0; i < 5; i++) {
      await checkRateLimit(makeRequest(ip), "lead");
    }
    const result = await checkRateLimit(makeRequest(ip), "lead");
    expect(result).not.toBeNull();
    const body = await result!.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain("Too many requests");
  });
});
