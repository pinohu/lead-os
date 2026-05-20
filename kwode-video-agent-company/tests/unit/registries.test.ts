import { describe, it, expect } from "vitest";
import { loadAgentDefinitions } from "../../packages/agents/src/loader.js";
import { loadMasterVideoTypes, loadNicheOverrides, getVideoTypesForNiche } from "../../packages/video-catalog/src/loader.js";
import { getToolRegistry } from "../../packages/tool-registry/src/loader.js";
import { PRICING_PLANS } from "../../packages/billing/src/plans.js";

describe("registry loaders", () => {
  it("loads 50 agents with required fields", () => {
    const defs = loadAgentDefinitions();
    expect(defs.length).toBeGreaterThanOrEqual(50);
    const ids = new Set(defs.map((a) => a.agent_id));
    expect(ids.size).toBe(defs.length); // unique
    for (const a of defs) {
      expect(a.agent_id).toBeTruthy();
      expect(a.name).toBeTruthy();
      expect(a.department).toBeTruthy();
      expect(a.mission).toBeTruthy();
      expect(Array.isArray(a.responsibilities)).toBe(true);
      expect(Array.isArray(a.tools_allowed)).toBe(true);
      expect(Array.isArray(a.tools_disallowed)).toBe(true);
    }
  });

  it("loads >=50 master video types", () => {
    const types = loadMasterVideoTypes();
    expect(types.length).toBeGreaterThanOrEqual(50);
    for (const t of types) {
      expect(t.video_type_id).toBeTruthy();
      expect(t.title).toBeTruthy();
      expect(Array.isArray(t.required_inputs)).toBe(true);
      expect(Array.isArray(t.agent_chain)).toBe(true);
    }
  });

  it("loads niche overrides", () => {
    const o = loadNicheOverrides();
    expect(Object.keys(o).length).toBeGreaterThanOrEqual(15);
    const plumbing = getVideoTypesForNiche("plumbing");
    expect(plumbing.length).toBeGreaterThan(0);
  });

  it("loads tool registry with required fields", () => {
    const tools = getToolRegistry();
    expect(tools.length).toBeGreaterThanOrEqual(30);
    for (const t of tools) {
      expect(t.tool_id).toBeTruthy();
      expect(t.name).toBeTruthy();
      expect(t.category).toBeTruthy();
    }
  });

  it("exposes 4 example pricing plans", () => {
    expect(PRICING_PLANS.length).toBeGreaterThanOrEqual(4);
    const ids = PRICING_PLANS.map((p) => p.id);
    expect(ids).toContain("starter-video-pack");
    expect(ids).toContain("monthly-visibility-pack");
    expect(ids).toContain("premium-lead-growth-pack");
    expect(ids).toContain("erie-pro-directory-elite-bundle");
  });
});
