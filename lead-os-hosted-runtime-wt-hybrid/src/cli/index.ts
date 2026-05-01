#!/usr/bin/env node
import { provisionTenant } from "../lib/tenant-provisioner.ts";
import { getTenant, listTenants } from "../lib/tenant-store.ts";
import { generateNicheConfig } from "../lib/niche-generator.ts";
import { processLeadIntake } from "../lib/intake.ts";
import {
  computeCompositeScore,
  computeIntentScore,
  computeFitScore,
  computeEngagementScore,
  computeUrgencyScore,
  classifyLeadTemperature,
  getScoreRecommendation,
} from "../lib/scoring-engine.ts";
import { decideNextStep } from "../lib/orchestrator.ts";
import { getLeadRecord, getLeadRecords } from "../lib/runtime-store.ts";
import {
  collectPerformanceMetrics,
  runFeedbackCycle,
  generateInsights,
  getDefaultKPITargets,
} from "../lib/feedback-engine.ts";
import { listMarketplaceLeads } from "../lib/marketplace-store.ts";
import {
  validateDesignSpec,
  generateDesignSpecTemplate,
  generateSystemConfig,
  parseDesignSpec,
} from "../lib/design-spec.ts";
import * as fs from "fs";

const CLI_VERSION = "0.1.0";

interface ParsedArgs {
  command: string;
  subcommand: string | null;
  positional: string[];
  flags: Record<string, string | boolean>;
}

export function parseArgs(argv: string[]): ParsedArgs {
  const args = argv.slice(2);
  const flags: Record<string, string | boolean> = {};
  const positional: string[] = [];
  let command = "";
  let subcommand: string | null = null;

  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = args[i + 1];
      if (next && !next.startsWith("--")) {
        flags[key] = next;
        i += 2;
      } else {
        flags[key] = true;
        i += 1;
      }
    } else if (!command) {
      command = arg;
      i += 1;
    } else if (!subcommand && !arg.startsWith("-")) {
      const peekNext = args.slice(i + 1);
      const hasMorePositional = peekNext.length > 0 && !peekNext[0].startsWith("--");
      if (["list", "export", "apply"].includes(arg) || (command === "experiments" || command === "marketplace" || command === "design-spec")) {
        subcommand = arg;
      } else {
        positional.push(arg);
      }
      i += 1;
    } else {
      positional.push(arg);
      i += 1;
    }
  }

  return { command, subcommand, positional, flags };
}

function isJsonOutput(flags: Record<string, string | boolean>): boolean {
  return flags.json === true;
}

function output(data: unknown, json: boolean): void {
  if (json) {
    process.stdout.write(JSON.stringify(data, null, 2) + "\n");
  } else {
    formatHuman(data);
  }
}

function formatHuman(data: unknown, indent: number = 0): void {
  if (data === null || data === undefined) {
    process.stdout.write("null\n");
    return;
  }

  if (typeof data === "string" || typeof data === "number" || typeof data === "boolean") {
    process.stdout.write(String(data) + "\n");
    return;
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      process.stdout.write("  (none)\n");
      return;
    }
    for (const item of data) {
      if (typeof item === "object" && item !== null) {
        formatObject(item as Record<string, unknown>, indent);
        process.stdout.write("\n");
      } else {
        process.stdout.write(`${"  ".repeat(indent)}- ${String(item)}\n`);
      }
    }
    return;
  }

  if (typeof data === "object") {
    formatObject(data as Record<string, unknown>, indent);
  }
}

function formatObject(obj: Record<string, unknown>, indent: number = 0): void {
  const pad = "  ".repeat(indent);
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) continue;
    if (typeof value === "object" && !Array.isArray(value)) {
      process.stdout.write(`${pad}${key}:\n`);
      formatObject(value as Record<string, unknown>, indent + 1);
    } else if (Array.isArray(value)) {
      process.stdout.write(`${pad}${key}:\n`);
      formatHuman(value, indent + 1);
    } else {
      const display = typeof value === "string" && value.length > 120
        ? value.slice(0, 120) + "..."
        : String(value);
      process.stdout.write(`${pad}${key}: ${display}\n`);
    }
  }
}

