import type { NextRequest } from "next/server";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const rateLimitStore = new Map<string, RateLimitEntry>();

export function getRequestIdentity(request: Request | NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  return "unknown";
}

export function getUserAgent(request: Request | NextRequest) {
  return request.headers.get("user-agent")?.toLowerCase() ?? "";
}

export function isLikelyBotRequest(request: Request | NextRequest) {
  const userAgent = getUserAgent(request);
  if (!userAgent) return false;

  return [
    "bot",
    "spider",
    "crawler",
    "crawl",
    "preview",
    "headless",
    "lighthouse",
    "slurp",
    "bingpreview",
    "facebookexternalhit",
    "meta-externalagent",
    "whatsapp",
    "telegrambot",
    "discordbot",
    "linkedinbot",
    "embedly",
    "quora link preview",
    "google-read-aloud",
    "bytespider",
    "chatgpt-user",
    "gptbot",
    "claudebot",
    "ccbot",
  ].some((token) => userAgent.includes(token));
}

export function enforceRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const existing = rateLimitStore.get(key);

  if (!existing || existing.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, retryAfterMs: existing.resetAt - now };
  }

  existing.count += 1;
  rateLimitStore.set(key, existing);
  return { allowed: true, remaining: Math.max(limit - existing.count, 0) };
}

export function isValidEmail(value?: string) {
  if (!value) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isValidPhone(value?: string) {
  if (!value) return false;
  const digits = value.replace(/[^\d+]/g, "");
  return digits.length >= 10 && digits.length <= 16;
}

export function clampText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
