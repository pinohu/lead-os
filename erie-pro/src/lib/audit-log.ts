// ── Audit Logging ─────────────────────────────────────────────────────
// Immutable append-only log for security-relevant events.
// Never UPDATE or DELETE audit log entries.

import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export type AuditAction =
  | "territory.claimed"
  | "territory.released"
  | "territory.paused"
  | "territory.resumed"
  | "territory.reactivated"
  | "provider.created"
  | "provider.login"
  | "provider.logout"
  | "provider.email_verified"
  | "provider.ownership_verified"
  | "provider.admin_approved"
  | "provider.claim_rejected"
  | "subscription.activated"
  | "subscription.cancelled"
  | "subscription.payment_failed"
  | "subscription.renewed"
  | "subscription.status_changed"
  | "subscription.grace_period_expired"
  | "lead.submitted"
  | "lead.routed"
  | "lead.purchased"
  | "lead.disputed"
  | "lead.dispute_resolved"
  | "lead.archived"
  | "admin.login"
  | "admin.action";

export type AuditEntityType =
  | "provider"
  | "lead"
  | "territory"
  | "subscription"
  | "checkout"
  | "dispute"
  | "api_key"
  | "webhook";

interface AuditEntry {
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string;
  providerId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

/**
 * Record an audit log entry. Fire-and-forget — never blocks the caller.
 * Failures are logged but don't propagate.
 */
export async function audit(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId ?? null,
        providerId: entry.providerId ?? null,
        metadata: entry.metadata ? JSON.parse(JSON.stringify(entry.metadata)) : undefined,
        ipAddress: entry.ipAddress ?? null,
      },
    });
  } catch (err) {
    // Never let audit logging break the app — use console directly to avoid circular deps
    if (process.env.NODE_ENV === "development") {
      logger.error("audit-log", "Failed to write audit entry:", err);
    }
  }
}

/**
 * Query audit logs (admin use only).
 */
export async function getAuditLogs(options?: {
  providerId?: string;
  action?: AuditAction;
  entityType?: AuditEntityType;
  limit?: number;
  offset?: number;
}) {
  const { providerId, action, entityType, limit = 50, offset = 0 } = options ?? {};

  return prisma.auditLog.findMany({
    where: {
      ...(providerId ? { providerId } : {}),
      ...(action ? { action } : {}),
      ...(entityType ? { entityType } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });
}
