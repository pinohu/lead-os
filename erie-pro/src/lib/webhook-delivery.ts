// ── Outbound Webhook Delivery ─────────────────────────────────────────
// Delivers events (lead.created, lead.routed, etc.) to provider-registered
// webhook endpoints with HMAC signatures and exponential backoff retry.

import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { decryptWebhookSecret } from "@/lib/webhook-secret";
import crypto from "crypto";
import { lookup } from "dns/promises";
import net from "net";

/** Maximum retry attempts per delivery */
const MAX_RETRIES = 3;

/** Base delay in ms for exponential backoff (1s, 2s, 4s) */
const BASE_DELAY_MS = 1000;

export interface WebhookUrlValidationResult {
  valid: boolean;
  error?: string;
}

function isPrivateIPv4(address: string): boolean {
  const parts = address.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return true;
  }

  const [a, b, c] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0 && (c === 0 || c === 2)) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113) ||
    a >= 224
  );
}

function isPrivateIPv6(address: string): boolean {
  const normalized = address.toLowerCase();
  const mappedV4 = normalized.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mappedV4) return isPrivateIPv4(mappedV4[1]);

  return (
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe8") ||
    normalized.startsWith("fe9") ||
    normalized.startsWith("fea") ||
    normalized.startsWith("feb") ||
    normalized.startsWith("ff") ||
    normalized.startsWith("2001:db8") ||
    normalized.startsWith("100:")
  );
}

function isPublicIpAddress(address: string): boolean {
  const family = net.isIP(address);
  if (family === 4) return !isPrivateIPv4(address);
  if (family === 6) return !isPrivateIPv6(address);
  return false;
}

function isBlockedHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/\.$/, "");
  return (
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    normalized.endsWith(".local") ||
    normalized === "metadata.google.internal"
  );
}

/**
 * Validate an outbound webhook URL against common SSRF targets.
 * We validate both literal IPs and DNS answers because hostnames can resolve
 * to private infrastructure even when the URL itself looks harmless.
 */
export async function validateWebhookUrl(rawUrl: string): Promise<WebhookUrlValidationResult> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { valid: false, error: "Webhook URL is invalid" };
  }

  if (parsed.protocol !== "https:") {
    return { valid: false, error: "Webhook URL must use HTTPS" };
  }

  if (parsed.username || parsed.password) {
    return { valid: false, error: "Webhook URL must not include credentials" };
  }

  if (isBlockedHostname(parsed.hostname)) {
    return { valid: false, error: "Webhook URL host is not allowed" };
  }

  const literalIpFamily = net.isIP(parsed.hostname);
  if (literalIpFamily) {
    return isPublicIpAddress(parsed.hostname)
      ? { valid: true }
      : { valid: false, error: "Webhook URL must resolve to a public IP address" };
  }

  let addresses: { address: string }[];
  try {
    addresses = await lookup(parsed.hostname, { all: true, verbatim: true });
  } catch {
    return { valid: false, error: "Webhook URL hostname could not be resolved" };
  }

  if (addresses.length === 0) {
    return { valid: false, error: "Webhook URL hostname did not resolve" };
  }

  if (addresses.some((entry) => !isPublicIpAddress(entry.address))) {
    return { valid: false, error: "Webhook URL must resolve only to public IP addresses" };
  }

  return { valid: true };
}

/**
 * Sign a payload with HMAC-SHA256 using the endpoint's secret.
 */
