import { getTenant } from "./tenant-store.ts";
import type { TenantRecord } from "./tenant-store.ts";

export interface DesignMarkdown {
  brandName: string;
  brandDescription: string;

  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
    success: string;
    warning: string;
    error: string;
  };

  typography: {
    fontFamily: string;
    headingFont: string;
    monoFont: string;
    scale: { h1: string; h2: string; h3: string; h4: string; body: string; small: string; caption: string };
    weights: { normal: number; medium: number; semibold: number; bold: number };
    lineHeights: { tight: string; normal: string; relaxed: string };
  };

  spacing: {
    unit: number;
    scale: Record<string, string>;
  };

  components: {
    button: { borderRadius: string; padding: string; fontSize: string; variants: string[] };
    card: { borderRadius: string; shadow: string; padding: string };
    input: { borderRadius: string; border: string; padding: string; fontSize: string };
    badge: { borderRadius: string; padding: string; fontSize: string };
  };

  layout: {
    maxWidth: string;
    containerPadding: string;
    gridColumns: number;
    gridGap: string;
    breakpoints: Record<string, string>;
  };

  voice: {
    tone: string;
    personality: string[];
    doList: string[];
    dontList: string[];
  };
}

const COLOR_USAGE: Record<string, string> = {
  primary: "Primary actions, links, key UI elements",
  secondary: "Secondary actions, supporting elements",
  accent: "Highlights, hover states, badges",
  background: "Page background",
  surface: "Card and panel backgrounds",
  text: "Primary text color",
  textMuted: "Secondary text, captions, placeholders",
  success: "Success states, positive indicators",
  warning: "Warning states, attention indicators",
  error: "Error states, destructive actions",
};

function buildDefaultDesign(tenant: TenantRecord): DesignMarkdown {
  const accent = tenant.accent || "#14b8a6";

  return {
    brandName: tenant.brandName,
    brandDescription: `${tenant.brandName} — lead generation and conversion platform powered by Lead OS.`,

    colors: {
      primary: accent,
      secondary: "#6366f1",
      accent,
      background: "#0a0f1a",
      surface: "#111827",
      text: "#f9fafb",
      textMuted: "#9ca3af",
      success: "#22c55e",
      warning: "#f59e0b",
      error: "#ef4444",
    },

    typography: {
      fontFamily: "Inter, system-ui, sans-serif",
      headingFont: "Inter",
      monoFont: "JetBrains Mono, monospace",
      scale: {
        h1: "2.5rem",
        h2: "2rem",
        h3: "1.5rem",
        h4: "1.25rem",
        body: "1rem",
        small: "0.875rem",
        caption: "0.75rem",
      },
      weights: { normal: 400, medium: 500, semibold: 600, bold: 700 },
      lineHeights: { tight: "1.25", normal: "1.5", relaxed: "1.75" },
    },

    spacing: {
      unit: 4,
      scale: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        "2xl": "48px",
        "3xl": "64px",
      },
    },

    components: {
      button: {
        borderRadius: "8px",
        padding: "10px 20px",
        fontSize: "0.875rem",
        variants: ["primary", "secondary", "ghost", "destructive"],
      },
      card: {
        borderRadius: "12px",
        shadow: "0 1px 3px rgba(0, 0, 0, 0.3)",
        padding: "24px",
      },
      input: {
        borderRadius: "8px",
        border: "1px solid #374151",
        padding: "10px 14px",
        fontSize: "0.875rem",
      },
      badge: {
        borderRadius: "9999px",
        padding: "2px 10px",
        fontSize: "0.75rem",
      },
    },

    layout: {
      maxWidth: "1180px",
      containerPadding: "24px",
      gridColumns: 12,
      gridGap: "24px",
      breakpoints: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
      },
    },

    voice: {
      tone: "Professional but approachable",
      personality: ["Confident", "Data-driven", "Empathetic", "Action-oriented"],
      doList: [
        "Use active voice",
        "Lead with benefits, not features",
        "Include specific numbers and outcomes",
        "Address the reader directly",
        "Keep sentences concise",
      ],
      dontList: [
        "Use jargon without explanation",
        "Be pushy or aggressive",
        "Make unsubstantiated claims",
        "Use passive voice in CTAs",
        "Write walls of text",
      ],
    },
  };
}

