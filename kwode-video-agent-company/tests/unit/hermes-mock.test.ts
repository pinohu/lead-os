import { describe, it, expect } from "vitest";
import { runHermesMock } from "../../packages/connectors/src/hermes/hermesMockRunner.js";
import { newPacket } from "../../packages/connectors/src/hermes/hermesTaskPacket.js";
import { runVimaxMock } from "../../packages/connectors/src/vimax/vimaxMockRunner.js";

describe("hermes mock runner", () => {
  it("returns a structured brief for generate_brief intent", async () => {
    const packet = newPacket({
      agentId: "creative-brief-agent",
      agentDefinition: {
        name: "Creative Brief Agent",
        mission: "test",
        promptTemplate: "",
        toolsAllowed: [],
        toolsDisallowed: [],
      },
      context: { clientName: "Erie HVAC" },
      task: { intent: "generate_brief", inputs: { goal: "Drive HVAC tune-ups" } },
      guardrails: { forbidden: [], consentRequired: false, publicPublishing: false },
      correlationId: "test-1",
    });
    const result = await runHermesMock(packet);
    expect(result.status).toBe("completed");
    expect(result.output.objective).toBeTruthy();
    expect(result.output.audience).toBeTruthy();
    expect(result.output.cta).toBeTruthy();
  });

  it("returns scenes for generate_storyboard", async () => {
    const packet = newPacket({
      agentId: "storyboard-director-agent",
      agentDefinition: { name: "Storyboard", mission: "", promptTemplate: "", toolsAllowed: [], toolsDisallowed: [] },
      context: {},
      task: { intent: "generate_storyboard", inputs: {} },
      guardrails: { forbidden: [], consentRequired: false, publicPublishing: false },
      correlationId: "test-2",
    });
    const result = await runHermesMock(packet);
    expect(Array.isArray(result.output.scenes)).toBe(true);
    const scenes = result.output.scenes as Array<{ order: number; durationSec: number; description: string }>;
    expect(scenes.length).toBeGreaterThan(0);
    expect(scenes[0]).toHaveProperty("order");
  });

  it("falls back gracefully for unknown intents", async () => {
    const packet = newPacket({
      agentId: "x",
      agentDefinition: { name: "x", mission: "", promptTemplate: "", toolsAllowed: [], toolsDisallowed: [] },
      context: {},
      task: { intent: "unknown_intent", inputs: { foo: 1 } },
      guardrails: { forbidden: [], consentRequired: false, publicPublishing: false },
      correlationId: "test-3",
    });
    const result = await runHermesMock(packet);
    expect(result.status).toBe("completed");
    expect(result.output.echo).toBeTruthy();
  });
});

describe("vimax mock runner", () => {
  it("returns a mocked manifest with one asset per prompt", async () => {
    const result = await runVimaxMock({
      packetVersion: "kwode/vimax/1",
      jobId: "job-1",
      title: "Test",
      brand: { name: "Brand" },
      brief: { objective: "o", audience: "a" },
      constraints: { durationSec: 30, aspectRatio: "9:16" },
      script: { format: "shot-list", language: "en-US", body: "..." },
      scenes: [],
      prompts: [
        { sceneOrder: 1, kind: "image", body: "test" },
        { sceneOrder: 2, kind: "video", body: "test" },
        { sceneOrder: 3, kind: "voice", body: "test" },
      ],
      consistency: { keyVisualEntities: [], lockedColors: [], lockedFonts: [], referenceAssets: [] },
      meta: { createdAt: "now", correlationId: "c" },
    });
    expect(result.status).toBe("mocked");
    expect(result.assets.length).toBe(3);
    expect(result.assets[0].uri).toContain("vimax://planned");
  });
});
