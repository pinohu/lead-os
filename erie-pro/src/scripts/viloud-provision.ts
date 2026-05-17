// ── Viloud auto-provision script ─────────────────────────────────────
// Drives the Viloud web UI via Playwright to create or update TV channels
// in bulk. Reads a YAML config and produces a mapping of slug → channelId
// that can be written back to src/lib/viloud-channels.ts.
//
// ⚠ STATUS: SCAFFOLDING ONLY ⚠
//
// Viloud has no public API (per Flint audit, March 2026), so this script
// drives the browser. The page selectors marked TODO(viloud-ui) MUST BE
// VERIFIED against the live Viloud dashboard before this will work.
//
// Why ship scaffolding now: when Viloud credentials and UI access become
// available, ~80% of the wiring (config schema, YAML parse, dry-run mode,
// output writer) is already done. The remaining work is filling in the
// 6 selectors with the real DOM queries Viloud uses.
//
// Usage:
//   # 1. Install playwright (one-time, ~300MB):
//   npm install --save-dev playwright
//   npx playwright install chromium
//
//   # 2. Set credentials in env (NOT committed):
//   export VILOUD_EMAIL='your@email'
//   export VILOUD_PASSWORD='your-password'
//
//   # 3. Dry-run to validate the config:
//   npx tsx src/scripts/viloud-provision.ts --config viloud-config.yaml --dry-run
//
//   # 4. Real run:
//   npx tsx src/scripts/viloud-provision.ts --config viloud-config.yaml
//
//   # 5. Apply channel-ID output back to viloud-channels.ts:
//   npx tsx src/scripts/viloud-provision.ts --apply-ids viloud-provision-output.json

import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";
import {
  ViloudProvisionConfigSchema,
  type ViloudChannelConfig,
  type ViloudProvisionConfig,
} from "@/lib/viloud/config-schema";

// ── Type-only Playwright import to avoid bundling at parse time ──────
// We dynamic-import at runtime so the script can run --dry-run without
// playwright installed. Real runs require `npm install playwright`.
type Browser = { newContext: () => Promise<BrowserContext>; close: () => Promise<void> };
type BrowserContext = { newPage: () => Promise<Page>; close: () => Promise<void> };
type Page = {
  goto: (url: string, opts?: object) => Promise<unknown>;
  fill: (sel: string, value: string) => Promise<void>;
  click: (sel: string) => Promise<void>;
  waitForSelector: (sel: string, opts?: object) => Promise<unknown>;
  waitForURL: (pattern: string | RegExp, opts?: object) => Promise<void>;
  url: () => string;
  screenshot: (opts: { path: string }) => Promise<unknown>;
  textContent: (sel: string) => Promise<string | null>;
  $$eval: <T>(sel: string, fn: (els: Element[]) => T) => Promise<T>;
};

// ── Selectors (TODO(viloud-ui): VERIFY ALL OF THESE) ─────────────────
//
// These are best-guesses based on typical app patterns. Run the script
// once with --headed and visually verify each step works. Update selectors
// using the dev-tools inspector on the actual Viloud dashboard.

const SELECTORS = {
  // Login page
  loginEmail: 'input[type="email"], input[name="email"]',
  loginPassword: 'input[type="password"], input[name="password"]',
  loginSubmit: 'button[type="submit"]',
  loginSuccess: '[data-testid="dashboard"], .dashboard, nav a[href*="channels"]',

  // Channel list / create
  createChannelButton: 'a:has-text("New channel"), button:has-text("Create channel")',
  channelNameInput: 'input[name="name"], input#channel-name',
  channelDescriptionInput: 'textarea[name="description"], textarea#channel-description',
  saveChannelButton: 'button:has-text("Save"), button:has-text("Create")',

  // Add video
  addVideoButton: 'button:has-text("Add video"), a:has-text("Add video")',
  videoUrlInput: 'input[name="url"], input[placeholder*="YouTube"]',
  confirmAddVideoButton: 'button:has-text("Add")',

  // Channel ID extraction (after save the URL or embed code shows it)
  // Viloud channel IDs are 32-char hex. Extract from page text or URL.
  channelIdInPage: '[data-channel-id], code:has-text("/channel/")',
};

const VILOUD_BASE_URL = "https://app.viloud.tv";

// ── CLI args ─────────────────────────────────────────────────────────

