/**
 * A Hermes task packet — the payload format we hand to a Hermes agent.
 * Designed to be runtime-agnostic so the same packet can be served to a
 * local LLM, a Claude/OpenAI call, or a future Hermes binary.
 */
export interface HermesTaskPacket {
  packetVersion: "kwode/hermes/1";
  agentId: string;
  agentDefinition: {
    name: string;
    mission: string;
    promptTemplate: string;
    toolsAllowed: string[];
    toolsDisallowed: string[];
  };
  context: {
    jobId?: string;
    tenantSlug?: string;
    clientName?: string;
    brandSummary?: string;
    videoTypeId?: string;
    priorArtifacts?: Record<string, unknown>;
  };
  task: {
    intent: string;
    inputs: Record<string, unknown>;
    outputSchema?: Record<string, unknown>;
  };
  guardrails: {
    forbidden: string[];
    consentRequired: boolean;
    publicPublishing: boolean;
  };
  meta: {
    createdAt: string;
    correlationId: string;
  };
}

export function newPacket(
  partial: Omit<HermesTaskPacket, "packetVersion" | "meta"> & { correlationId: string }
): HermesTaskPacket {
  return {
    packetVersion: "kwode/hermes/1",
    ...partial,
    meta: {
      createdAt: new Date().toISOString(),
      correlationId: partial.correlationId,
    },
  };
}
