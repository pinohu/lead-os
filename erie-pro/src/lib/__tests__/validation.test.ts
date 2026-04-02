import { describe, it, expect } from "vitest";
import {
  ClaimRequestSchema,
  LeadRequestSchema,
  ContactRequestSchema,
  LeadPurchaseRequestSchema,
  normalizePhone,
  sanitizeText,
  formatZodErrors,
  MAX_BODY_SIZE,
} from "../validation";

// ── normalizePhone ──────────────────────────────────────────────────

describe("normalizePhone", () => {
  it("normalizes (814) 555-0101 to +18145550101", () => {
    expect(normalizePhone("(814) 555-0101")).toBe("+18145550101");
  });

  it("normalizes 814-555-0101 to +18145550101", () => {
    expect(normalizePhone("814-555-0101")).toBe("+18145550101");
  });

  it("normalizes 8145550101 to +18145550101", () => {
    expect(normalizePhone("8145550101")).toBe("+18145550101");
  });

  it("normalizes +1 (814) 555-0101 to +18145550101", () => {
    expect(normalizePhone("+1 (814) 555-0101")).toBe("+18145550101");
  });

  it("normalizes 18145550101 to +18145550101", () => {
    expect(normalizePhone("18145550101")).toBe("+18145550101");
  });

  it("prepends +1 for short numbers (E.164 best-effort)", () => {
    expect(normalizePhone("555")).toBe("+1555");
  });
});

// ── sanitizeText ────────────────────────────────────────────────────

describe("sanitizeText", () => {
  it("strips HTML tags", () => {
    expect(sanitizeText("<script>alert('xss')</script>Hello")).toBe("alert('xss')Hello");
  });

  it("strips nested tags", () => {
    expect(sanitizeText("<b><i>bold italic</i></b>")).toBe("bold italic");
  });

  it("preserves plain text", () => {
    expect(sanitizeText("Hello, world!")).toBe("Hello, world!");
  });

  it("strips tags but keeps content", () => {
    expect(sanitizeText("I need <strong>plumbing</strong> help")).toBe("I need plumbing help");
  });
});

// ── formatZodErrors ─────────────────────────────────────────────────

describe("formatZodErrors", () => {
  it("formats a single field error", () => {
    const result = LeadRequestSchema.safeParse({ niche: "plumbing" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const formatted = formatZodErrors(result.error);
      expect(formatted).toContain("email");
    }
  });
});

// ── MAX_BODY_SIZE ───────────────────────────────────────────────────

describe("MAX_BODY_SIZE", () => {
  it("is 10KB", () => {
    expect(MAX_BODY_SIZE).toBe(10 * 1024);
  });
});

// ── ClaimRequestSchema ──────────────────────────────────────────────

describe("ClaimRequestSchema", () => {
  const validClaim = {
    niche: "plumbing",
    providerName: "Joe's Plumbing",
    providerEmail: "JOE@example.com",
    phone: "(814) 555-0101",
    password: "SecurePass123!",
  };

  it("accepts valid claim data", () => {
    const result = ClaimRequestSchema.safeParse(validClaim);
    expect(result.success).toBe(true);
  });

  it("lowercases email", () => {
    const result = ClaimRequestSchema.safeParse(validClaim);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.providerEmail).toBe("joe@example.com");
    }
  });

  it("normalizes phone to E.164", () => {
    const result = ClaimRequestSchema.safeParse(validClaim);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phone).toBe("+18145550101");
    }
  });

  it("defaults tier to standard", () => {
    const result = ClaimRequestSchema.safeParse(validClaim);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tier).toBe("standard");
    }
  });

  it("rejects missing niche", () => {
    const result = ClaimRequestSchema.safeParse({ ...validClaim, niche: undefined });
    expect(result.success).toBe(false);
  });

  it("rejects missing email", () => {
    const result = ClaimRequestSchema.safeParse({ ...validClaim, providerEmail: undefined });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = ClaimRequestSchema.safeParse({ ...validClaim, providerEmail: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects short phone", () => {
    const result = ClaimRequestSchema.safeParse({ ...validClaim, phone: "555" });
    expect(result.success).toBe(false);
  });

  it("sanitizes description HTML", () => {
    const result = ClaimRequestSchema.safeParse({
      ...validClaim,
      description: "<script>alert('xss')</script>We do plumbing",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).not.toContain("<script>");
      expect(result.data.description).toContain("We do plumbing");
    }
  });

  it("accepts optional fields", () => {
    const result = ClaimRequestSchema.safeParse({
      ...validClaim,
      tier: "premium",
      description: "A great plumber",
      license: "PA-12345",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tier).toBe("premium");
      expect(result.data.license).toBe("PA-12345");
    }
  });
});