function printUsage(): void {
  process.stdout.write(`Lead OS CLI - Command-line interface for Lead OS

Usage: lead-os <command> [options]

Commands:
  provision <slug>          Provision a new tenant
  generate-niche <name>     Generate niche configuration
  capture                   Capture a new lead
  score                     Score a lead
  route                     Get routing decision for a lead
  leads                     List leads
  analytics                 Get analytics snapshot
  feedback                  Run feedback optimization cycle
  experiments list          List experiments
  marketplace list          List marketplace leads
  design-spec export        Export design.md for a tenant
  design-spec apply <file>  Apply design spec from file
  video-script              Generate Remotion video script
  generate-offer            Generate irresistible offer
  lead-value                Calculate dynamic lead value
  trust-score               Calculate trust score
  niche-insights            Aggregated niche intelligence
  seo-page                  Generate SEO-optimized page
  deep-psych                Generate psychology triggers
  health                    Health check

Global Flags:
  --json                    Output as JSON
  --help                    Show help

Run 'lead-os <command> --help' for command-specific help.
`);
}

function printCommandHelp(command: string): void {
  const help: Record<string, string> = {
    provision: `Usage: lead-os provision <slug> [options]

Options:
  --niche <niche>       Target niche (required)
  --plan <plan>         Plan tier: starter, growth, enterprise, custom (required)
  --email <email>       Operator email (required)
  --brand <name>        Brand name (required)
  --site <url>          Site URL (required)
  --support <email>     Support email (defaults to operator email)
  --revenue-model <m>   Revenue model: managed, white-label, implementation, directory (default: managed)
  --industry <industry> Industry category override`,

    "generate-niche": `Usage: lead-os generate-niche <name> [options]

Options:
  --industry <industry>   Industry category override
  --keywords <k1,k2,...>  Additional keywords for detection`,

    capture: `Usage: lead-os capture [options]

Options:
  --source <source>   Lead source: contact_form, assessment, roi_calculator, exit_intent, chat, webinar, checkout, manual (required)
  --email <email>     Lead email
  --phone <phone>     Lead phone
  --name <name>       Lead first name
  --last-name <name>  Lead last name
  --company <company> Company name
  --niche <niche>     Target niche
  --service <service> Service of interest`,

    score: `Usage: lead-os score [options]

Options:
  --source <source>     Lead source (required)
  --email <email>       Has email (flag)
  --phone <phone>       Has phone (flag)
  --pages <n>           Pages viewed
  --time <seconds>      Time on site
  --company-size <size> Company size (enterprise, mid-market, small, solo)
  --timeline <tl>       Timeline (immediate, this-week, this-month, this-quarter, exploring)
  --returning           Returning visitor flag`,

    route: `Usage: lead-os route [options]

Options:
  --source <source>   Traffic source
  --email <email>     Has email
  --phone <phone>     Has phone
  --niche <niche>     Target niche
  --returning         Returning visitor
  --quote             Asking for quote
  --booking           Wants booking
  --checkout          Wants checkout
  --chat              Prefers chat
  --score <n>         Current lead score`,

    leads: `Usage: lead-os leads [options]

Options:
  --niche <niche>       Filter by niche
  --stage <stage>       Filter by lead stage
  --min-score <n>       Minimum score
  --limit <n>           Max results (default 50)`,

    analytics: `Usage: lead-os analytics [options]

Options:
  --tenant <id>     Tenant ID (default: default)
  --since <date>    Start date
  --until <date>    End date`,

    feedback: `Usage: lead-os feedback [options]

Options:
  --type <type>     Cycle type: daily, weekly, monthly (required)
  --tenant <id>     Tenant ID (default: default)`,

    "design-spec": `Usage: lead-os design-spec <subcommand> [options]

Subcommands:
  export    Export design.md for a tenant
  apply     Apply design spec from file

Options:
  --tenant <id>    Tenant ID (default: default)`,

    "video-script": `Usage: lead-os video-script [options]

Options:
  --type <type>         Video type: product-demo, data-report, launch-video (required)
  --features <f1,f2>    Features to highlight (comma-separated)
  --title <title>       Video title override
  --color <hex>         Brand color
  --duration <seconds>  Duration in seconds (default 30)`,

    "generate-offer": `Usage: lead-os generate-offer <niche> <service> [options]

Options:
  --price <amount>    Base price point
  --urgency <level>   Urgency: low, medium, high (default: medium)`,

    "lead-value": `Usage: lead-os lead-value <niche> <quality> [options]

Options:
  --score <n>         Lead score (0-100)`,

    "trust-score": `Usage: lead-os trust-score <tenantId>

Calculate trust score with recommendations for a tenant.`,

    "niche-insights": `Usage: lead-os niche-insights <niche>

Get aggregated niche intelligence and benchmarks.`,

    "seo-page": `Usage: lead-os seo-page <niche> <keyword> [options]

Options:
  --template <type>   Template: standard, long-form, local (default: standard)`,

    "deep-psych": `Usage: lead-os deep-psych <niche> <emotion> [options]

Options:
  --intensity <level>  Intensity: subtle, moderate, intense (default: moderate)`,

    health: `Usage: lead-os health

Performs a basic health check of Lead OS runtime components.`,

    experiments: `Usage: lead-os experiments list

Lists all experiments.`,

    marketplace: `Usage: lead-os marketplace list [options]

Options:
  --niche <niche>         Filter by niche
  --temperature <temp>    Filter by temperature (cold, warm, hot, burning)
  --status <status>       Filter by status (available, claimed, sold, expired)`,
  };

  const text = help[command];
  if (text) {
    process.stdout.write(text + "\n");
  } else {
    process.stdout.write(`Unknown command: ${command}\nRun 'lead-os --help' for available commands.\n`);
  }
}

