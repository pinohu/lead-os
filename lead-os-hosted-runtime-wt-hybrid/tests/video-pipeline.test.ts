import test from "node:test";
import assert from "node:assert/strict";
import {
  generateVideoSpec,
  generateRemotionCode,
  generateProductDemoScript,
  generateDataReportScript,
  generateLaunchVideoScript,
  VIDEO_TEMPLATES,
} from "../src/lib/video-pipeline.ts";
import { createTenant, resetTenantStore } from "../src/lib/tenant-store.ts";

let testTenantId: string;

test.beforeEach(async () => {
  resetTenantStore();
  const tenant = await createTenant({
    slug: "video-test",
    brandName: "Video Brand",
    siteUrl: "https://video.example.com",
    supportEmail: "video@example.com",
    defaultService: "consulting",
    defaultNiche: "general",
    widgetOrigins: [],
    accent: "#14b8a6",
    enabledFunnels: ["standard"],
    channels: { email: true },
    revenueModel: "managed",
    plan: "growth",
    status: "active",
    operatorEmails: ["admin@video.example.com"],
    providerConfig: {},
    metadata: {},
  });
  testTenantId = tenant.tenantId;
});

// ---------------------------------------------------------------------------
// generateVideoSpec
// ---------------------------------------------------------------------------

test("generateVideoSpec creates spec with correct scene count for product-demo", async () => {
  const spec = await generateVideoSpec({
    type: "product-demo",
    tenantId: testTenantId,
    features: ["Feature A", "Feature B", "Feature C"],
    ctaUrl: "https://example.com",
  });

  assert.equal(spec.type, "product-demo");
  assert.equal(spec.tenantId, testTenantId);
  assert.equal(spec.width, 1920);
  assert.equal(spec.height, 1080);
  assert.equal(spec.fps, 30);
  assert.ok(spec.brand.name === "Video Brand");
  assert.ok(spec.brand.primaryColor === "#14b8a6");

  // title + transition + (feature + transition) * 3 + cta = 1 + 1 + 6 + 1 = 9
  assert.equal(spec.scenes.length, 9);

  const featureScenes = spec.scenes.filter((s) => s.type === "feature");
  assert.equal(featureScenes.length, 3);

  const ctaScenes = spec.scenes.filter((s) => s.type === "cta");
  assert.equal(ctaScenes.length, 1);
});

test("generateVideoSpec creates data-report with stat and chart scenes", async () => {
  const spec = await generateVideoSpec({
    type: "data-report",
    tenantId: testTenantId,
    metrics: { "New Leads": 150, "Conversions": 30, "Revenue": 5000 },
  });

  assert.equal(spec.type, "data-report");

  const statScenes = spec.scenes.filter((s) => s.type === "stat");
  assert.equal(statScenes.length, 3);

  const chartScenes = spec.scenes.filter((s) => s.type === "data-chart");
  assert.equal(chartScenes.length, 1);
});

test("generateVideoSpec creates testimonial video with testimonial scenes", async () => {
  const spec = await generateVideoSpec({
    type: "testimonial",
    tenantId: testTenantId,
    testimonials: [
      { name: "Alice", quote: "Great product!" },
      { name: "Bob", quote: "Highly recommend." },
    ],
  });

  const testimonialScenes = spec.scenes.filter((s) => s.type === "testimonial");
  assert.equal(testimonialScenes.length, 2);
});

test("generateVideoSpec calculates total duration correctly", async () => {
  const spec = await generateVideoSpec({
    type: "product-demo",
    tenantId: testTenantId,
    features: ["A"],
    ctaUrl: "https://example.com",
  });

  const expectedDuration = spec.scenes.reduce((sum, s) => sum + s.duration, 0);
  assert.equal(spec.duration, expectedDuration);
});

test("generateVideoSpec throws for nonexistent tenant", async () => {
  await assert.rejects(
    () => generateVideoSpec({ type: "product-demo", tenantId: "nonexistent" }),
    { message: /Tenant not found/ },
  );
});

