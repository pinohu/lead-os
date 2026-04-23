#!/usr/bin/env node
// scripts/gtm-print.ts — print GTM_USE_CASES for operators (run via npm run gtm:print).

import { GTM_USE_CASES, getGtmUseCaseById, getGtmUseCaseBySlug } from "../src/config/gtm-use-cases.ts";
import { assertValidGtmConfig } from "../src/lib/gtm/config-validation.ts";

interface CliOptions {
  json: boolean;
  id: number | null;
  slug: string | null;
}

function parseArgs(argv: string[]): CliOptions {
  let json = false;
  let id: number | null = null;
  let slug: string | null = null;

  const args = argv.filter((a) => a !== "--");
  for (let i = 0; i < args.length; i++) {
    const raw = args[i];
    if (raw === "--json" || raw === "-json") {
      json = true;
      continue;
    }
    const idEq = raw.match(/^--id=(\d+)$/);
    if (idEq) {
      id = Number(idEq[1]);
      continue;
    }
    const slugEq = raw.match(/^--slug=(.+)$/);
    if (slugEq) {
      slug = slugEq[1].trim();
      continue;
    }
    if (raw === "--id") {
      const next = args[i + 1];
      if (next && /^\d+$/.test(next)) {
        id = Number(next);
        i++;
      }
      continue;
    }
    console.error(`Unknown argument: ${raw}`);
    process.exit(2);
  }

  return { json, id, slug };
}

function printCases(cases: typeof GTM_USE_CASES) {
  for (const c of cases) {
    console.log("─".repeat(72));
    console.log(`id:          ${c.id}`);
    console.log(`title:       ${c.title}`);
    console.log(`slug:        ${c.slug}`);
    if (c.slugAliases?.length) console.log(`aliases:     ${c.slugAliases.join(", ")}`);
    if (c.summary) console.log(`summary:     ${c.summary}`);
    console.log("technicalAnchors:");
    for (const a of c.technicalAnchors) console.log(`  - ${a}`);
    console.log("envKeys:");
    for (const e of c.envKeys) console.log(`  - ${e}`);
    console.log("weekOneActions:");
    for (const w of c.weekOneActions) console.log(`  - ${w}`);
    console.log("");
  }
}

function main() {
  try {
    assertValidGtmConfig(GTM_USE_CASES);
  } catch (err) {
    console.error("GTM config is malformed:", err instanceof Error ? err.message : String(err));
    process.exit(1);
  }

  const opts = parseArgs(process.argv.slice(2));

  if (opts.id != null && opts.slug) {
    console.error("Use only one of --id or --slug");
    process.exit(2);
  }

  let cases = [...GTM_USE_CASES];
  if (opts.id != null) {
    const one = getGtmUseCaseById(opts.id);
    if (!one) {
      console.error(`No use case with id=${opts.id}`);
      process.exit(1);
    }
    cases = [one];
  } else if (opts.slug) {
    const one = getGtmUseCaseBySlug(opts.slug);
    if (!one) {
      console.error(`No use case with slug=${opts.slug}`);
      process.exit(1);
    }
    cases = [one];
  }

  if (opts.json) {
    console.log(JSON.stringify(cases, null, 2));
    return;
  }

  printCases(cases);
}

main();