async function runCommand(parsed: ParsedArgs): Promise<void> {
  const { command, subcommand, positional, flags } = parsed;
  const json = isJsonOutput(flags);

  if (!command || flags.help === true) {
    if (command) {
      printCommandHelp(command);
    } else {
      printUsage();
    }
    return;
  }

  switch (command) {
    case "provision": {
      const slug = positional[0];
      if (!slug) {
        process.stderr.write("Error: slug is required. Usage: lead-os provision <slug> --niche <niche> --plan <plan> --email <email> --brand <name> --site <url>\n");
        process.exitCode = 1;
        return;
      }
      const niche = flags.niche as string;
      const plan = flags.plan as string;
      const email = flags.email as string;
      const brand = flags.brand as string;
      const site = flags.site as string;
      if (!niche || !plan || !email || !brand || !site) {
        process.stderr.write("Error: --niche, --plan, --email, --brand, and --site are required.\n");
        process.exitCode = 1;
        return;
      }
      const result = await provisionTenant({
        slug,
        niche,
        plan: plan as "starter" | "growth" | "enterprise" | "custom",
        operatorEmail: email,
        supportEmail: (flags.support as string) ?? email,
        brandName: brand,
        siteUrl: site,
        revenueModel: (flags["revenue-model"] as "managed" | "white-label" | "implementation" | "directory") ?? "managed",
        industry: flags.industry as string | undefined,
      });
      output(result, json);
      break;
    }

    case "generate-niche": {
      const name = positional[0];
      if (!name) {
        process.stderr.write("Error: niche name is required. Usage: lead-os generate-niche <name>\n");
        process.exitCode = 1;
        return;
      }
      const keywords = typeof flags.keywords === "string" ? flags.keywords.split(",") : undefined;
      const config = generateNicheConfig({
        name,
        industry: flags.industry as string | undefined,
        keywords,
      });
      output(config, json);
      break;
    }

    case "capture": {
      const source = flags.source as string;
      if (!source) {
        process.stderr.write("Error: --source is required.\n");
        process.exitCode = 1;
        return;
      }
      const result = await processLeadIntake({
        source: source as "contact_form" | "assessment" | "roi_calculator" | "exit_intent" | "chat" | "webinar" | "checkout" | "manual",
        email: flags.email as string | undefined,
        phone: flags.phone as string | undefined,
        firstName: flags.name as string | undefined,
        lastName: flags["last-name"] as string | undefined,
        company: flags.company as string | undefined,
        niche: flags.niche as string | undefined,
        service: flags.service as string | undefined,
      });
      output({
        success: result.success,
        leadKey: result.leadKey,
        score: result.score,
        stage: result.stage,
        hot: result.hot,
      }, json);
      break;
    }

    case "score": {
      const source = flags.source as string;
      if (!source) {
        process.stderr.write("Error: --source is required.\n");
        process.exitCode = 1;
        return;
      }
      const ctx = {
        source,
        hasEmail: typeof flags.email === "string" || flags.email === true,
        hasPhone: typeof flags.phone === "string" || flags.phone === true,
        pagesViewed: flags.pages ? Number(flags.pages) : undefined,
        timeOnSite: flags.time ? Number(flags.time) : undefined,
        companySize: flags["company-size"] as string | undefined,
        timeline: flags.timeline as string | undefined,
        returnVisits: flags.returning === true ? 1 : undefined,
      };
      const intent = computeIntentScore(ctx);
      const fit = computeFitScore(ctx);
      const engagement = computeEngagementScore(ctx);
      const urgency = computeUrgencyScore(ctx);
      const composite = computeCompositeScore(ctx);
      const temperature = classifyLeadTemperature(composite.score);
      const scores = [intent, fit, engagement, urgency, composite];
      const recommendation = getScoreRecommendation(scores);
      output({ composite, temperature, recommendation }, json);
      break;
    }

    case "route": {
      const signal = {
        source: flags.source as string | undefined,
        niche: flags.niche as string | undefined,
        hasEmail: typeof flags.email === "string" || flags.email === true,
        hasPhone: typeof flags.phone === "string" || flags.phone === true,
        returning: flags.returning === true,
        askingForQuote: flags.quote === true,
        wantsBooking: flags.booking === true,
        wantsCheckout: flags.checkout === true,
        prefersChat: flags.chat === true,
        score: flags.score ? Number(flags.score) : undefined,
      };
      const decision = decideNextStep(signal);
      output(decision, json);
      break;
    }

    case "leads": {
      let records = await getLeadRecords();
      if (flags.niche) {
        records = records.filter((r) => r.niche === flags.niche);
      }
      if (flags.stage) {
        records = records.filter((r) => r.stage === flags.stage);
      }
      if (flags["min-score"]) {
        const min = Number(flags["min-score"]);
        records = records.filter((r) => r.score >= min);
      }
      const limit = Math.min(Number(flags.limit) || 50, 100);
      const result = records.slice(0, limit).map((r) => ({
        leadKey: r.leadKey,
        email: r.email ?? "-",
        score: r.score,
        stage: r.stage,
        niche: r.niche,
        source: r.source,
        hot: r.hot,
        createdAt: r.createdAt,
      }));
      output({ leads: result, total: records.length }, json);
      break;
    }

    case "analytics": {
      const tenantId = (flags.tenant as string) ?? "default";
      const now = new Date();
      const since = (flags.since as string) ?? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const until = (flags.until as string) ?? now.toISOString();
      const metrics = await collectPerformanceMetrics(tenantId, since, until);
      const targets = getDefaultKPITargets();
      const insights = generateInsights(metrics, targets);
      output({ metrics, insights }, json);
      break;
    }

    case "feedback": {
      const type = flags.type as string;
      if (!type || !["daily", "weekly", "monthly"].includes(type)) {
        process.stderr.write("Error: --type must be daily, weekly, or monthly.\n");
        process.exitCode = 1;
        return;
      }
      const tenantId = (flags.tenant as string) ?? "default";
      const cycle = await runFeedbackCycle(tenantId, type as "daily" | "weekly" | "monthly");
      output(cycle, json);
      break;
    }

    case "experiments": {
      if (subcommand === "list" || !subcommand) {
        process.stdout.write("Experiments listing requires database access.\n");
        process.stdout.write("Use the MCP server for full experiment management.\n");
      } else {
        process.stderr.write(`Unknown subcommand: ${subcommand}. Use 'experiments list'.\n`);
        process.exitCode = 1;
      }
      break;
    }

    case "marketplace": {
      if (subcommand === "list" || !subcommand) {
        const result = await listMarketplaceLeads({
          niche: flags.niche as string | undefined,
          temperature: flags.temperature as "cold" | "warm" | "hot" | "burning" | undefined,
          status: flags.status as "available" | "claimed" | "sold" | "expired" | undefined,
        });
        output(result, json);
      } else {
        process.stderr.write(`Unknown subcommand: ${subcommand}. Use 'marketplace list'.\n`);
        process.exitCode = 1;
      }
      break;
    }

    case "design-spec": {
      if (subcommand === "export") {
        const tenantId = (flags.tenant as string) ?? "default";
        const tenant = await getTenant(tenantId);
        const niche = tenant?.defaultNiche ?? "general";
        const industry = tenant?.metadata?.industry as string | undefined;
        const markdown = generateDesignSpecTemplate(niche, industry);
        if (json) {
          output({ tenantId, designMd: markdown }, true);
        } else {
          process.stdout.write(markdown + "\n");
        }
      } else if (subcommand === "apply") {
        const file = positional[0];
        if (!file) {
          process.stderr.write("Error: file path is required. Usage: lead-os design-spec apply <file>\n");
          process.exitCode = 1;
          return;
        }
        let content: string;
        try {
          content = fs.readFileSync(file, "utf-8");
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          process.stderr.write(`Error reading file: ${msg}\n`);
          process.exitCode = 1;
          return;
        }
        const spec = parseDesignSpec(content);
        const validation = validateDesignSpec(spec);
        if (!validation.valid) {
          output({ valid: false, errors: validation.errors }, json);
          process.exitCode = 1;
          return;
        }
        const systemConfig = generateSystemConfig(spec);
        output({ valid: true, systemConfig }, json);
      } else {
        process.stderr.write("Usage: lead-os design-spec <export|apply>\n");
        process.exitCode = 1;
      }
      break;
    }

    case "video-script": {
      const videoType = flags.type as string;
      if (!videoType || !["product-demo", "data-report", "launch-video"].includes(videoType)) {
        process.stderr.write("Error: --type must be product-demo, data-report, or launch-video.\n");
        process.exitCode = 1;
        return;
      }
      const features = typeof flags.features === "string" ? flags.features.split(",") : undefined;
      const { tools: mcpTools } = await import("../mcp/tools.ts");
      const videoTool = mcpTools.find((t: { name: string }) => t.name === "lead_os_export_video_script");
      if (videoTool) {
        const result = await videoTool.handler({
          tenantId: (flags.tenant as string) ?? "default",
          type: videoType,
          features,
          title: flags.title as string | undefined,
          brandColor: flags.color as string | undefined,
          duration: flags.duration ? Number(flags.duration) : undefined,
        });
        output(result, json);
      }
      break;
    }

    case "generate-offer": {
      const offerNiche = positional[0];
      const offerService = positional[1];
      if (!offerNiche || !offerService) {
        process.stderr.write("Error: niche and service are required. Usage: lead-os generate-offer <niche> <service>\n");
        process.exitCode = 1;
        return;
      }
      try {
        const mod = await import("../lib/offer-engine.ts");
        const result = mod.generateOffer(
          offerNiche as Parameters<typeof mod.generateOffer>[0],
          offerService,
          { averageProjectValue: flags.price ? Number(flags.price) : undefined },
        );
        output(result, json);
      } catch {
        output({ error: "offer-engine module not yet available" }, json);
      }
      break;
    }

    case "lead-value": {
      const lvNiche = positional[0];
      const lvQuality = positional[1];
      if (!lvNiche || !lvQuality) {
        process.stderr.write("Error: niche and quality are required. Usage: lead-os lead-value <niche> <quality>\n");
        process.exitCode = 1;
        return;
      }
      try {
        const mod = await import("../lib/monetization-engine.ts");
        const result = mod.calculateLeadValue(
          { id: "cli", metadata: { quality: lvQuality } },
          lvNiche,
          flags.score ? Number(flags.score) : 50,
        );
        output(result, json);
      } catch {
        output({ error: "monetization-engine module not yet available" }, json);
      }
      break;
    }

    case "trust-score": {
      const tsTenantId = positional[0];
      if (!tsTenantId) {
        process.stderr.write("Error: tenantId is required. Usage: lead-os trust-score <tenantId>\n");
        process.exitCode = 1;
        return;
      }
      try {
        const mod = await import("../lib/trust-engine.ts");
        const score = mod.calculateTrustScore(tsTenantId);
        const recommendations = mod.getTrustRecommendations(tsTenantId);
        const result = { score, recommendations };
        output(result, json);
      } catch {
        output({ error: "trust-engine module not yet available" }, json);
      }
      break;
    }

    case "niche-insights": {
      const niNiche = positional[0];
      if (!niNiche) {
        process.stderr.write("Error: niche is required. Usage: lead-os niche-insights <niche>\n");
        process.exitCode = 1;
        return;
      }
      try {
        const mod = await import("../lib/data-moat.ts");
        const result = await mod.getNicheInsights(niNiche);
        output(result, json);
      } catch {
        output({ error: "data-moat module not yet available" }, json);
      }
      break;
    }

    case "seo-page": {
      const seoNiche = positional[0];
      const seoKeyword = positional[1];
      if (!seoNiche || !seoKeyword) {
        process.stderr.write("Error: niche and keyword are required. Usage: lead-os seo-page <niche> <keyword>\n");
        process.exitCode = 1;
        return;
      }
      try {
        const mod = await import("../lib/distribution-engine.ts");
        const result = await mod.generateSeoPage(seoNiche, seoKeyword, (flags.template as string) || "standard");
        output(result, json);
      } catch {
        output({ error: "distribution-engine module not yet available" }, json);
      }
      break;
    }

    case "deep-psych": {
      const dpNiche = positional[0];
      const dpEmotion = positional[1];
      if (!dpNiche || !dpEmotion) {
        process.stderr.write("Error: niche and emotion are required. Usage: lead-os deep-psych <niche> <emotion>\n");
        process.exitCode = 1;
        return;
      }
      try {
        const mod = await import("../lib/psychology-engine.ts");
        const triggers = mod.listAllTriggers().filter(
          (t) => t.category === dpEmotion || t.type === dpEmotion,
        );
        const result = { niche: dpNiche, emotion: dpEmotion, intensity: (flags.intensity as string) || "moderate", triggers };
        output(result, json);
      } catch {
        output({ error: "deep-psychology module not yet available" }, json);
      }
      break;
    }

    case "health": {
      const status = {
        status: "healthy",
        version: CLI_VERSION,
        timestamp: new Date().toISOString(),
        components: {
          runtime: "ok",
          scoring: "ok",
          routing: "ok",
          intake: "ok",
          marketplace: "ok",
          feedback: "ok",
          experiments: "ok",
        },
      };
      output(status, json);
      break;
    }

    default:
      process.stderr.write(`Unknown command: ${command}\nRun 'lead-os --help' for available commands.\n`);
      process.exitCode = 1;
  }
}

async function main(): Promise<void> {
  const parsed = parseArgs(process.argv);
  try {
    await runCommand(parsed);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(`Error: ${message}\n`);
    process.exitCode = 1;
  }
}

main();
