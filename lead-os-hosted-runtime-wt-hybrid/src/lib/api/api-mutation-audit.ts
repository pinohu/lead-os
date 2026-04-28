// src/lib/api/api-mutation-audit.ts
// Persisted audit for API mutations (uses operator_audit_log; best-effort).

import { logOperatorAudit } from "../operator-audit.ts";
import { tenantConfig } from "../tenant.ts";

const API_ACTOR = "api-mutation@internal";

export interface ApiMutationAuditInput {
  route: string;
  method: string;
  actorHint?: string;
  tenantId?: string;
  outcome: "success" | "failure";
  detail?: Record<string, unknown>;
}

export async function logApiMutationAudit(input: ApiMutationAuditInput): Promise<void> {
  const tenantId = input.tenantId ?? tenantConfig.tenantId;
  await logOperatorAudit({
    actorEmail: input.actorHint ?? API_ACTOR,
    tenantId,
    action: `api.${input.method}.${input.outcome}`,
    resourceType: "http_route",
    resourceId: input.route,
    detail: {
      route: input.route,
      method: input.method,
      outcome: input.outcome,
      ...(input.detail ?? {}),
    },
  });
}
