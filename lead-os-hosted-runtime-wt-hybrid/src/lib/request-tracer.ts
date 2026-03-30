export interface RequestTrace {
  requestId: string;
  method: string;
  path: string;
  statusCode: number | null;
  durationMs: number | null;
  tenantId: string | null;
  userId: string | null;
  timestamp: string;
  userAgent: string | null;
}

const traces: RequestTrace[] = [];
const MAX_TRACES = 10000;
const pending = new Map<string, { startTime: number; trace: RequestTrace }>();

export function startTrace(requestId: string, method: string, path: string, userAgent?: string | null): void {
  const trace: RequestTrace = {
    requestId,
    method,
    path,
    statusCode: null,
    durationMs: null,
    tenantId: null,
    userId: null,
    timestamp: new Date().toISOString(),
    userAgent: userAgent ?? null,
  };
  pending.set(requestId, { startTime: Date.now(), trace });
}

export function enrichTrace(requestId: string, tenantId?: string, userId?: string): void {
  const entry = pending.get(requestId);
  if (!entry) return;
  if (tenantId) entry.trace.tenantId = tenantId;
  if (userId) entry.trace.userId = userId;
}

export function endTrace(requestId: string, statusCode: number): RequestTrace | null {
  const entry = pending.get(requestId);
  if (!entry) return null;
  pending.delete(requestId);
  entry.trace.statusCode = statusCode;
  entry.trace.durationMs = Date.now() - entry.startTime;
  traces.push(entry.trace);
  if (traces.length > MAX_TRACES) traces.splice(0, traces.length - MAX_TRACES);
  return entry.trace;
}

export function getRecentTraces(limit = 100): RequestTrace[] {
  return traces.slice(-limit);
}

export function getTracesByTenant(tenantId: string, limit = 100): RequestTrace[] {
  return traces.filter((t) => t.tenantId === tenantId).slice(-limit);
}

export function getTracesByPath(pathPrefix: string, limit = 100): RequestTrace[] {
  return traces.filter((t) => t.path.startsWith(pathPrefix)).slice(-limit);
}

export function getTraceSummary(): {
  totalRequests: number;
  avgDurationMs: number;
  p95DurationMs: number;
  errorRate: number;
  topPaths: Array<{ path: string; count: number; avgMs: number }>;
} {
  if (traces.length === 0) return { totalRequests: 0, avgDurationMs: 0, p95DurationMs: 0, errorRate: 0, topPaths: [] };

  const durations = traces.filter((t) => t.durationMs !== null).map((t) => t.durationMs!).sort((a, b) => a - b);
  const errors = traces.filter((t) => t.statusCode !== null && t.statusCode >= 500).length;
  const pathMap = new Map<string, { count: number; totalMs: number }>();
  for (const t of traces) {
    const key = t.path.replace(/\/[a-f0-9-]{20,}/g, "/:id");
    const entry = pathMap.get(key) ?? { count: 0, totalMs: 0 };
    entry.count++;
    entry.totalMs += t.durationMs ?? 0;
    pathMap.set(key, entry);
  }
  const topPaths = [...pathMap.entries()]
    .map(([path, { count, totalMs }]) => ({ path, count, avgMs: Math.round(totalMs / count) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalRequests: traces.length,
    avgDurationMs: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
    p95DurationMs: durations[Math.floor(durations.length * 0.95)] ?? 0,
    errorRate: Math.round((errors / traces.length) * 10000) / 100,
    topPaths,
  };
}

export function resetTraces(): void {
  traces.length = 0;
  pending.clear();
}