function renderDesignMdMarkdown(design: DesignMarkdown): string {
  const lines: string[] = [];

  lines.push(`# Design System: ${design.brandName}`);
  lines.push("");

  lines.push("## Brand");
  lines.push(`- Name: ${design.brandName}`);
  lines.push(`- Description: ${design.brandDescription}`);
  lines.push("");

  lines.push("## Colors");
  lines.push("| Token | Value | Usage |");
  lines.push("|-------|-------|-------|");
  for (const [token, value] of Object.entries(design.colors)) {
    const usage = COLOR_USAGE[token] ?? "";
    lines.push(`| ${token} | ${value} | ${usage} |`);
  }
  lines.push("");

  lines.push("## Typography");
  lines.push(`- Font Family: ${design.typography.fontFamily}`);
  lines.push(`- Heading Font: ${design.typography.headingFont}`);
  lines.push(`- Mono Font: ${design.typography.monoFont}`);
  const scaleEntries = Object.entries(design.typography.scale).map(([k, v]) => `${k}=${v}`).join(", ");
  lines.push(`- Scale: ${scaleEntries}`);
  const weightEntries = Object.entries(design.typography.weights).map(([k, v]) => `${k}=${v}`).join(", ");
  lines.push(`- Weights: ${weightEntries}`);
  const lhEntries = Object.entries(design.typography.lineHeights).map(([k, v]) => `${k}=${v}`).join(", ");
  lines.push(`- Line Heights: ${lhEntries}`);
  lines.push("");

  lines.push("## Spacing");
  lines.push(`- Base unit: ${design.spacing.unit}px`);
  const spacingEntries = Object.entries(design.spacing.scale).map(([k, v]) => `${k}=${v}`).join(", ");
  lines.push(`- Scale: ${spacingEntries}`);
  lines.push("");

  lines.push("## Components");
  lines.push("");
  lines.push("### Button");
  lines.push(`- Border radius: ${design.components.button.borderRadius}`);
  lines.push(`- Padding: ${design.components.button.padding}`);
  lines.push(`- Font size: ${design.components.button.fontSize}`);
  lines.push(`- Variants: ${design.components.button.variants.join(", ")}`);
  lines.push("");
  lines.push("### Card");
  lines.push(`- Border radius: ${design.components.card.borderRadius}`);
  lines.push(`- Shadow: ${design.components.card.shadow}`);
  lines.push(`- Padding: ${design.components.card.padding}`);
  lines.push("");
  lines.push("### Input");
  lines.push(`- Border radius: ${design.components.input.borderRadius}`);
  lines.push(`- Border: ${design.components.input.border}`);
  lines.push(`- Padding: ${design.components.input.padding}`);
  lines.push(`- Font size: ${design.components.input.fontSize}`);
  lines.push("");
  lines.push("### Badge");
  lines.push(`- Border radius: ${design.components.badge.borderRadius}`);
  lines.push(`- Padding: ${design.components.badge.padding}`);
  lines.push(`- Font size: ${design.components.badge.fontSize}`);
  lines.push("");

  lines.push("## Layout");
  lines.push(`- Max width: ${design.layout.maxWidth}`);
  lines.push(`- Container padding: ${design.layout.containerPadding}`);
  lines.push(`- Grid columns: ${design.layout.gridColumns}`);
  lines.push(`- Grid gap: ${design.layout.gridGap}`);
  const bpEntries = Object.entries(design.layout.breakpoints).map(([k, v]) => `${k}=${v}`).join(", ");
  lines.push(`- Breakpoints: ${bpEntries}`);
  lines.push("");

  lines.push("## Voice & Tone");
  lines.push(`- Tone: ${design.voice.tone}`);
  lines.push(`- Personality: ${design.voice.personality.join(", ")}`);
  lines.push("- Do:");
  for (const item of design.voice.doList) {
    lines.push(`  - ${item}`);
  }
  lines.push("- Don't:");
  for (const item of design.voice.dontList) {
    lines.push(`  - ${item}`);
  }
  lines.push("");

  return lines.join("\n");
}

