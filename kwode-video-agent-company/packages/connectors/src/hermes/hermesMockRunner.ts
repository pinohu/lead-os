import { HermesTaskPacket } from "./hermesTaskPacket.js";
import { HermesResult } from "./hermesResultParser.js";

/**
 * Deterministic, off-line stand-in for a real Hermes agent.
 *
 * For each known agent intent we emit a structured payload that downstream
 * code can use without an LLM round-trip. This lets the full agent chain
 * run end-to-end inside CI and inside Docker with no network access.
 */
export async function runHermesMock(packet: HermesTaskPacket): Promise<HermesResult> {
  const { agentId, task, context } = packet;
  const intent = task.intent;

  const base = {
    packetVersion: "kwode/hermes/1" as const,
    correlationId: packet.meta.correlationId,
    agentId,
    status: "completed" as const,
    cost: { tokens: 0, usd: 0, ms: 12 },
  };

  switch (intent) {
    case "generate_brief":
      return {
        ...base,
        output: {
          objective:
            (task.inputs.goal as string) ?? `Drive qualified leads for ${context.clientName ?? "client"}.`,
          audience: (task.inputs.audience as string) ?? "Local homeowners needing fast, trustworthy service.",
          hook: "Open with the cost of inaction: a small problem becoming a big one.",
          cta: (task.inputs.cta as string) ?? "Call us today for a same-day estimate.",
          toneOfVoice: "warm, confident, neighborly",
          trustSignals: [
            "Locally owned and operated",
            "Licensed & insured",
            "Hundreds of 5-star reviews",
          ],
          constraints: {
            durationSec: task.inputs.durationSec ?? 45,
            aspectRatio: task.inputs.aspectRatio ?? "9:16",
            forbidden: (packet.guardrails.forbidden ?? []) as string[],
          },
        },
      };

    case "generate_script":
      return {
        ...base,
        output: {
          format: "shot-list",
          language: "en-US",
          body: [
            "[HOOK 0-3s] On-screen: ‘Don’t wait until it’s an emergency.’ VO: \"Small leaks, big bills.\"",
            "[PROBLEM 3-10s] B-roll of a dripping pipe. VO: \"Most homeowners notice the warning signs — and ignore them.\"",
            "[SOLUTION 10-25s] Show technician arriving on time. VO: \"Our licensed pros diagnose, quote, and fix in one visit.\"",
            "[PROOF 25-35s] Three review screenshots. VO: \"Trusted by hundreds of Erie neighbors.\"",
            "[CTA 35-45s] Phone number on-screen. VO: \"Call today — same-day appointments available.\"",
          ].join("\n"),
          wordCount: 62,
        },
      };

    case "generate_storyboard":
      return {
        ...base,
        output: {
          scenes: [
            { order: 1, durationSec: 3, description: "Hook card with bold text overlay" },
            { order: 2, durationSec: 7, description: "Dripping pipe close-up with subtle ambient SFX" },
            { order: 3, durationSec: 15, description: "Technician arrival + diagnostic shot sequence" },
            { order: 4, durationSec: 10, description: "Three customer review screenshots with lower-thirds" },
            { order: 5, durationSec: 10, description: "End card with phone number + call-to-action" },
          ],
        },
      };

    case "generate_prompts":
      return {
        ...base,
        output: {
          prompts: [
            { sceneOrder: 1, kind: "image", toolHint: "comfyui", body: "Bold text title card, brand colors, urgent mood" },
            { sceneOrder: 2, kind: "video", toolHint: "vimax", body: "Close-up of a dripping copper pipe, soft natural light, 4k" },
            { sceneOrder: 3, kind: "video", toolHint: "vimax", body: "Friendly uniformed technician greeting homeowner on porch" },
            { sceneOrder: 4, kind: "image", toolHint: "comfyui", body: "Three stylized review cards on light background" },
            { sceneOrder: 5, kind: "image", toolHint: "comfyui", body: "End card with phone (814) 200-0328 prominent" },
          ],
        },
      };

    case "qa_review":
      return {
        ...base,
        output: {
          passed: true,
          checks: {
            visual_quality: { passed: true, notes: "Mock pass" },
            business_accuracy: { passed: true, notes: "Mock pass" },
            brand_consistency: { passed: true, notes: "Mock pass" },
            caption_accuracy: { passed: true, notes: "Mock pass" },
            rights_and_consent: { passed: true, notes: "No likeness used in this mock" },
            claims_and_compliance: { passed: true, notes: "No medical/legal/financial claims" },
            platform_readiness: { passed: true, notes: "Mock pass" },
            conversion_strength: { passed: true, notes: "Hook + CTA present" },
            client_readiness: { passed: true, notes: "Mock pass" },
          },
          blockingIssues: [],
          notes: "Mock QA — replace with real reviewer agent for production traffic.",
        },
      };

    case "delivery_plan":
      return {
        ...base,
        output: {
          channels: ["client_portal"],
          publishing: [],
          notes: "Default delivery routes to the client portal only; publishing is gated.",
        },
      };

    default:
      return {
        ...base,
        status: "completed",
        output: {
          echo: task.inputs,
          note: `Mock Hermes runner has no handler for intent "${intent}"; returned inputs verbatim.`,
        },
      };
  }
}