interface CliArgs {
  configPath: string | null;
  applyIdsPath: string | null;
  dryRun: boolean;
  headed: boolean;
  outputPath: string;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    configPath: null,
    applyIdsPath: null,
    dryRun: false,
    headed: false,
    outputPath: "viloud-provision-output.json",
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--config") args.configPath = argv[++i] ?? null;
    else if (a === "--apply-ids") args.applyIdsPath = argv[++i] ?? null;
    else if (a === "--dry-run") args.dryRun = true;
    else if (a === "--headed") args.headed = true;
    else if (a === "--output") args.outputPath = argv[++i] ?? args.outputPath;
    else if (a === "--help" || a === "-h") {
      console.log(
        [
          "viloud-provision — automate Viloud channel creation",
          "",
          "Usage:",
          "  npx tsx src/scripts/viloud-provision.ts --config <yaml>",
          "  npx tsx src/scripts/viloud-provision.ts --apply-ids <json>",
          "",
          "Options:",
          "  --config <path>      YAML config defining channels to create",
          "  --apply-ids <path>   Apply previously-saved IDs back to viloud-channels.ts",
          "  --dry-run            Parse + validate config, no browser",
          "  --headed             Run browser visibly (for debugging selectors)",
          "  --output <path>      JSON output of slug→channelId (default viloud-provision-output.json)",
          "",
          "Env (required for real runs):",
          "  VILOUD_EMAIL, VILOUD_PASSWORD",
        ].join("\n")
      );
      process.exit(0);
    }
  }
  return args;
}

// ── YAML parser (lightweight) ────────────────────────────────────────
//
// We avoid pulling in `yaml` as a dep — the config format is simple
// enough to parse with JSON.parse if you write the config as .json,
// or use yaml-style with manual conversion. For now, expect JSON.

function loadConfig(path: string): ViloudProvisionConfig {
  const abs = resolve(process.cwd(), path);
  if (!existsSync(abs)) {
    throw new Error(`Config not found: ${abs}`);
  }
  const raw = readFileSync(abs, "utf-8");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(
      `Config must be JSON. YAML support is not yet wired up — convert to .json or add a YAML parser.`
    );
  }
  const result = ViloudProvisionConfigSchema.safeParse(parsed);
  if (!result.success) {
    console.error("Config validation failed:");
    console.error(result.error.format());
    process.exit(1);
  }
  return result.data;
}

// ── Provision flow ───────────────────────────────────────────────────