function renderCssCustomProperties(design: DesignMarkdown): string {
  const lines: string[] = [];
  lines.push(":root {");
  lines.push("  /* Colors */");
  for (const [token, value] of Object.entries(design.colors)) {
    const kebab = token.replace(/([A-Z])/g, "-$1").toLowerCase();
    lines.push(`  --color-${kebab}: ${value};`);
  }
  lines.push("");
  lines.push("  /* Typography */");
  lines.push(`  --font-family: ${design.typography.fontFamily};`);
  lines.push(`  --font-heading: ${design.typography.headingFont};`);
  lines.push(`  --font-mono: ${design.typography.monoFont};`);
  for (const [token, value] of Object.entries(design.typography.scale)) {
    lines.push(`  --font-size-${token}: ${value};`);
  }
  for (const [token, value] of Object.entries(design.typography.weights)) {
    lines.push(`  --font-weight-${token}: ${value};`);
  }
  for (const [token, value] of Object.entries(design.typography.lineHeights)) {
    lines.push(`  --line-height-${token}: ${value};`);
  }
  lines.push("");
  lines.push("  /* Spacing */");
  for (const [token, value] of Object.entries(design.spacing.scale)) {
    lines.push(`  --spacing-${token}: ${value};`);
  }
  lines.push("");
  lines.push("  /* Components */");
  lines.push(`  --button-radius: ${design.components.button.borderRadius};`);
  lines.push(`  --card-radius: ${design.components.card.borderRadius};`);
  lines.push(`  --card-shadow: ${design.components.card.shadow};`);
  lines.push(`  --input-radius: ${design.components.input.borderRadius};`);
  lines.push(`  --input-border: ${design.components.input.border};`);
  lines.push("");
  lines.push("  /* Layout */");
  lines.push(`  --max-width: ${design.layout.maxWidth};`);
  lines.push(`  --container-padding: ${design.layout.containerPadding};`);
  lines.push(`  --grid-gap: ${design.layout.gridGap};`);
  for (const [token, value] of Object.entries(design.layout.breakpoints)) {
    lines.push(`  --breakpoint-${token}: ${value};`);
  }
  lines.push("}");

  return lines.join("\n");
}

function renderTailwindConfig(design: DesignMarkdown): string {
  const colors: Record<string, string> = {};
  for (const [token, value] of Object.entries(design.colors)) {
    const kebab = token.replace(/([A-Z])/g, "-$1").toLowerCase();
    colors[kebab] = value;
  }

  const config = {
    theme: {
      extend: {
        colors,
        fontFamily: {
          sans: [design.typography.fontFamily],
          heading: [design.typography.headingFont],
          mono: [design.typography.monoFont],
        },
        fontSize: design.typography.scale,
        fontWeight: design.typography.weights,
        lineHeight: design.typography.lineHeights,
        spacing: design.spacing.scale,
        maxWidth: { container: design.layout.maxWidth },
        borderRadius: {
          button: design.components.button.borderRadius,
          card: design.components.card.borderRadius,
          input: design.components.input.borderRadius,
          badge: design.components.badge.borderRadius,
        },
        screens: design.layout.breakpoints,
      },
    },
  };

  return `// Tailwind CSS configuration snippet generated from design.md\n// Merge this into your tailwind.config.ts theme.extend\n${JSON.stringify(config, null, 2)}`;
}

function renderAgentFormat(design: DesignMarkdown): string {
  const sections: string[] = [];

  sections.push(renderDesignMdMarkdown(design));

  sections.push("---");
  sections.push("");
  sections.push("## CSS Custom Properties");
  sections.push("");
  sections.push("```css");
  sections.push(renderCssCustomProperties(design));
  sections.push("```");
  sections.push("");

  sections.push("## Tailwind Configuration");
  sections.push("");
  sections.push("```javascript");
  sections.push(renderTailwindConfig(design));
  sections.push("```");
  sections.push("");

  return sections.join("\n");
}

