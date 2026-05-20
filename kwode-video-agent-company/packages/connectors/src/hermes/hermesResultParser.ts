import type { HermesTaskPacket } from "./hermesTaskPacket.js";

export interface HermesResult {
  packetVersion: "kwode/hermes/1";
  correlationId: string;
  agentId: string;
  status: "completed" | "failed" | "blocked" | "needs_human";
  output: Record<string, unknown>;
  notes?: string;
  cost?: {
    tokens?: number;
    usd?: number;
    ms?: number;
  };
  blockReason?: string;
  rawOutput?: string;
}

export function parseHermesResult(raw: string, packet: HermesTaskPacket): HermesResult {
  // First try strict JSON. If the Hermes binary later emits a richer format
  // (NDJSON / event stream), extend this parser instead of inlining the logic.
  try {
    const parsed = JSON.parse(raw);
    if (parsed && parsed.packetVersion === "kwode/hermes/1") {
      return parsed as HermesResult;
    }
    return {
      packetVersion: "kwode/hermes/1",
      correlationId: packet.meta.correlationId,
      agentId: packet.agentId,
      status: "completed",
      output: parsed ?? {},
      rawOutput: raw,
    };
  } catch {
    return {
      packetVersion: "kwode/hermes/1",
      correlationId: packet.meta.correlationId,
      agentId: packet.agentId,
      status: "completed",
      output: { text: raw },
      rawOutput: raw,
    };
  }
}
