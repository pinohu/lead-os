import { afterEach, describe, expect, it } from "vitest";
import { decryptWebhookSecret, encryptWebhookSecret } from "@/lib/webhook-secret";

const ORIGINAL_KEY = process.env.WEBHOOK_SECRET_ENCRYPTION_KEY;

afterEach(() => {
  if (ORIGINAL_KEY === undefined) {
    delete process.env.WEBHOOK_SECRET_ENCRYPTION_KEY;
  } else {
    process.env.WEBHOOK_SECRET_ENCRYPTION_KEY = ORIGINAL_KEY;
  }
});

describe("webhook secret encryption", () => {
  it("encrypts and decrypts webhook secrets without storing plaintext", () => {
    process.env.WEBHOOK_SECRET_ENCRYPTION_KEY = "test-key-material-for-webhook-secret-encryption";

    const stored = encryptWebhookSecret("webhook-secret-value");

    expect(stored).toMatch(/^enc:v1:/);
    expect(stored).not.toContain("webhook-secret-value");
    expect(decryptWebhookSecret(stored)).toBe("webhook-secret-value");
  });

  it("keeps legacy plaintext secrets readable for migration/backfill", () => {
    expect(decryptWebhookSecret("legacy-plaintext-secret")).toBe("legacy-plaintext-secret");
  });

  it("requires encryption key for new encrypted secrets", () => {
    delete process.env.WEBHOOK_SECRET_ENCRYPTION_KEY;

    expect(() => encryptWebhookSecret("webhook-secret-value")).toThrow(
      /WEBHOOK_SECRET_ENCRYPTION_KEY is required/,
    );
  });
});
