// src/lib/audit.ts
export function logAudit(event: string, data?: Record<string, unknown>) {
  console.log(JSON.stringify({
    audit: true,
    event,
    ts: new Date().toISOString(),
    ...data,
  }));
}
