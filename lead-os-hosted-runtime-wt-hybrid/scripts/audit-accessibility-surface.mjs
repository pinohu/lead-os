import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, extname } from "node:path";

const root = process.cwd();
const srcDir = join(root, "src");
const scriptDir = join(root, "scripts");

const sourceExtensions = new Set([".ts", ".tsx", ".css", ".js", ".mjs"]);
const sourceFiles = [];

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const absolute = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(absolute);
      continue;
    }
    if (sourceExtensions.has(extname(entry.name))) {
      sourceFiles.push(absolute);
    }
  }
}

function lineFor(text, index) {
  return text.slice(0, index).split(/\r?\n/u).length;
}

function findViolations(file, text, rules) {
  const violations = [];
  const relativePath = relative(root, file);
  if (/scripts[\\/]+audit-accessibility-surface\.mjs$/u.test(relativePath)) {
    return violations;
  }
  for (const rule of rules) {
    if (rule.ignorePathPattern?.test(relativePath)) {
      continue;
    }
    for (const match of text.matchAll(rule.pattern)) {
      violations.push({
        file: relative(root, file),
        line: lineFor(text, match.index ?? 0),
        rule: rule.name,
        detail: rule.detail,
        value: match[0].slice(0, 140).replace(/\s+/gu, " "),
      });
    }
  }
  return violations;
}

const unsafeSourceRules = [
  {
    name: "unsafe-action-contrast",
    detail: "Do not pair mid-tone Tailwind 500 backgrounds with light foreground text; use a 700+ action color or semantic primary token.",
    pattern: /(?:bg-(?:teal|blue|green|red|gray)-500[^\n"`']*(?:text-white|text-primary-foreground)|(?:text-white|text-primary-foreground)[^\n"`']*bg-(?:teal|blue|green|red|gray)-500)/gu,
    ignorePathPattern: /src[\\/]+app[\\/]+globals\.css$/u,
  },
  {
    name: "viewport-font-sizing",
    detail: "Font sizes must use stable type scales, not clamp/vw sizing that changes continuously with viewport width.",
    pattern: /(?:fontSize:\s*["']clamp\(|font-size\s*:\s*clamp\(|text-\[clamp\()/gu,
  },
  {
    name: "negative-letter-spacing",
    detail: "Letter spacing must be normal or positive for readability; avoid negative tracking utilities.",
    pattern: /-tracking-\[[^\]]+\]/gu,
  },
  {
    name: "small-action-target",
    detail: "Interactive controls should avoid 32px or 36px action targets; use 44px+ where practical.",
    pattern: /min-h-\[(?:32|36)px\]/gu,
  },
  {
    name: "disabled-low-opacity",
    detail: "Disabled states still need readable labels; use opacity 70+ or explicit muted foreground.",
    pattern: /disabled:opacity-50|data-\[disabled(?:=true)?\]:opacity-50|has-\[:disabled\]:opacity-50|aria-selected:opacity-30|text-muted-foreground\/(?:50|60)|style=\{\{[^}\n]*opacity:[^}\n]*0\.6/gu,
  },
];

const requiredFileChecks = [
  {
    file: "src/app/globals.css",
    includes: [
      "Accessibility guardrails",
      ".bg-teal-500.text-white",
      "main a:not([class])",
      "::placeholder",
      "@media (forced-colors: active)",
    ],
  },
  {
    file: "src/components/ui/button.tsx",
    includes: ["min-h-11", "font-semibold"],
  },
  {
    file: "src/components/ui/input.tsx",
    includes: ["min-h-11", "disabled:opacity-70"],
  },
  {
    file: "src/components/ui/select.tsx",
    includes: ["min-h-11", "disabled:opacity-70"],
  },
  {
    file: "tailwind.config.ts",
    includes: ["overlay: \"hsl(var(--overlay))\""],
  },
];

if (!existsSync(srcDir)) {
  console.error("Accessibility audit expected a src directory.");
  process.exit(1);
}

walk(srcDir);
if (existsSync(scriptDir)) {
  walk(scriptDir);
}

const violations = sourceFiles.flatMap((file) => findViolations(file, readFileSync(file, "utf8"), unsafeSourceRules));

for (const check of requiredFileChecks) {
  const file = join(root, check.file);
  const text = existsSync(file) ? readFileSync(file, "utf8") : "";
  for (const required of check.includes) {
    if (!text.includes(required)) {
      violations.push({
        file: check.file,
        line: 1,
        rule: "missing-accessibility-guardrail",
        detail: `Expected shared accessibility guardrail: ${required}`,
        value: "",
      });
    }
  }
}

if (violations.length > 0) {
  console.error("Accessibility surface audit failed:");
  for (const violation of violations) {
    console.error(`- ${violation.file}:${violation.line} [${violation.rule}] ${violation.detail}`);
    if (violation.value) {
      console.error(`  ${violation.value}`);
    }
  }
  process.exit(1);
}

console.log(`Accessibility surface audit passed across ${sourceFiles.length} source files.`);
