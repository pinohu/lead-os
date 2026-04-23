// src/lib/operator-audit.ts
// Persisted audit trail for operator mutations.

import { queryPostgres } from "@/lib/db";

export interface OperatorAuditInput {
  actorEmail: string;
  tenantId: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  detail?: Record<string, unknown>;
}

export async function logOperatorAudit(input: OperatorAuditInput): Promise<void> {
  try {
    await queryPostgres(
      `INSERT INTO operator_audit_log (actor_email, tenant_id, action, resource_type, resource_id, detail)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
      [
        input.actorEmail,
        input.tenantId,
        input.action,
        input.resourceType ?? null,
        input.resourceId ?? null,
        JSON.stringify(input.detail ?? {}),
      ],
    );
  } catch (err) {
    console.error(
      JSON.stringify({
        scope: "operator_audit",
        level: "error",
        step: "insert_failed",
        actorEmail: input.actorEmail,
        tenantId: input.tenantId,
        action: input.action,
        message: err instanceof Error ? err.message : String(err),
      }),
    )
  }
}
