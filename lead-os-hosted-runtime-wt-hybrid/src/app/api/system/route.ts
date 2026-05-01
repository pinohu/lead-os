// src/app/api/system/route.ts
import { NextResponse } from "next/server";
import { getDatabaseUrl } from "@/lib/db";
import { getBillingGateState } from "@/lib/billing/entitlements";
import { requireOperatorApiSession } from "@/lib/operator-auth";
import { tenantConfig } from "@/lib/tenant";
import {
  isLivePricingEnabled,
  isRedisUrlConfigured,
  isSystemEnabled,
} from "@/lib/pricing/env";
import { getPricingRuntimeSnapshot } from "@/lib/pricing/runtime-state";
import { getSupabaseAnonKey, isSupabaseConfigured } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function publicHealthResponse() {
  return NextResponse.json({
    ok: true,
    service: "lead-os",
    timestamp: new Date().toISOString(),
  });
}

export async function GET(request: Request) {
  const auth = await requireOperatorApiSession(request);
  if (auth.response) return publicHealthResponse();

  const billing = await getBillingGateState(tenantConfig.tenantId).catch(() => null);
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
  });
}
