import { describe, it, expect } from "vitest";
import { QA_CATEGORIES, defaultQAChecks } from "../../packages/qa/src/checks.js";

describe("QA categories", () => {
  it("exposes 9 categories", () => {
    expect(QA_CATEGORIES.length).toBe(9);
    expect(QA_CATEGORIES).toContain("rights_and_consent");
    expect(QA_CATEGORIES).toContain("claims_and_compliance");
  });

  it("defaultQAChecks returns a fail-shaped object for every category", () => {
    const c = defaultQAChecks();
    for (const cat of QA_CATEGORIES) {
      expect(c[cat]).toBeDefined();
      expect(c[cat].passed).toBe(false);
    }
  });
});
