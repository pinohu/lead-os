import { describe, it, expect, vi, beforeEach } from "vitest";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("sendEmail", () => {
  it("returns true in dry-run mode (no EMAILIT_API_KEY)", async () => {
    vi.stubEnv("EMAILIT_API_KEY", "");
    const { sendEmail } = await import("../email");
    const result = await sendEmail({
      to: "test@example.com",
      subject: "Test",
      html: "<p>Hello</p>",
    });
    expect(result).toBe(true);
  });
});

describe("sendNewLeadNotification", () => {
  it("returns true in dry-run mode", async () => {
    vi.stubEnv("EMAILIT_API_KEY", "");
    const { sendNewLeadNotification } = await import("../email");
    const result = await sendNewLeadNotification(
      "provider@example.com",
      "Joe's Plumbing",
      "John Smith",
      "john@example.com",
      "+18145550101",
      "plumbing",
      "I need a leak fixed"
    );
    expect(result).toBe(true);
  });
});

describe("sendWelcomeEmail", () => {
  it("returns true in dry-run mode", async () => {
    vi.stubEnv("EMAILIT_API_KEY", "");
    const { sendWelcomeEmail } = await import("../email");
    const result = await sendWelcomeEmail(
      "provider@example.com",
      "Joe's Plumbing",
      "plumbing",
      5
    );
    expect(result).toBe(true);
  });
});

describe("sendEmailVerification", () => {
  it("returns true in dry-run mode", async () => {
    vi.stubEnv("EMAILIT_API_KEY", "");
    const { sendEmailVerification } = await import("../email");
    const result = await sendEmailVerification(
      "test@example.com",
      "abc123token"
    );
    expect(result).toBe(true);
  });
});

describe("sendSlaWarningEmail", () => {
  it("returns true in dry-run mode", async () => {
    vi.stubEnv("EMAILIT_API_KEY", "");
    const { sendSlaWarningEmail } = await import("../email");
    const result = await sendSlaWarningEmail(
      "provider@example.com",
      "Joe's Plumbing",
      "John Smith",
      10
    );
    expect(result).toBe(true);
  });
});
