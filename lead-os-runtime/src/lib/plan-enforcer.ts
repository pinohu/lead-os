import { getPlanById, type PlanDefinition, type PlanLimits } from "./plan-catalog.ts";
import { getSubscription, getUsage, getCurrentPeriod, type UsageMetric } from "./billing-store.ts";

export interface EnforcementResult {
  allowed: boolean;
  reason?: string;
  usage?: { metric: string; used: number; limit: number };
}

const METRIC_TO_LIMIT_KEY: Record<UsageMetric, keyof PlanLimits> = {
  leads: "leadsPerMonth",
  emails: "emailsPerMonth",
  sms: "smsPerMonth",
  whatsapp: "whatsappPerMonth",
};

export async function getPlanForTenant(tenantId: string): Promise<PlanDefinition | null> {
  const subscription = await getSubscription(tenantId);
  if (!subscription) return null;
  if (subscription.status !== "active" && subscription.status !== "trialing") return null;
  return getPlanById(subscription.planId) ?? null;
}

export async function enforcePlanLimits(
  tenantId: string,
  metric?: UsageMetric,
): Promise<EnforcementResult> {
  const subscription = await getSubscription(tenantId);

  if (!subscription) {
    return { allowed: true };
  }

  if (subscription.status !== "active" && subscription.status !== "trialing") {
    return { allowed: false, reason: `Subscription status is ${subscription.status}` };
  }

  const plan = getPlanById(subscription.planId);
  if (!plan) {
    return { allowed: false, reason: `Plan ${subscription.planId} not found` };
  }

  if (!metric) {
    return { allowed: true };
  }

  const limitKey = METRIC_TO_LIMIT_KEY[metric];
  if (!limitKey) {
    return { allowed: true };
  }

  const limit = plan.limits[limitKey];

  if (limit === -1) {
    return { allowed: true };
  }

  const usage = await getUsage(tenantId, getCurrentPeriod());
  const used = usage ? usage[metric] : 0;

  if (used >= limit) {
    return {
      allowed: false,
      reason: `${metric} limit reached (${used}/${limit})`,
      usage: { metric, used, limit },
    };
  }

  return { allowed: true };
}

export async function isFeatureEnabled(tenantId: string, feature: string): Promise<boolean> {
  const plan = await getPlanForTenant(tenantId);
  if (!plan) return false;
  return plan.features.some(
    (f) => f.toLowerCase() === feature.toLowerCase(),
  );
}
