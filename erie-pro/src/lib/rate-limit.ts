// ── Rate Limiting ─────────────────────────────────────────────────────
// Uses Neon Postgres sliding window via Prisma when DATABASE_URL is set.
// Falls back to in-memory sliding window for dev/testing without a DB.

import { NextRequest, NextResponse } from "next/server";

interface RateLimitConfig {
  /** Max requests allowed in the window */
  limit: number;
  /** Window duration in seconds */
  windowSeconds: number;
}

/** Per-endpoint rate limit presets */
export const RATE_LIMITS = {
  lead: { limit: 5, windowSeconds: 60 } as RateLimitConfig,
  claim: { limit: 3, windowSeconds: 3600 } as RateLimitConfig,
  contact: { limit: 5, windowSeconds: 60 } as RateLimitConfig,
  leadPurchase: { limit: 10, windowSeconds: 60 } as RateLimitConfig,
  "places-photo": { limit: 100, windowSeconds: 60 } as RateLimitConfig,
} as const;

// ── Postgres Rate Limiting (via Prisma) ─────────────────────────────

let cleanupScheduled = false;

async function postgresRateLimit(
  ip: string,
  endpoint: keyof typeof RATE_LIMITS
): Promise<NextResponse | null> {
  const { prisma } = await import("@/lib/db");
  const config = RATE_LIMITS[endpoint];
  const key = `${endpoint}:${ip}`;
  const windowStart = new Date(Date.now() - config.windowSeconds * 1000);

  // Count recent entries within the window
  const count = await prisma.rateLimitEntry.count({
    where: {
      key,
      createdAt: { gt: windowStart },
    },
  });

  if (count >= config.limit) {
    // Find the oldest entry in the window to calculate retry-after
    const oldest = await prisma.rateLimitEntry.findFirst({
      where: { key, createdAt: { gt: windowStart } },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    });

    const retryAfter = oldest
      ? Math.max(1, Math.ceil((oldest.createdAt.getTime() + config.windowSeconds * 1000 - Date.now()) / 1000))
      : config.windowSeconds;

    return NextResponse.json(
      {
        success: false,
        error: "Too many requests. Please try again later.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(config.limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil((Date.now() + retryAfter * 1000) / 1000)),
        },
      }
    );
  }

  // Record this request
  await prisma.rateLimitEntry.create({
    data: { key },
  });

  // Fire-and-forget cleanup of expired entries (max once per cold start)
  if (!cleanupScheduled) {
    cleanupScheduled = true;
    prisma.rateLimitEntry.deleteMany({
      where: {
        createdAt: { lt: new Date(Date.now() - 3600_000) }, // older than 1 hour
      },
    }).catch(() => {/* swallow — cleanup failure shouldn't block requests */});
  }

  return null;
}

// ── In-Memory Sliding Window (fallback) ──────────────────────────────
// Suitable for single-instance dev. Vercel serverless won't share state
// across invocations, but it limits bursts within a single warm instance.

interface WindowEntry {
  timestamps: number[];
}

const windows = new Map<string, WindowEntry>();

// Cleanup stale entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of windows) {
      entry.timestamps = entry.timestamps.filter((t) => now - t < 3600_000);
      if (entry.timestamps.length === 0) windows.delete(key);
    }
  }, 300_000);
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

function inMemoryRateLimit(
  ip: string,
  endpoint: keyof typeof RATE_LIMITS
): NextResponse | null {
  const config = RATE_LIMITS[endpoint];
  const key = `${endpoint}:${ip}`;
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;

  const entry = windows.get(key) ?? { timestamps: [] };

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  if (entry.timestamps.length >= config.limit) {
    const retryAfter = Math.ceil(
      (entry.timestamps[0] + windowMs - now) / 1000
    );
    return NextResponse.json(
      {
        success: false,
        error: "Too many requests. Please try again later.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(config.limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil((entry.timestamps[0] + windowMs) / 1000)),
        },
      }
    );
  }

  // Record this request
  entry.timestamps.push(now);
  windows.set(key, entry);

  return null;
}

/**
 * Check rate limit for a request. Returns null if within limit,
 * or a 429 NextResponse if exceeded.
 *
 * Uses Postgres (via Prisma) when DATABASE_URL is set.
 * Falls back to in-memory for local dev without a database.
 */
export async function checkRateLimit(
  req: NextRequest,
  endpoint: keyof typeof RATE_LIMITS
): Promise<NextResponse | null> {
  const ip = getClientIp(req);

  // ── Postgres path (production + dev with DB) ───────────────────────
  if (process.env.DATABASE_URL) {
    try {
      return await postgresRateLimit(ip, endpoint);
    } catch {
      // If DB is unreachable, fall through to in-memory
    }
  }

  // ── In-memory fallback (dev / testing) ─────────────────────────────
  return inMemoryRateLimit(ip, endpoint);
}
