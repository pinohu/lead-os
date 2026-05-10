import { describe, expect, it } from "vitest";
import {
  convertBoxServiceMap,
  convertBoxServiceSlugs,
  getConvertBoxService,
} from "@/lib/convertbox-service-map";
import { niches } from "@/lib/niches";

describe("convertBoxServiceMap", () => {
  it("covers every Erie.Pro service niche", () => {
    const nicheSlugs = niches.map((niche) => niche.slug).sort();
    const convertBoxSlugs = [...convertBoxServiceSlugs].sort();

    expect(convertBoxSlugs).toEqual(nicheSlugs);
    expect(convertBoxSlugs).toHaveLength(112);
  });

  it("maps each service to an audited inactive ConvertBox draft", () => {
    for (const slug of convertBoxServiceSlugs) {
      const entry = getConvertBoxService(slug);

      expect(entry?.serviceSlug).toBe(slug);
      expect(entry?.boxId).toBeGreaterThan(232603);
      expect(entry?.active).toBe(false);
      expect(entry?.stepCount).toBeGreaterThanOrEqual(4);
      expect(entry?.targetCount).toBeGreaterThanOrEqual(5);
    }
  });

  it("has URL targeting for core, emergency, pricing, and directory page intent", () => {
    for (const entry of Object.values(convertBoxServiceMap)) {
      expect(entry.includeTargets).toContain(`/${entry.serviceSlug}`);
      expect(entry.includeTargets).toContain(`/${entry.serviceSlug}/emergency`);
      expect(entry.includeTargets).toContain(`/${entry.serviceSlug}/pricing`);
      expect(entry.includeTargets).toContain(`/${entry.serviceSlug}/directory`);
    }
  });
});
