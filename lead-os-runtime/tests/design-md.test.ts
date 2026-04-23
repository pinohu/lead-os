import test from "node:test";
import assert from "node:assert/strict";
import {
  generateDesignMd,
  exportDesignMdForAgent,
  parseExternalDesignMd,
  mergeDesignSystems,
  getDesignForTenant,
} from "../src/lib/design-md.ts";
import { createTenant } from "../src/lib/tenant-store.ts";
import type { DesignMarkdown } from "../src/lib/design-md.ts";

let testTenantId: string;
let _testCounter = 0;

test.beforeEach(async () => {
  const tenant = await createTenant({
    slug: `test-brand-${++_testCounter}-${Date.now()}`,
    brandName: "Test Brand",
    siteUrl: "https://test.example.com",
    supportEmail: "support@test.example.com",
    defaultService: "consulting",
    defaultNiche: "general",
    widgetOrigins: ["https://test.example.com"],
    accent: "#14b8a6",
    enabledFunnels: ["standard"],
    channels: { email: true, whatsapp: false, sms: false, chat: false, voice: false },
    revenueModel: "managed",
    plan: "growth",
    status: "active",
    operatorEmails: ["admin@test.example.com"],
    providerConfig: {},
    metadata: {},
  });
  testTenantId = tenant.tenantId;
});

// ---------------------------------------------------------------------------
// generateDesignMd
// ---------------------------------------------------------------------------

test("generateDesignMd produces valid markdown with all sections", async () => {
  const md = await generateDesignMd(testTenantId);

  assert.ok(md.includes("# Design System: Test Brand"));
  assert.ok(md.includes("## Brand"));
  assert.ok(md.includes("## Colors"));
  assert.ok(md.includes("## Typography"));
  assert.ok(md.includes("## Spacing"));
  assert.ok(md.includes("## Components"));
  assert.ok(md.includes("## Layout"));
  assert.ok(md.includes("## Voice & Tone"));

  assert.ok(md.includes("| primary |"));
  assert.ok(md.includes("#14b8a6"));
  assert.ok(md.includes("Inter"));
  assert.ok(md.includes("Base unit:"));
  assert.ok(md.includes("### Button"));
  assert.ok(md.includes("### Card"));
  assert.ok(md.includes("### Input"));
  assert.ok(md.includes("### Badge"));
});

test("generateDesignMd includes tenant brand name", async () => {
  const md = await generateDesignMd(testTenantId);
  assert.ok(md.includes("Test Brand"));
});

test("generateDesignMd throws for nonexistent tenant", async () => {
  await assert.rejects(
    () => generateDesignMd("nonexistent-tenant-id"),
    { message: /Tenant not found/ },
  );
});

// ---------------------------------------------------------------------------
// parseExternalDesignMd
// ---------------------------------------------------------------------------

test("parseExternalDesignMd extracts colors from markdown", () => {
  const markdown = `# Design System: External Brand

## Brand
- Name: External Brand
- Description: An external design system

## Colors
| Token | Value | Usage |
|-------|-------|-------|
| primary | #ff6600 | Main color |
| secondary | #0066ff | Second color |
| accent | #ff00ff | Highlight |
| background | #000000 | Background |
| surface | #111111 | Surface |
| text | #ffffff | Text |
| textMuted | #888888 | Muted text |
| success | #00ff00 | Success |
| warning | #ffff00 | Warning |
| error | #ff0000 | Error |
`;

  const parsed = parseExternalDesignMd(markdown);

  assert.ok(parsed.colors);
  assert.equal(parsed.colors?.primary, "#ff6600");
  assert.equal(parsed.colors?.secondary, "#0066ff");
  assert.equal(parsed.colors?.accent, "#ff00ff");
  assert.equal(parsed.colors?.error, "#ff0000");
});

test("parseExternalDesignMd extracts brand name and description", () => {
  const markdown = `# Design System: My Brand

## Brand
- Name: My Brand
- Description: A cool brand
`;

  const parsed = parseExternalDesignMd(markdown);
  assert.equal(parsed.brandName, "My Brand");
  assert.equal(parsed.brandDescription, "A cool brand");
});

test("parseExternalDesignMd extracts typography", () => {
  const markdown = `## Typography
- Font Family: Roboto, Arial, sans-serif
- Heading Font: Roboto
- Mono Font: Fira Code, monospace
- Scale: h1=3rem, h2=2.5rem, h3=2rem, h4=1.5rem, body=1rem, small=0.875rem, caption=0.75rem
- Weights: normal=400, medium=500, semibold=600, bold=700
- Line Heights: tight=1.2, normal=1.5, relaxed=1.8
`;

  const parsed = parseExternalDesignMd(markdown);
  assert.ok(parsed.typography);
  assert.equal(parsed.typography?.fontFamily, "Roboto, Arial, sans-serif");
  assert.equal(parsed.typography?.scale.h1, "3rem");
  assert.equal(parsed.typography?.weights.bold, 700);
});

test("parseExternalDesignMd extracts voice and tone", () => {
  const markdown = `## Voice & Tone
- Tone: Casual and friendly
- Personality: Fun, Bold, Creative
- Do:
  - Use humor
  - Be concise
- Don't:
  - Be boring
  - Write too much
`;

  const parsed = parseExternalDesignMd(markdown);
  assert.ok(parsed.voice);
  assert.equal(parsed.voice?.tone, "Casual and friendly");
  assert.deepEqual(parsed.voice?.personality, ["Fun", "Bold", "Creative"]);
  assert.deepEqual(parsed.voice?.doList, ["Use humor", "Be concise"]);
  assert.deepEqual(parsed.voice?.dontList, ["Be boring", "Write too much"]);
});

