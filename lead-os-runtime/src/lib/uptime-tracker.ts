interface UptimeCheck {
  component: string;
  status: "healthy" | "degraded" | "down";
  latencyMs: number;
  checkedAt: string;
}

const checks: UptimeCheck[] = [];
const MAX_CHECKS = 10000;

export function recordCheck(component: string, status: UptimeCheck["status"], latencyMs: number): void {
  checks.push({ component, status, latencyMs, checkedAt: new Date().toISOString() });
  if (checks.length > MAX_CHECKS) checks.splice(0, checks.length - MAX_CHECKS);
}

export function getUptimePercentage(component: string, windowMs: number): number {
  const cutoff = Date.now() - windowMs;
  const relevant = checks.filter((c) => c.component === component && new Date(c.checkedAt).getTime() >= cutoff);
  if (relevant.length === 0) return 100;
  const healthy = relevant.filter((c) => c.status === "healthy").length;
  return Math.round((healthy / relevant.length) * 10000) / 100;
}

export function getRecentChecks(component: string, limit = 50): UptimeCheck[] {
  return checks.filter((c) => c.component === component).slice(-limit);
}

export function getAllComponents(): string[] {
  return [...new Set(checks.map((c) => c.component))];
}