function signPayload(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Deliver a webhook event to all matching endpoints for a provider.
 * Retries failed deliveries with exponential backoff (3 attempts).
 */
export async function deliverWebhookEvent(
  providerId: string,
  event: string,
  payload: Record<string, unknown>
): Promise<void> {
  try {
    // Find active webhook endpoints for this provider matching the event
    const endpoints = await prisma.webhookEndpoint.findMany({
      where: {
        providerId,
        isActive: true,
        events: { has: event },
      },
    });

    if (endpoints.length === 0) return;

    const body = JSON.stringify({
      event,
      timestamp: new Date().toISOString(),
      data: payload,
    });

    // Deliver to each endpoint in parallel
    await Promise.allSettled(
      endpoints.map((ep) => deliverToEndpoint(ep.id, ep.url, decryptWebhookSecret(ep.secret), body))
    );
  } catch (err) {
    logger.error("webhook-delivery", "Failed to deliver webhook event:", err);
  }
}

/**
 * Deliver payload to a single endpoint with retry logic.
 */
async function deliverToEndpoint(
  endpointId: string,
  url: string,
  secret: string,
  body: string
): Promise<void> {
  const validation = await validateWebhookUrl(url);
  if (!validation.valid) {
    logger.warn("webhook-delivery", `Blocked webhook endpoint ${url}: ${validation.error}`);
    await incrementFailCount(endpointId);
    return;
  }

  const signature = signPayload(body, secret);
  const parsedBody = JSON.parse(body) as { event: string; timestamp: string };

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    try {
      const controller = new AbortController();
      timeout = setTimeout(() => controller.abort(), 10_000); // 10s timeout

      const res = await fetch(url, {
        method: "POST",
        redirect: "manual",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Signature": signature,
          "X-Webhook-Event": parsedBody.event,
          "X-Webhook-Timestamp": parsedBody.timestamp,
          "User-Agent": "EriePro-Webhooks/1.0",
        },
        body,
        signal: controller.signal,
      });

      if (timeout) clearTimeout(timeout);

      if (res.ok) {
        // Success — reset fail count
        await prisma.webhookEndpoint
          .update({
            where: { id: endpointId },
            data: { failCount: 0 },
          })
          .catch(() => {});

        logger.info("webhook-delivery", `Delivered to ${url} (attempt ${attempt + 1})`);
        return;
      }

      // Non-retryable HTTP errors (4xx except 429)
      if (res.status >= 400 && res.status < 500 && res.status !== 429) {
        logger.warn(
          "webhook-delivery",
          `Non-retryable error ${res.status} from ${url}`
        );
        await incrementFailCount(endpointId);
        return;
      }

      // Retryable error — continue to next attempt
      logger.warn(
        "webhook-delivery",
        `Attempt ${attempt + 1} failed (${res.status}) for ${url}`
      );
    } catch (err) {
      if (timeout) clearTimeout(timeout);
      logger.warn(
        "webhook-delivery",
        `Attempt ${attempt + 1} error for ${url}:`,
        err
      );
    }

    // Exponential backoff before retry
    if (attempt < MAX_RETRIES - 1) {
      await sleep(BASE_DELAY_MS * Math.pow(2, attempt));
    }
  }

  // All retries exhausted
  logger.error("webhook-delivery", `All ${MAX_RETRIES} attempts failed for ${url}`);
  await incrementFailCount(endpointId);
}

/**
 * Increment the fail count and auto-disable after 10 consecutive failures.
 */
async function incrementFailCount(endpointId: string): Promise<void> {
  try {
    const endpoint = await prisma.webhookEndpoint.update({
      where: { id: endpointId },
      data: { failCount: { increment: 1 } },
    });

    if (endpoint.failCount >= 10) {
      await prisma.webhookEndpoint.update({
        where: { id: endpointId },
        data: { isActive: false },
      });
      logger.warn(
        "webhook-delivery",
        `Disabled endpoint ${endpointId} after ${endpoint.failCount} consecutive failures`
      );
    }
  } catch (err) {
    logger.error("webhook-delivery", "Failed to update fail count:", err);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Send a test event to a specific webhook endpoint.
 */
export async function sendTestWebhook(
  endpointId: string
): Promise<{ success: boolean; status?: number; error?: string }> {
  try {
    const endpoint = await prisma.webhookEndpoint.findUnique({
      where: { id: endpointId },
    });
    if (!endpoint) return { success: false, error: "Endpoint not found" };

    const validation = await validateWebhookUrl(endpoint.url);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const timestamp = new Date().toISOString();
    const body = JSON.stringify({
      event: "test",
      timestamp,
      data: { message: "This is a test webhook from Erie Pro" },
    });

    const signature = signPayload(body, decryptWebhookSecret(endpoint.secret));

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    let res: Response;
    try {
      res = await fetch(endpoint.url, {
        method: "POST",
        redirect: "manual",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Signature": signature,
          "X-Webhook-Event": "test",
          "X-Webhook-Timestamp": timestamp,
          "User-Agent": "EriePro-Webhooks/1.0",
        },
        body,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    return { success: res.ok, status: res.status };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}
