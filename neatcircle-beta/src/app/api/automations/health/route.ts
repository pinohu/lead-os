import { NextResponse } from "next/server";
import {
  automationCatalog,
  lifecycleAutomations,
  scenarioScripts,
  serviceAutomations,
  systemAutomations,
  intelligenceAutomations,
  type AutomationDependency,
} from "@/lib/automation-catalog";
import { embeddedSecrets } from "@/lib/embedded-secrets";
import { checkConnectivity } from "@/lib/suitedash";

function hasSecret(value?: string) {
  return Boolean(value && value.trim().length > 0);
}

function dependencyStatusMap() {
  return {
    suiteDash: {
      configured: hasSecret(process.env.SUITEDASH_PUBLIC_ID ?? embeddedSecrets.suitedash.publicId)
        && hasSecret(process.env.SUITEDASH_SECRET_KEY ?? embeddedSecrets.suitedash.secretKey),
    },
    emailit: {
      configured: hasSecret(process.env.EMAILIT_API_KEY ?? embeddedSecrets.emailit.apiKey),
    },
    aitable: {
      configured:
        hasSecret(process.env.AITABLE_API_TOKEN ?? embeddedSecrets.aitable.apiToken)
        && hasSecret(process.env.AITABLE_DATASHEET_ID ?? embeddedSecrets.aitable.datasheetId),
    },
    discord: {
      configured:
        hasSecret(process.env.DISCORD_NEW_LEADS_WEBHOOK ?? embeddedSecrets.discord.newLeadsWebhook)
        && hasSecret(process.env.DISCORD_ERRORS_WEBHOOK ?? embeddedSecrets.discord.errorsWebhook),
    },
    telegram: {
      configured:
        hasSecret(process.env.TELEGRAM_BOT_TOKEN ?? embeddedSecrets.telegram.botToken)
        && hasSecret(process.env.TELEGRAM_NEW_LEADS_CHAT ?? embeddedSecrets.telegram.newLeadsChat),
    },
    wbiztool: {
      configured:
        hasSecret(process.env.WBIZTOOL_API_KEY ?? embeddedSecrets.wbiztool.apiKey)
        && hasSecret(process.env.WBIZTOOL_INSTANCE_ID ?? embeddedSecrets.wbiztool.instanceId),
    },
    boost: {
      configured:
        hasSecret(process.env.BOOST_API_KEY ?? embeddedSecrets.boost.apiKey)
        && hasSecret(process.env.MAKE_API_TOKEN ?? embeddedSecrets.boost.makeApiToken),
    },
  } satisfies Record<AutomationDependency, { configured: boolean }>;
}

export async function GET() {
  try {
    const dependencies = dependencyStatusMap();
    const suiteDashConnected = dependencies.suiteDash.configured
      ? await checkConnectivity()
      : false;

    const integrationHealth = {
      suiteDash: {
        ...dependencies.suiteDash,
        connected: suiteDashConnected,
        status: suiteDashConnected
          ? "healthy"
          : (dependencies.suiteDash.configured ? "degraded" : "missing"),
      },
      emailit: {
        ...dependencies.emailit,
        status: dependencies.emailit.configured ? "ready" : "missing",
      },
      aitable: {
        ...dependencies.aitable,
        status: dependencies.aitable.configured ? "ready" : "missing",
      },
      discord: {
        ...dependencies.discord,
        status: dependencies.discord.configured ? "ready" : "missing",
      },
      telegram: {
        ...dependencies.telegram,
        status: dependencies.telegram.configured ? "ready" : "missing",
      },
      wbiztool: {
        ...dependencies.wbiztool,
        status: dependencies.wbiztool.configured ? "ready" : "missing",
      },
      boost: {
        ...dependencies.boost,
        status: dependencies.boost.configured ? "ready" : "missing",
      },
    };

    const missingCritical = ["suiteDash", "emailit", "aitable"].filter(
      (key) => integrationHealth[key as keyof typeof integrationHealth].status === "missing",
    );

    const overallStatus =
      suiteDashConnected && missingCritical.length === 0
        ? "healthy"
        : (suiteDashConnected || missingCritical.length < 3 ? "degraded" : "error");

    return NextResponse.json({
      status: overallStatus,
      summary: {
        totalRoutes: automationCatalog.length,
        serviceRoutes: serviceAutomations.length,
        lifecycleRoutes: lifecycleAutomations.length,
        intelligenceRoutes: intelligenceAutomations.length,
        systemRoutes: systemAutomations.length,
        scenarioScripts: scenarioScripts.length,
      },
      integrations: integrationHealth,
      automations: automationCatalog.map((automation) => ({
        name: automation.name,
        slug: automation.slug,
        category: automation.category,
        method: automation.method,
        route: automation.route,
        dependencies: automation.dependencies,
        description: automation.description,
        ready: automation.dependencies.every((dependency) => dependencies[dependency].configured),
      })),
      scripts: scenarioScripts.map((script) => ({
        name: script.name,
        file: script.file,
        purpose: script.purpose,
        dependencies: script.dependencies,
        ready: script.dependencies.every((dependency) => dependencies[dependency].configured),
      })),
      warnings: [
        ...(suiteDashConnected ? [] : ["SuiteDash connectivity check failed or is not configured."]),
        ...missingCritical.map((dependency) => `${dependency} is missing required credentials.`),
      ],
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Health check error:", err);
    return NextResponse.json(
      {
        status: "error",
        error: err instanceof Error ? err.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