export function parseExternalDesignMd(markdown: string): Partial<DesignMarkdown> {
  const result: Partial<DesignMarkdown> = {};

  const brandNameMatch = markdown.match(/^#\s+Design System:\s*(.+)$/m);
  if (brandNameMatch) {
    result.brandName = brandNameMatch[1].trim();
  }

  const descriptionMatch = markdown.match(/^-\s*Description:\s*(.+)$/m);
  if (descriptionMatch) {
    result.brandDescription = descriptionMatch[1].trim();
  }

  const colorTableRegex = /\|\s*(\w+)\s*\|\s*(#[0-9a-fA-F]{3,8})\s*\|/g;
  let colorMatch: RegExpExecArray | null;
  const parsedColors: Record<string, string> = {};
  while ((colorMatch = colorTableRegex.exec(markdown)) !== null) {
    parsedColors[colorMatch[1]] = colorMatch[2];
  }

  if (Object.keys(parsedColors).length > 0) {
    result.colors = {
      primary: parsedColors["primary"] ?? "#14b8a6",
      secondary: parsedColors["secondary"] ?? "#6366f1",
      accent: parsedColors["accent"] ?? "#14b8a6",
      background: parsedColors["background"] ?? "#0a0f1a",
      surface: parsedColors["surface"] ?? "#111827",
      text: parsedColors["text"] ?? "#f9fafb",
      textMuted: parsedColors["textMuted"] ?? "#9ca3af",
      success: parsedColors["success"] ?? "#22c55e",
      warning: parsedColors["warning"] ?? "#f59e0b",
      error: parsedColors["error"] ?? "#ef4444",
    };
  }

  const fontFamilyMatch = markdown.match(/^-\s*Font Family:\s*(.+)$/m);
  const headingFontMatch = markdown.match(/^-\s*Heading Font:\s*(.+)$/m);
  const monoFontMatch = markdown.match(/^-\s*Mono Font:\s*(.+)$/m);

  if (fontFamilyMatch || headingFontMatch) {
    const scaleMatch = markdown.match(/^-\s*Scale:\s*(.+)$/m);
    const scale: Record<string, string> = {};
    if (scaleMatch) {
      for (const pair of scaleMatch[1].split(",")) {
        const [key, value] = pair.split("=").map((s) => s.trim());
        if (key && value) scale[key] = value;
      }
    }

    const weightsMatch = markdown.match(/^-\s*Weights:\s*(.+)$/m);
    const weights: Record<string, number> = {};
    if (weightsMatch) {
      for (const pair of weightsMatch[1].split(",")) {
        const [key, value] = pair.split("=").map((s) => s.trim());
        if (key && value) weights[key] = Number(value);
      }
    }

    const lhMatch = markdown.match(/^-\s*Line Heights:\s*(.+)$/m);
    const lineHeights: Record<string, string> = {};
    if (lhMatch) {
      for (const pair of lhMatch[1].split(",")) {
        const [key, value] = pair.split("=").map((s) => s.trim());
        if (key && value) lineHeights[key] = value;
      }
    }

    result.typography = {
      fontFamily: fontFamilyMatch?.[1]?.trim() ?? "Inter, system-ui, sans-serif",
      headingFont: headingFontMatch?.[1]?.trim() ?? "Inter",
      monoFont: monoFontMatch?.[1]?.trim() ?? "JetBrains Mono, monospace",
      scale: {
        h1: scale["h1"] ?? "2.5rem",
        h2: scale["h2"] ?? "2rem",
        h3: scale["h3"] ?? "1.5rem",
        h4: scale["h4"] ?? "1.25rem",
        body: scale["body"] ?? "1rem",
        small: scale["small"] ?? "0.875rem",
        caption: scale["caption"] ?? "0.75rem",
      },
      weights: {
        normal: weights["normal"] ?? 400,
        medium: weights["medium"] ?? 500,
        semibold: weights["semibold"] ?? 600,
        bold: weights["bold"] ?? 700,
      },
      lineHeights: {
        tight: lineHeights["tight"] ?? "1.25",
        normal: lineHeights["normal"] ?? "1.5",
        relaxed: lineHeights["relaxed"] ?? "1.75",
      },
    };
  }

  const baseUnitMatch = markdown.match(/^-\s*Base unit:\s*(\d+)px$/m);
  const spacingScaleMatch = markdown.match(/^-\s*Scale:\s*((?:[\w]+=[^,\n]+,?\s*)+)$/m);

  if (baseUnitMatch || spacingScaleMatch) {
    const spacingScale: Record<string, string> = {};
    if (spacingScaleMatch) {
      for (const pair of spacingScaleMatch[1].split(",")) {
        const [key, value] = pair.split("=").map((s) => s.trim());
        if (key && value) spacingScale[key] = value;
      }
    }
    result.spacing = {
      unit: baseUnitMatch ? Number(baseUnitMatch[1]) : 4,
      scale: spacingScale,
    };
  }

  const toneMatch = markdown.match(/^-\s*Tone:\s*(.+)$/m);
  if (toneMatch) {
    const personalityMatch = markdown.match(/^-\s*Personality:\s*(.+)$/m);

    const doItems: string[] = [];
    const dontItems: string[] = [];

    const doSectionMatch = markdown.match(/^-\s*Do:\s*\n((?:\s+-\s+.+\n?)+)/m);
    if (doSectionMatch) {
      for (const line of doSectionMatch[1].split("\n")) {
        const itemMatch = line.match(/^\s+-\s+(.+)/);
        if (itemMatch) doItems.push(itemMatch[1].trim());
      }
    }

    const dontSectionMatch = markdown.match(/^-\s*Don't:\s*\n((?:\s+-\s+.+\n?)+)/m);
    if (dontSectionMatch) {
      for (const line of dontSectionMatch[1].split("\n")) {
        const itemMatch = line.match(/^\s+-\s+(.+)/);
        if (itemMatch) dontItems.push(itemMatch[1].trim());
      }
    }

    result.voice = {
      tone: toneMatch[1].trim(),
      personality: personalityMatch ? personalityMatch[1].split(",").map((s) => s.trim()) : [],
      doList: doItems,
      dontList: dontItems,
    };
  }

  return result;
}

export function mergeDesignSystems(base: DesignMarkdown, override: Partial<DesignMarkdown>): DesignMarkdown {
  return {
    brandName: override.brandName ?? base.brandName,
    brandDescription: override.brandDescription ?? base.brandDescription,
    colors: override.colors
      ? { ...base.colors, ...override.colors }
      : base.colors,
    typography: override.typography
      ? {
          fontFamily: override.typography.fontFamily ?? base.typography.fontFamily,
          headingFont: override.typography.headingFont ?? base.typography.headingFont,
          monoFont: override.typography.monoFont ?? base.typography.monoFont,
          scale: { ...base.typography.scale, ...override.typography.scale },
          weights: { ...base.typography.weights, ...override.typography.weights },
          lineHeights: { ...base.typography.lineHeights, ...override.typography.lineHeights },
        }
      : base.typography,
    spacing: override.spacing
      ? {
          unit: override.spacing.unit ?? base.spacing.unit,
          scale: { ...base.spacing.scale, ...override.spacing.scale },
        }
      : base.spacing,
    components: override.components
      ? {
          button: { ...base.components.button, ...override.components.button },
          card: { ...base.components.card, ...override.components.card },
          input: { ...base.components.input, ...override.components.input },
          badge: { ...base.components.badge, ...override.components.badge },
        }
      : base.components,
    layout: override.layout
      ? {
          maxWidth: override.layout.maxWidth ?? base.layout.maxWidth,
          containerPadding: override.layout.containerPadding ?? base.layout.containerPadding,
          gridColumns: override.layout.gridColumns ?? base.layout.gridColumns,
          gridGap: override.layout.gridGap ?? base.layout.gridGap,
          breakpoints: { ...base.layout.breakpoints, ...override.layout.breakpoints },
        }
      : base.layout,
    voice: override.voice
      ? {
          tone: override.voice.tone ?? base.voice.tone,
          personality: override.voice.personality.length > 0 ? override.voice.personality : base.voice.personality,
          doList: override.voice.doList.length > 0 ? override.voice.doList : base.voice.doList,
          dontList: override.voice.dontList.length > 0 ? override.voice.dontList : base.voice.dontList,
        }
      : base.voice,
  };
}

export async function generateDesignMd(tenantId: string): Promise<string> {
  const tenant = await getTenant(tenantId);
  if (!tenant) {
    throw new Error(`Tenant not found: ${tenantId}`);
  }

  const design = buildDefaultDesign(tenant);
  return renderDesignMdMarkdown(design);
}

export async function exportDesignMdForStitch(tenantId: string): Promise<string> {
  const tenant = await getTenant(tenantId);
  if (!tenant) {
    throw new Error(`Tenant not found: ${tenantId}`);
  }

  const design = buildDefaultDesign(tenant);
  return renderDesignMdMarkdown(design);
}

export async function exportDesignMdForAgent(tenantId: string): Promise<string> {
  const tenant = await getTenant(tenantId);
  if (!tenant) {
    throw new Error(`Tenant not found: ${tenantId}`);
  }

  const design = buildDefaultDesign(tenant);
  return renderAgentFormat(design);
}

export function getDesignForTenant(tenant: TenantRecord): DesignMarkdown {
  return buildDefaultDesign(tenant);
}

export function renderDesignPreviewHtml(design: DesignMarkdown): string {
  const c = design.colors;
  const t = design.typography;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Design Preview: ${design.brandName}</title>
  <style>
${renderCssCustomProperties(design)}

* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: ${t.fontFamily}; background: ${c.background}; color: ${c.text}; padding: 48px 24px; max-width: ${design.layout.maxWidth}; margin: 0 auto; }
h1 { font-size: ${t.scale.h1}; font-weight: ${t.weights.bold}; margin-bottom: 8px; }
h2 { font-size: ${t.scale.h2}; font-weight: ${t.weights.semibold}; margin: 32px 0 16px; }
h3 { font-size: ${t.scale.h3}; font-weight: ${t.weights.semibold}; margin: 24px 0 12px; }
p { font-size: ${t.scale.body}; line-height: ${t.lineHeights.normal}; color: ${c.textMuted}; margin-bottom: 16px; }
.color-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; margin: 16px 0; }
.color-swatch { border-radius: ${design.components.card.borderRadius}; overflow: hidden; background: ${c.surface}; }
.color-swatch .swatch { height: 64px; }
.color-swatch .label { padding: 8px 12px; font-size: ${t.scale.small}; }
.card { background: ${c.surface}; border-radius: ${design.components.card.borderRadius}; padding: ${design.components.card.padding}; box-shadow: ${design.components.card.shadow}; margin: 16px 0; }
.btn { display: inline-block; padding: ${design.components.button.padding}; border-radius: ${design.components.button.borderRadius}; font-size: ${design.components.button.fontSize}; font-weight: ${t.weights.semibold}; border: none; cursor: pointer; margin-right: 8px; margin-bottom: 8px; }
.btn-primary { background: ${c.primary}; color: #fff; }
.btn-secondary { background: ${c.secondary}; color: #fff; }
.btn-ghost { background: transparent; color: ${c.text}; border: 1px solid ${c.textMuted}; }
.btn-destructive { background: ${c.error}; color: #fff; }
.input-field { padding: ${design.components.input.padding}; border-radius: ${design.components.input.borderRadius}; border: ${design.components.input.border}; font-size: ${design.components.input.fontSize}; background: ${c.background}; color: ${c.text}; width: 100%; max-width: 400px; display: block; margin: 8px 0; }
.badge { display: inline-block; padding: ${design.components.badge.padding}; border-radius: ${design.components.badge.borderRadius}; font-size: ${design.components.badge.fontSize}; font-weight: ${t.weights.medium}; background: ${c.accent}; color: #fff; margin-right: 6px; }
  </style>
</head>
<body>
  <h1>${design.brandName}</h1>
  <p>${design.brandDescription}</p>

  <h2>Colors</h2>
  <div class="color-grid">
    ${Object.entries(c).map(([name, value]) => `<div class="color-swatch"><div class="swatch" style="background:${value}"></div><div class="label">${name}<br><code>${value}</code></div></div>`).join("\n    ")}
  </div>

  <h2>Typography</h2>
  <div class="card">
    <h1>Heading 1</h1>
    <h2>Heading 2</h2>
    <h3>Heading 3</h3>
    <p>Body text in ${t.fontFamily} at ${t.scale.body}. This is how regular content appears across the design system.</p>
    <p style="font-size:${t.scale.small}">Small text for captions and secondary information.</p>
  </div>

  <h2>Buttons</h2>
  <div class="card">
    <button type="button" class="btn btn-primary">Primary</button>
    <button type="button" class="btn btn-secondary">Secondary</button>
    <button type="button" class="btn btn-ghost">Ghost</button>
    <button type="button" class="btn btn-destructive">Destructive</button>
  </div>

  <h2>Form Elements</h2>
  <div class="card">
    <label for="preview-input" style="font-size:${t.scale.small};display:block;margin-bottom:4px;">Email address</label>
    <input id="preview-input" type="email" class="input-field" placeholder="you@example.com" />
  </div>

  <h2>Badges</h2>
  <div class="card">
    <span class="badge">Active</span>
    <span class="badge" style="background:${c.success}">Success</span>
    <span class="badge" style="background:${c.warning};color:#000">Warning</span>
    <span class="badge" style="background:${c.error}">Error</span>
  </div>
</body>
</html>`;
}