// ---------------------------------------------------------------------------
// generateRemotionCode
// ---------------------------------------------------------------------------

test("generateRemotionCode produces valid JSX string", async () => {
  const spec = await generateVideoSpec({
    type: "product-demo",
    tenantId: testTenantId,
    features: ["Feature A"],
  });

  const code = generateRemotionCode(spec);

  assert.ok(typeof code === "string");
  assert.ok(code.length > 0);
  assert.ok(code.includes("AbsoluteFill"));
  assert.ok(code.includes("Sequence"));
  assert.ok(code.includes("useCurrentFrame"));
});

test("generateRemotionCode contains Remotion imports", async () => {
  const spec = await generateVideoSpec({
    type: "data-report",
    tenantId: testTenantId,
    metrics: { "Leads": 100 },
  });

  const code = generateRemotionCode(spec);

  assert.ok(code.startsWith('import { AbsoluteFill, Sequence, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";'));
});

test("generateRemotionCode includes Sequence with from and durationInFrames", async () => {
  const spec = await generateVideoSpec({
    type: "product-demo",
    tenantId: testTenantId,
    features: ["Test Feature"],
  });

  const code = generateRemotionCode(spec);

  assert.ok(code.includes("from={"));
  assert.ok(code.includes("durationInFrames={"));
});

test("generateRemotionCode includes scene-specific components", async () => {
  const spec = await generateVideoSpec({
    type: "data-report",
    tenantId: testTenantId,
    metrics: { "Leads": 100 },
  });

  const code = generateRemotionCode(spec);

  assert.ok(code.includes("TitleScene_"));
  assert.ok(code.includes("StatScene_"));
  assert.ok(code.includes("DataChartScene_"));
});

test("generateRemotionCode uses interpolate and spring for animations", async () => {
  const spec = await generateVideoSpec({
    type: "product-demo",
    tenantId: testTenantId,
    features: ["Animated Feature"],
  });

  const code = generateRemotionCode(spec);

  assert.ok(code.includes("interpolate("));
  assert.ok(code.includes("spring("));
});

// ---------------------------------------------------------------------------
// Shortcut generators
// ---------------------------------------------------------------------------

test("product demo includes feature scenes", async () => {
  const result = await generateProductDemoScript(testTenantId, ["Auth", "Dashboard", "API"]);

  assert.ok(result.spec.scenes.some((s) => s.type === "feature"));
  assert.ok(result.remotionCode.includes("FeatureScene_"));
  assert.ok(result.compositionId.startsWith("product-demo-"));
  assert.ok(result.estimatedRenderTime > 0);
});

test("data report includes stat scenes", async () => {
  const result = await generateDataReportScript(testTenantId, {
    "Leads": 250,
    "Revenue": 10000,
  });

  assert.ok(result.spec.scenes.some((s) => s.type === "stat"));
  assert.ok(result.remotionCode.includes("StatScene_"));
  assert.ok(result.compositionId.startsWith("data-report-"));
});

test("launch video includes CTA scene and feature scenes", async () => {
  const result = await generateLaunchVideoScript(testTenantId, ["Feature X"], "https://launch.example.com");

  const hasFeature = result.spec.scenes.some((s) => s.type === "feature");
  const hasCta = result.spec.scenes.some((s) => s.type === "cta");

  assert.ok(hasFeature);
  assert.ok(hasCta);
  assert.ok(result.remotionCode.includes("CTAScene_"));
  assert.ok(result.compositionId.startsWith("launch-video-"));
});

// ---------------------------------------------------------------------------
// VIDEO_TEMPLATES
// ---------------------------------------------------------------------------

test("VIDEO_TEMPLATES includes all video types", () => {
  const types = VIDEO_TEMPLATES.map((t) => t.type);

  assert.ok(types.includes("product-demo"));
  assert.ok(types.includes("data-report"));
  assert.ok(types.includes("launch-video"));
  assert.ok(types.includes("testimonial"));
  assert.ok(types.includes("feature-highlight"));
  assert.ok(types.includes("weekly-recap"));
  assert.equal(types.length, 6);
});
