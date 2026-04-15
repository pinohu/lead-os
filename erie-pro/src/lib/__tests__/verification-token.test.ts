import { describe, it, expect } from "vitest";
import { createHash } from "crypto";
import { hashVerificationToken } from "../verification-token";

describe("hashVerificationToken", () => {
  it("produces a 64-char lowercase hex SHA-256 digest", () => {
    const hash = hashVerificationToken("abc123");
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("matches the canonical SHA-256 of the input", () => {
    const input = "some-random-token-value";
    const expected = createHash("sha256").update(input).digest("hex");
    expect(hashVerificationToken(input)).toBe(expected);
  });

  it("is deterministic — same input produces same output", () => {
    expect(hashVerificationToken("same")).toBe(hashVerificationToken("same"));
  });

  it("differs for different inputs (basic diffusion check)", () => {
    const a = hashVerificationToken("token-a");
    const b = hashVerificationToken("token-b");
    expect(a).not.toBe(b);
  });

  it("is case-sensitive (differs when only case changes)", () => {
    expect(hashVerificationToken("ABC")).not.toBe(hashVerificationToken("abc"));
  });

  it("does not contain the raw token as a substring", () => {
    // Sanity check that the DB-at-rest value cannot be trivially reversed.
    const raw = "tokenstring-not-present-in-digest";
    const hash = hashVerificationToken(raw);
    expect(hash).not.toContain(raw);
  });

  it("hashes the empty string to the canonical SHA-256 of empty input", () => {
    // We don't want callers to ever pass "" — but if they do, the helper
    // should still be a pure hash rather than throwing or returning "".
    const expected = createHash("sha256").update("").digest("hex");
    expect(hashVerificationToken("")).toBe(expected);
  });
});
