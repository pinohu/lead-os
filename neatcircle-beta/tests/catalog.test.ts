import test from "node:test";
import assert from "node:assert/strict";
import { clientPresets } from "../src/lib/client-presets.ts";
import { nicheManifests } from "../src/lib/niche-config.ts";
import { tenantPresets } from "../src/lib/tenant-presets.ts";

test("client presets expose enabled service sets", () => {
  assert.ok(Object.keys(clientPresets).length >= 3);
  assert.ok(clientPresets.neatcircle.enabledServices.includes("client-portal"));
  assert.ok(clientPresets["professional-services"].featuredCoreServices.length > 0);
});

test("niche manifests cover core and blue-ocean entries", () => {
  assert.equal(nicheManifests["client-portal"].category, "core");
  assert.equal(nicheManifests.franchise.category, "blue-ocean");
  assert.equal(nicheManifests.general.category, "general");
});

test("tenant presets define bias and blueprint mappings", () => {
  assert.ok(tenantPresets.length >= 3);

  for (const preset of tenantPresets) {
    assert.ok(preset.brandName.length > 0);
    assert.ok(preset.intakeBias.length > 0);
    assert.ok(preset.bestFitFunnels.length > 0);
  }
});
