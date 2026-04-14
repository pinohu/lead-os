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

describe("sendConciergeAssignmentToPro", () => {
  it("returns true in dry-run mode", async () => {
    vi.stubEnv("EMAILIT_API_KEY", "");
    const { sendConciergeAssignmentToPro } = await import("../email");
    const result = await sendConciergeAssignmentToPro(
      "pro@example.com",
      "Joe's Plumbing",
      {
        requesterEmail: "requester@example.com",
        niche: "plumbing",
        city: "erie",
        opsNotes: "Call ASAP — basement flooding",
      }
    );
    expect(result).toBe(true);
  });

  it("handles null ops notes", async () => {
    vi.stubEnv("EMAILIT_API_KEY", "");
    const { sendConciergeAssignmentToPro } = await import("../email");
    const result = await sendConciergeAssignmentToPro(
      "pro@example.com",
      "Joe's Plumbing",
      {
        requesterEmail: "requester@example.com",
        niche: "plumbing",
        city: "erie",
        opsNotes: null,
      }
    );
    expect(result).toBe(true);
  });
});

describe("sendConciergeHandoffToRequester", () => {
  it("returns true in dry-run mode with phone", async () => {
    vi.stubEnv("EMAILIT_API_KEY", "");
    const { sendConciergeHandoffToRequester } = await import("../email");
    const result = await sendConciergeHandoffToRequester(
      "requester@example.com",
      {
        providerName: "Joe's Plumbing",
        providerPhone: "+18145550101",
        niche: "plumbing",
      }
    );
    expect(result).toBe(true);
  });

  it("returns true without phone (phone-optional match)", async () => {
    vi.stubEnv("EMAILIT_API_KEY", "");
    const { sendConciergeHandoffToRequester } = await import("../email");
    const result = await sendConciergeHandoffToRequester(
      "requester@example.com",
      {
        providerName: "Joe's Plumbing",
        providerPhone: null,
        niche: "plumbing",
      }
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
