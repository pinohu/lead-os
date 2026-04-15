import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { requireCronAuth, isCronAuthorized } from "../cron-auth";

function makeRequest(authHeader?: string): NextRequest {
  const headers = new Headers();
  if (authHeader !== undefined) headers.set("authorization", authHeader);
  return new NextRequest("http://localhost/api/cron/test", { headers });
}

describe("requireCronAuth", () => {
  const originalSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    process.env.CRON_SECRET = "the-correct-secret-value-16+chars";
  });

  afterEach(() => {
    process.env.CRON_SECRET = originalSecret;
  });

  it("returns null when the Bearer token matches CRON_SECRET", () => {
    const req = makeRequest("Bearer the-correct-secret-value-16+chars");
    expect(requireCronAuth(req)).toBeNull();
  });

  it("returns 401 when the Bearer token does not match", () => {
    const req = makeRequest("Bearer WRONG-secret");
    const res = requireCronAuth(req);
    expect(res).not.toBeNull();
    expect(res!.status).toBe(401);
  });

  it("returns 401 when the Authorization header is missing", () => {
    const res = requireCronAuth(makeRequest());
    expect(res!.status).toBe(401);
  });

  it("returns 401 when CRON_SECRET is unset (never accept `Bearer undefined`)", () => {
    delete process.env.CRON_SECRET;
    const req = makeRequest("Bearer undefined");
    const res = requireCronAuth(req);
    expect(res!.status).toBe(401);
  });

  it("returns 401 when CRON_SECRET is empty string", () => {
    process.env.CRON_SECRET = "";
    const req = makeRequest("Bearer ");
    const res = requireCronAuth(req);
    expect(res!.status).toBe(401);
  });

  it("rejects near-match secrets (one-character difference)", () => {
    const req = makeRequest("Bearer the-correct-secret-value-16+charX");
    const res = requireCronAuth(req);
    expect(res!.status).toBe(401);
  });

  it("rejects mismatched prefix — `Token ...` instead of `Bearer ...`", () => {
    const req = makeRequest("Token the-correct-secret-value-16+chars");
    const res = requireCronAuth(req);
    expect(res!.status).toBe(401);
  });
});

describe("isCronAuthorized", () => {
  const originalSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    process.env.CRON_SECRET = "health-secret-16-or-more-chars";
  });

  afterEach(() => {
    process.env.CRON_SECRET = originalSecret;
  });

  it("returns true on exact match", () => {
    const req = makeRequest("Bearer health-secret-16-or-more-chars");
    expect(isCronAuthorized(req)).toBe(true);
  });

  it("returns false on mismatch", () => {
    const req = makeRequest("Bearer nope");
    expect(isCronAuthorized(req)).toBe(false);
  });

  it("returns false when CRON_SECRET is unset", () => {
    delete process.env.CRON_SECRET;
    const req = makeRequest("Bearer anything");
    expect(isCronAuthorized(req)).toBe(false);
  });

  it("returns false when Authorization header is missing", () => {
    expect(isCronAuthorized(makeRequest())).toBe(false);
  });
});
