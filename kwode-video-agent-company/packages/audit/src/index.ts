import { prisma } from "../../schemas/src/db.js";

export interface AuditEvent {
  actor: string;       // "user:<email>" | "agent:<id>" | "system" | "tool:<id>"
  action: string;      // dot-separated event id, e.g. "job.created", "agent.run.completed"
  target?: string;     // entity id
  jobId?: string;
  payload?: Record<string, unknown>;
}

export async function audit(ev: AuditEvent): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actor: ev.actor,
        action: ev.action,
        target: ev.target ?? null,
        jobId: ev.jobId ?? null,
        payload: (ev.payload ?? {}) as object,
      },
    });
  } catch (err) {
    // Audit must never break the caller — log and swallow.
    // (In production, ship to a dead-letter sink.)
    // eslint-disable-next-line no-console
    console.error("[audit] failed to write log", err, ev);
  }
}