async function provision(args: CliArgs): Promise<void> {
  if (!args.configPath) {
    console.error("--config <yaml> required");
    process.exit(1);
  }

  const config = loadConfig(args.configPath);
  console.log(`Loaded config: ${config.channels.length} channel(s) to provision`);

  // Plan summary
  for (const ch of config.channels) {
    console.log(
      `  · ${ch.slug} (${ch.name}): ${ch.videos.length} videos, ${ch.niches.length} niches`
    );
  }

  if (args.dryRun) {
    console.log("\n(dry-run: skipping browser automation)");
    return;
  }

  // Verify credentials
  const email = process.env.VILOUD_EMAIL;
  const password = process.env.VILOUD_PASSWORD;
  if (!email || !password) {
    console.error(
      "\nERROR: VILOUD_EMAIL and VILOUD_PASSWORD must be set in the environment."
    );
    process.exit(1);
  }

  // Dynamic-import playwright
  let playwright: typeof import("playwright");
  try {
    playwright = (await import("playwright")) as typeof import("playwright");
  } catch {
    console.error(
      "\nERROR: playwright is not installed. Run:\n" +
        "  npm install --save-dev playwright\n" +
        "  npx playwright install chromium\n"
    );
    process.exit(1);
  }

  const browser = (await playwright.chromium.launch({
    headless: !args.headed,
  })) as unknown as Browser;
  const context = await browser.newContext();
  const page = await context.newPage();

  const results: Record<string, string> = {};
  let succeeded = 0;
  let failed = 0;

  try {
    // ── Login ────────────────────────────────────────────────────────
    console.log("\nLogging into Viloud...");
    await page.goto(`${VILOUD_BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    await page.fill(SELECTORS.loginEmail, email);
    await page.fill(SELECTORS.loginPassword, password);
    await page.click(SELECTORS.loginSubmit);
    try {
      await page.waitForSelector(SELECTORS.loginSuccess, { timeout: 15000 });
      console.log("  ✓ Logged in");
    } catch {
      await page.screenshot({ path: "viloud-login-failed.png" });
      throw new Error(
        "Login did not complete. Check viloud-login-failed.png and verify SELECTORS.loginSuccess matches the post-login UI."
      );
    }

    // ── For each channel ─────────────────────────────────────────────
    for (const channel of config.channels) {
      try {
        const id = await provisionChannel(page, channel);
        results[channel.slug] = id;
        console.log(`  ✓ ${channel.slug} → ${id}`);
        succeeded++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`  ✗ ${channel.slug}: ${msg}`);
        await page.screenshot({
          path: `viloud-error-${channel.slug}.png`,
        });
        failed++;
      }
    }
  } finally {
    await context.close();
    await browser.close();
  }

  // Write output
  writeFileSync(args.outputPath, JSON.stringify(results, null, 2));
  console.log(`\n${succeeded} succeeded, ${failed} failed`);
  console.log(`Wrote ${args.outputPath}`);
  if (succeeded > 0) {
    console.log(
      `\nTo apply IDs back to viloud-channels.ts:\n  npx tsx src/scripts/viloud-provision.ts --apply-ids ${args.outputPath}`
    );
  }
}

async function provisionChannel(
  page: Page,
  channel: ViloudChannelConfig
): Promise<string> {
  // TODO(viloud-ui): The exact flow depends on Viloud's UI. The shape
  // below assumes:
  //   1. Click "New channel" from dashboard
  //   2. Fill name + description, save
  //   3. Add videos one at a time
  //   4. Extract channel ID from URL or embed code

  await page.goto(`${VILOUD_BASE_URL}/channels`, { waitUntil: "domcontentloaded" });
  await page.click(SELECTORS.createChannelButton);
  await page.fill(SELECTORS.channelNameInput, channel.name);
  await page.fill(SELECTORS.channelDescriptionInput, channel.description);
  await page.click(SELECTORS.saveChannelButton);

  // After save, URL usually contains the channel ID
  await page.waitForURL(/\/channels?\/[a-f0-9]{32}/, { timeout: 15000 });
  const url = page.url();
  const idMatch = /([a-f0-9]{32})/.exec(url);
  if (!idMatch) {
    throw new Error(`Could not extract channel ID from URL: ${url}`);
  }
  const channelId = idMatch[1];

  // Add videos
  for (const video of channel.videos) {
    await page.click(SELECTORS.addVideoButton);
    await page.fill(
      SELECTORS.videoUrlInput,
      `https://www.youtube.com/watch?v=${video.youtubeId}`
    );
    await page.click(SELECTORS.confirmAddVideoButton);
    // TODO(viloud-ui): wait for the video to appear in the playlist
    // before moving on. Without a wait, rapid adds may race the UI.
  }

  return channelId;
}

// ── Apply IDs back to viloud-channels.ts ─────────────────────────────

function applyIds(jsonPath: string): void {
  const abs = resolve(process.cwd(), jsonPath);
  if (!existsSync(abs)) {
    console.error(`File not found: ${abs}`);
    process.exit(1);
  }
  const ids = JSON.parse(readFileSync(abs, "utf-8")) as Record<string, string>;

  // Load existing channels file
  const channelsPath = resolve(
    process.cwd(),
    "src",
    "lib",
    "viloud-channels.ts"
  );
  if (!existsSync(channelsPath)) {
    console.error(`viloud-channels.ts not found at ${channelsPath}`);
    process.exit(1);
  }
  let source = readFileSync(channelsPath, "utf-8");
  let updated = 0;

  for (const [slug, channelId] of Object.entries(ids)) {
    // Replace `  "slug": null,` with `  "slug": "ID",`
    const re = new RegExp(
      `("${slug}"\\s*:\\s*)null(\\s*,)`,
      "g"
    );
    if (re.test(source)) {
      source = source.replace(re, `$1"${channelId}"$2`);
      updated++;
      console.log(`  ✓ ${slug} → ${channelId}`);
    } else {
      console.warn(
        `  ! Skipped ${slug}: no "null" entry found in viloud-channels.ts (already set or slug missing)`
      );
    }
  }

  writeFileSync(channelsPath, source);
  console.log(`\nUpdated ${updated} entries in ${channelsPath}`);
  console.log("Review with: git diff src/lib/viloud-channels.ts");
}

// ── Main ─────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.applyIdsPath) {
    applyIds(args.applyIdsPath);
    return;
  }

  await provision(args);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
