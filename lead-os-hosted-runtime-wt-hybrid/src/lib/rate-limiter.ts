interface WindowEntry {
  timestamps: number[];
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function createRateLimiter(options: { windowMs: number; maxRequests: number }): {
  check(key: string): RateLimitResult;
  reset(key: string): void;
} {
  const store = new Map<string, WindowEntry>();
  const { windowMs, maxRequests } = options;

  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);
      if (entry.timestamps.length === 0) {
        store.delete(key);
      }
    }
  }, 60_000);

  if (typeof cleanupInterval === "object" && "unref" in cleanupInterval) {
    cleanupInterval.unref();
  }

  function check(key: string): RateLimitResult {
    const now = Date.now();
    let entry = store.get(key);

    if (!entry) {
      entry = { timestamps: [] };
      store.set(key, entry);
    }

    entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

    if (entry.timestamps.length >= maxRequests) {
      const oldestInWindow = entry.timestamps[0];
      return {
        allowed: false,
        remaining: 0,
        resetAt: oldestInWindow + windowMs,
      };
    }

    entry.timestamps.push(now);
    return {
      allowed: true,
      remaining: maxRequests - entry.timestamps.length,
      resetAt: now + windowMs,
    };
  }

  function reset(key: string): void {
    store.delete(key);
  }

  return { check, reset };
}

// ── Tenant-aware rate limiting ───────────────────────────────

export function createTenantRateLimiter(tenantId: string, limits: { requestsPerMinute?: number; requestsPerHour?: number } = {}) {
  const perMinute = limits.requestsPerMinute ?? 60;
  const perHour = limits.requestsPerHour ?? 1000;
  const minuteLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: perMinute });
  const hourLimiter = createRateLimiter({ windowMs: 3_600_000, maxRequests: perHour });
  return {
    check(endpoint: string) {
      const minuteKey = `${tenantId}:${endpoint}:min`;
      const hourKey = `${tenantId}:${endpoint}:hr`;
      const minuteResult = minuteLimiter.check(minuteKey);
      if (!minuteResult.allowed) return { allowed: false, reason: "per-minute limit exceeded", remaining: minuteResult.remaining, resetAt: minuteResult.resetAt };
      const hourResult = hourLimiter.check(hourKey);
      if (!hourResult.allowed) return { allowed: false, reason: "per-hour limit exceeded", remaining: hourResult.remaining, resetAt: hourResult.resetAt };
      return { allowed: true, remaining: Math.min(minuteResult.remaining, hourResult.remaining), resetAt: minuteResult.resetAt };
    },
  };
}

const ENDPOINT_LIMITS: Record<string, { windowMs: number; maxRequests: number }> = {
  "/api/intake": { windowMs: 60_000, maxRequests: 30 },
  "/api/auth/login": { windowMs: 60_000, maxRequests: 10 },
  "/api/auth/request-link": { windowMs: 60_000, maxRequests: 5 },
  "/api/auth/2fa/verify": { windowMs: 60_000, maxRequests: 5 },
  "/api/auth/2fa/setup": { windowMs: 60_000, maxRequests: 3 },
  "/api/billing/checkout": { windowMs: 60_000, maxRequests: 10 },
  "/api/ai/generate": { windowMs: 60_000, maxRequests: 20 },
};

const endpointLimiters = new Map<string, ReturnType<typeof createRateLimiter>>();

export function checkEndpointLimit(endpoint: string, key: string): { allowed: boolean; remaining: number; resetAt: number } {
  const config = ENDPOINT_LIMITS[endpoint];
  if (!config) return { allowed: true, remaining: 999, resetAt: Date.now() + 60_000 };
  let limiter = endpointLimiters.get(endpoint);
  if (!limiter) {
    limiter = createRateLimiter(config);
    endpointLimiters.set(endpoint, limiter);
  }
  return limiter.check(key);
}
