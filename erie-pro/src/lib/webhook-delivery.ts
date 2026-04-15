// ── Outbound Webhook Delivery ─────────────────────────────────────────
// Delivers events (lead.created, lead.routed, etc.) to provider-registered
// webhook endpoints with HMAC signatures and exponential backoff retry.

import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { checkFetchableUrl } from "@/lib/url-safety";
import crypto from "crypto";

/** Maximum retry attempts per delivery */
const MAX_RETRIES = 3;

/** Base delay in ms for exponential backoff (1s, 2s, 4s) */
const BASE_DELAY_MS = 1000;

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
      endpoints.map((ep) => deliverToEndpoint(ep.id, ep.url, ep.secret, body))
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
  // Defense-in-depth: re-check URL safety at delivery time in case a row
  // was created through a path that bypassed API-level validation (admin
  // tooling, seed script, migration). If the URL is unsafe, disable the
  // endpoint and skip — never pivot to internal infra.
  const safety = checkFetchableUrl(url);
  if (!safety.ok) {
    logger.warn(
      "webhook-delivery",
      `Refusing to deliver to unsafe URL (${safety.reason}): ${url}`
    );
    await prisma.webhookEndpoint
      .update({
        where: { id: endpointId },
        data: { isActive: false },
      })
      .catch(() => {});
    return;
  }

  const signature = signPayload(body, secret);

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000); // 10s timeout

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Signature": signature,
          "X-Webhook-Event": JSON.parse(body).event,
          "X-Webhook-Timestamp": JSON.parse(body).timestamp,
          "User-Agent": "EriePro-Webhooks/1.0",
        },
        body,
        signal: controller.signal,
      });

      clearTimeout(timeout);

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

    const safety = checkFetchableUrl(endpoint.url);
    if (!safety.ok) {
      return {
        success: false,
        error: `Webhook URL is not allowed (${safety.reason})`,
      };
    }

    const body = JSON.stringify({
      event: "test",
      timestamp: new Date().toISOString(),
      data: { message: "This is a test webhook from Erie Pro" },
    });

    const signature = signPayload(body, endpoint.secret);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    const res = await fetch(endpoint.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
        "X-Webhook-Event": "test",
        "X-Webhook-Timestamp": new Date().toISOString(),
        "User-Agent": "EriePro-Webhooks/1.0",
      },
      body,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    return { success: res.ok, status: res.status };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}
