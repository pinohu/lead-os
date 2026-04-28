import crypto from "crypto";

const ENCRYPTED_SECRET_PREFIX = "enc:v1";

function getWebhookSecretKey() {
  const rawKey = process.env.WEBHOOK_SECRET_ENCRYPTION_KEY?.trim();
  if (!rawKey) {
    throw new Error("WEBHOOK_SECRET_ENCRYPTION_KEY is required for webhook secret encryption");
  }
  return crypto.createHash("sha256").update(rawKey).digest();
}

export function encryptWebhookSecret(secret: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getWebhookSecretKey(), iv);
  const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [
    ENCRYPTED_SECRET_PREFIX,
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(":");
}

export function decryptWebhookSecret(storedSecret: string) {
  if (!storedSecret.startsWith(`${ENCRYPTED_SECRET_PREFIX}:`)) {
    return storedSecret;
  }

  const [prefix, version, ivValue, tagValue, encryptedValue] = storedSecret.split(":");
  if (`${prefix}:${version}` !== ENCRYPTED_SECRET_PREFIX) {
    throw new Error("Invalid encrypted webhook secret prefix");
  }
  if (!ivValue || !tagValue || !encryptedValue) {
    throw new Error("Invalid encrypted webhook secret format");
  }

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    getWebhookSecretKey(),
    Buffer.from(ivValue, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
