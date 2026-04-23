// src/app/api/system/route.ts
import { NextResponse } from "next/server";
import { getDatabaseUrl } from "@/lib/db";
import { getBillingGateState } from "@/lib/billing/entitlements";
import { tenantConfig } from "@/lib/tenant";
import {
  isLivePricingEnabled,
  isRedisUrlConfigured,
  isSystemEnabled,
} from "@/lib/pricing/env";
import { getPricingRuntimeSnapshot } from "@/lib/pricing/runtime-state";
import { getSupabaseAnonKey, isSupabaseConfigured } from "@/lib/supabase/admin";
import { listAgentRegistrations } from "@/agents/repository";
import {
  isAgentKillSwitchEnabled,
  isAutonomyEnabled,
  resolveAutonomyMode,
} from "@/lib/autonomy-config";

export const dynamic = "force-dynamic";

export async function GET() {
  const billing = await getBillingGateState(tenantConfig.tenantId).catch(() => null);
  const autonomyAgents = await listAgentRegistrations(tenantConfig.tenantId).catch(() => []);
  return NextResponse.json({
    ok: true,
    service: "lead-os",
    version: process.env.npm_package_version ?? "0.1.0",
    timestamp: new Date().toISOString(),
    pricing: getPricingRuntimeSnapshot(),
    flags: {
      systemEnabled: isSystemEnabled(),
      livePricingEnabled: isLivePricingEnabled(),
      billingEnforce: process.env.LEAD_OS_BILLING_ENFORCE === "true",
      autonomyEnabled: isAutonomyEnabled(),
      autonomyMode: resolveAutonomyMode(),
      agentKillSwitch: isAgentKillSwitchEnabled(),
      pricingKillSwitch: process.env.PRICING_KILL_SWITCH === "true",
    },
    billing,
    integrations: {
      redis: isRedisUrlConfigured(),
      supabase: isSupabaseConfigured(),
      supabaseAnonPresent: Boolean(getSupabaseAnonKey()),
      postgres: Boolean(getDatabaseUrl()),
    },
    runtime: {
      node: process.version,
      vercel: process.env.VERCEL === "1",
      workerEntry: "src/runtime/worker-entry.ts",
      buildId: process.env.LEAD_OS_BUILD_ID ?? process.env.VERCEL_GIT_COMMIT_SHA ?? null,
      singleTenantEnforce: process.env.LEAD_OS_SINGLE_TENANT_ENFORCE !== "false",
    },
    autonomy: {
      enabled: isAutonomyEnabled(),
      mode: resolveAutonomyMode(),
      killSwitch: isAgentKillSwitchEnabled(),
      agents: autonomyAgents,
      invariants: {
        deterministicCoreUnaffected: true,
        reversibleActionsOnly: true,
        billingGuarded: true,
        tenantGuarded: true,
      },
    },
  });
}