test("parseExternalDesignMd returns empty partial for empty input", () => {
  const parsed = parseExternalDesignMd("");
  assert.deepEqual(Object.keys(parsed), []);
});

// ---------------------------------------------------------------------------
// mergeDesignSystems
// ---------------------------------------------------------------------------

test("mergeDesignSystems overrides colors while keeping structure", async () => {
  const tenant = await createTenant({
    slug: "merge-test",
    brandName: "Merge Brand",
    siteUrl: "https://merge.example.com",
    supportEmail: "merge@example.com",
    defaultService: "consulting",
    defaultNiche: "general",
    widgetOrigins: [],
    accent: "#14b8a6",
    enabledFunnels: [],
    channels: { email: true, whatsapp: false, sms: false, chat: false, voice: false },
    revenueModel: "managed",
    plan: "starter",
    status: "active",
    operatorEmails: [],
    providerConfig: {},
    metadata: {},
  });

  const base = getDesignForTenant(tenant);

  const override: Partial<DesignMarkdown> = {
    colors: {
      primary: "#ff0000",
      secondary: "#00ff00",
      accent: "#0000ff",
      background: "#111111",
      surface: "#222222",
      text: "#ffffff",
      textMuted: "#aaaaaa",
      success: "#00ff00",
      warning: "#ffff00",
      error: "#ff0000",
    },
  };

  const merged = mergeDesignSystems(base, override);

  assert.equal(merged.colors.primary, "#ff0000");
  assert.equal(merged.colors.secondary, "#00ff00");
  assert.equal(merged.colors.accent, "#0000ff");

  assert.equal(merged.brandName, "Merge Brand");
  assert.equal(merged.typography.fontFamily, base.typography.fontFamily);
  assert.deepEqual(merged.components, base.components);
  assert.deepEqual(merged.layout, base.layout);
  assert.deepEqual(merged.voice, base.voice);
  assert.deepEqual(merged.spacing, base.spacing);
});

test("mergeDesignSystems overrides typography while keeping colors", async () => {
  const tenant = await createTenant({
    slug: "typo-test",
    brandName: "Typo Brand",
    siteUrl: "https://typo.example.com",
    supportEmail: "typo@example.com",
    defaultService: "consulting",
    defaultNiche: "general",
    widgetOrigins: [],
    accent: "#14b8a6",
    enabledFunnels: [],
    channels: { email: true, whatsapp: false, sms: false, chat: false, voice: false },
    revenueModel: "managed",
    plan: "starter",
    status: "active",
    operatorEmails: [],
    providerConfig: {},
    metadata: {},
  });

  const base = getDesignForTenant(tenant);

  const override: Partial<DesignMarkdown> = {
    typography: {
      fontFamily: "Roboto, sans-serif",
      headingFont: "Roboto",
      monoFont: "Fira Code",
      scale: { h1: "3rem", h2: "2.5rem", h3: "2rem", h4: "1.5rem", body: "1rem", small: "0.875rem", caption: "0.75rem" },
      weights: { normal: 400, medium: 500, semibold: 600, bold: 800 },
      lineHeights: { tight: "1.2", normal: "1.5", relaxed: "1.8" },
    },
  };

  const merged = mergeDesignSystems(base, override);

  assert.equal(merged.typography.fontFamily, "Roboto, sans-serif");
  assert.equal(merged.typography.weights.bold, 800);
  assert.equal(merged.colors.primary, base.colors.primary);
});

test("mergeDesignSystems with empty override returns base unchanged", async () => {
  const tenant = await createTenant({
    slug: "empty-test",
    brandName: "Empty Brand",
    siteUrl: "https://empty.example.com",
    supportEmail: "empty@example.com",
    defaultService: "consulting",
    defaultNiche: "general",
    widgetOrigins: [],
    accent: "#14b8a6",
    enabledFunnels: [],
    channels: { email: true, whatsapp: false, sms: false, chat: false, voice: false },
    revenueModel: "managed",
    plan: "starter",
    status: "active",
    operatorEmails: [],
    providerConfig: {},
    metadata: {},
  });

  const base = getDesignForTenant(tenant);
  const merged = mergeDesignSystems(base, {});

  assert.deepEqual(merged, base);
});

// ---------------------------------------------------------------------------
// exportDesignMdForAgent
// ---------------------------------------------------------------------------

test("exportDesignMdForAgent includes CSS custom properties", async () => {
  const agentMd = await exportDesignMdForAgent(testTenantId);

  assert.ok(agentMd.includes("## CSS Custom Properties"));
  assert.ok(agentMd.includes(":root {"));
  assert.ok(agentMd.includes("--color-primary:"));
  assert.ok(agentMd.includes("--font-family:"));
  assert.ok(agentMd.includes("--spacing-"));
  assert.ok(agentMd.includes("--button-radius:"));
  assert.ok(agentMd.includes("--card-radius:"));
});

test("exportDesignMdForAgent includes Tailwind config", async () => {
  const agentMd = await exportDesignMdForAgent(testTenantId);

  assert.ok(agentMd.includes("## Tailwind Configuration"));
  assert.ok(agentMd.includes("tailwind.config.ts"));
  assert.ok(agentMd.includes('"theme"'));
  assert.ok(agentMd.includes('"extend"'));
  assert.ok(agentMd.includes('"colors"'));
});

test("exportDesignMdForAgent also includes the standard design.md sections", async () => {
  const agentMd = await exportDesignMdForAgent(testTenantId);

  assert.ok(agentMd.includes("# Design System: Test Brand"));
  assert.ok(agentMd.includes("## Colors"));
  assert.ok(agentMd.includes("## Typography"));
});