// ── LeadRequestSchema ───────────────────────────────────────────────

describe("LeadRequestSchema", () => {
  const validLead = {
    email: "CONSUMER@example.com",
    niche: "hvac",
    tcpaConsent: true,
    tcpaConsentText: "I consent to be contacted.",
  };

  it("accepts valid lead", () => {
    const result = LeadRequestSchema.safeParse(validLead);
    expect(result.success).toBe(true);
  });

  it("lowercases email", () => {
    const result = LeadRequestSchema.safeParse(validLead);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("consumer@example.com");
    }
  });

  it("defaults city to erie", () => {
    const result = LeadRequestSchema.safeParse(validLead);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.city).toBe("erie");
    }
  });

  it("rejects without tcpaConsent", () => {
    const result = LeadRequestSchema.safeParse({ ...validLead, tcpaConsent: false });
    expect(result.success).toBe(false);
  });

  it("rejects missing tcpaConsent", () => {
    const { tcpaConsent: _, ...noConsent } = validLead;
    const result = LeadRequestSchema.safeParse(noConsent);
    expect(result.success).toBe(false);
  });

  it("rejects missing email", () => {
    const result = LeadRequestSchema.safeParse({ ...validLead, email: undefined });
    expect(result.success).toBe(false);
  });

  it("rejects missing niche", () => {
    const result = LeadRequestSchema.safeParse({ ...validLead, niche: undefined });
    expect(result.success).toBe(false);
  });

  it("accepts optional phone and normalizes it", () => {
    const result = LeadRequestSchema.safeParse({ ...validLead, phone: "814-555-9999" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phone).toBe("+18145559999");
    }
  });
});

// ── ContactRequestSchema ────────────────────────────────────────────

describe("ContactRequestSchema", () => {
  it("accepts valid contact", () => {
    const result = ContactRequestSchema.safeParse({
      email: "test@example.com",
      message: "Hello",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing email", () => {
    const result = ContactRequestSchema.safeParse({ message: "Hello" });
    expect(result.success).toBe(false);
  });

  it("lowercases email", () => {
    const result = ContactRequestSchema.safeParse({
      email: "TEST@EXAMPLE.COM",
      message: "Hello",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("test@example.com");
    }
  });

  it("sanitizes message HTML", () => {
    const result = ContactRequestSchema.safeParse({
      email: "test@example.com",
      message: "<img onerror=alert(1)>Hello",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.message).not.toContain("<img");
    }
  });
});

// ── LeadPurchaseRequestSchema ───────────────────────────────────────

describe("LeadPurchaseRequestSchema", () => {
  const validPurchase = {
    niche: "roofing",
    buyerEmail: "buyer@example.com",
  };

  it("accepts valid purchase", () => {
    const result = LeadPurchaseRequestSchema.safeParse(validPurchase);
    expect(result.success).toBe(true);
  });

  it("defaults temperature to warm", () => {
    const result = LeadPurchaseRequestSchema.safeParse(validPurchase);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.temperature).toBe("warm");
    }
  });

  it("accepts valid temperature override", () => {
    const result = LeadPurchaseRequestSchema.safeParse({ ...validPurchase, temperature: "hot" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.temperature).toBe("hot");
    }
  });

  it("rejects invalid temperature", () => {
    const result = LeadPurchaseRequestSchema.safeParse({ ...validPurchase, temperature: "nuclear" });
    expect(result.success).toBe(false);
  });

  it("rejects missing niche", () => {
    const result = LeadPurchaseRequestSchema.safeParse({ buyerEmail: "a@b.com" });
    expect(result.success).toBe(false);
  });
});
