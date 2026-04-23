export interface PlanLimits {
  leadsPerMonth: number;
  emailsPerMonth: number;
  smsPerMonth: number;
  whatsappPerMonth: number;
  funnels: number;
  magnets: number;
  operators: number;
  experiments: number;
  integrations: number;
}

export interface PlanDefinition {
  id: string;
  name: string;
  revenueModel: "managed" | "white-label" | "implementation" | "directory";
  setupFee: number;
  monthlyPrice: number;
  stripePriceId: string;
  limits: PlanLimits;
  features: string[];
}

export const PLAN_CATALOG: PlanDefinition[] = [
  {
    id: "managed-starter",
    name: "Managed Starter",
    revenueModel: "managed",
    setupFee: 350000,
    monthlyPrice: 200000,
    stripePriceId: process.env.STRIPE_PRICE_MANAGED_STARTER ?? "price_managed_starter",
    limits: {
      leadsPerMonth: 500,
      emailsPerMonth: 5000,
      smsPerMonth: 500,
      whatsappPerMonth: 200,
      funnels: 3,
      magnets: 10,
      operators: 2,
      experiments: 2,
      integrations: 5,
    },
    features: ["Lead capture", "Scoring", "Email nurture", "Basic dashboard", "1 niche"],
  },
  {
    id: "managed-growth",
    name: "Managed Growth",
    revenueModel: "managed",
    setupFee: 750000,
    monthlyPrice: 500000,
    stripePriceId: process.env.STRIPE_PRICE_MANAGED_GROWTH ?? "price_managed_growth",
    limits: {
      leadsPerMonth: 2000,
      emailsPerMonth: 25000,
      smsPerMonth: 2000,
      whatsappPerMonth: 1000,
      funnels: 10,
      magnets: 50,
      operators: 5,
      experiments: 10,
      integrations: 15,
    },
    features: ["Everything in Starter", "Multi-funnel", "A/B testing", "Attribution", "WhatsApp", "SMS", "3 niches"],
  },
  {
    id: "managed-enterprise",
    name: "Managed Enterprise",
    revenueModel: "managed",
    setupFee: 1500000,
    monthlyPrice: 1000000,
    stripePriceId: process.env.STRIPE_PRICE_MANAGED_ENTERPRISE ?? "price_managed_enterprise",
    limits: {
      leadsPerMonth: -1,
      emailsPerMonth: -1,
      smsPerMonth: -1,
      whatsappPerMonth: -1,
      funnels: -1,
      magnets: -1,
      operators: -1,
      experiments: -1,
      integrations: -1,
    },
    features: ["Everything in Growth", "Unlimited leads", "Unlimited niches", "Voice AI", "Custom integrations", "Dedicated support"],
  },
  {
    id: "whitelabel-starter",
    name: "White-Label Starter",
    revenueModel: "white-label",
    setupFee: 0,
    monthlyPrice: 9900,
    stripePriceId: process.env.STRIPE_PRICE_WL_STARTER ?? "price_wl_starter",
    limits: {
      leadsPerMonth: 100,
      emailsPerMonth: 1000,
      smsPerMonth: 100,
      whatsappPerMonth: 50,
      funnels: 2,
      magnets: 5,
      operators: 1,
      experiments: 1,
      integrations: 3,
    },
    features: ["Lead capture", "Basic scoring", "Email nurture", "1 niche"],
  },
  {
    id: "whitelabel-growth",
    name: "White-Label Growth",
    revenueModel: "white-label",
    setupFee: 0,
    monthlyPrice: 24900,
    stripePriceId: process.env.STRIPE_PRICE_WL_GROWTH ?? "price_wl_growth",
    limits: {
      leadsPerMonth: 500,
      emailsPerMonth: 5000,
      smsPerMonth: 500,
      whatsappPerMonth: 200,
      funnels: 5,
      magnets: 25,
      operators: 3,
      experiments: 5,
      integrations: 10,
    },
    features: ["Everything in Starter", "A/B testing", "Attribution", "3 niches", "WhatsApp"],
  },
  {
    id: "whitelabel-enterprise",
    name: "White-Label Enterprise",
    revenueModel: "white-label",
    setupFee: 0,
    monthlyPrice: 49900,
    stripePriceId: process.env.STRIPE_PRICE_WL_ENTERPRISE ?? "price_wl_enterprise",
    limits: {
      leadsPerMonth: 2000,
      emailsPerMonth: 25000,
      smsPerMonth: 2000,
      whatsappPerMonth: 1000,
      funnels: -1,
      magnets: -1,
      operators: 10,
      experiments: -1,
      integrations: -1,
    },
    features: ["Everything in Growth", "Unlimited funnels", "Marketplace access", "Priority support"],
  },
  {
    id: "implementation",
    name: "Implementation + Retainer",
    revenueModel: "implementation",
    setupFee: 0,
    monthlyPrice: 0,
    stripePriceId: process.env.STRIPE_PRICE_IMPLEMENTATION ?? "price_implementation",
    limits: {
      leadsPerMonth: -1,
      emailsPerMonth: -1,
      smsPerMonth: -1,
      whatsappPerMonth: -1,
      funnels: -1,
      magnets: -1,
      operators: -1,
      experiments: -1,
      integrations: -1,
    },
    features: ["Full platform access", "Custom configuration", "Dedicated onboarding", "Priority support"],
  },
  {
    id: "directory",
    name: "Directory / Lead Marketplace",
    revenueModel: "directory",
    setupFee: 0,
    monthlyPrice: 0,
    stripePriceId: process.env.STRIPE_PRICE_DIRECTORY ?? "price_directory",
    limits: {
      leadsPerMonth: -1,
      emailsPerMonth: -1,
      smsPerMonth: 5000,
      whatsappPerMonth: 0,
      funnels: -1,
      magnets: -1,
      operators: 2,
      experiments: 5,
      integrations: 5,
    },
    features: ["Lead capture", "Scoring", "Marketplace publishing", "Buyer management", "Revenue tracking"],
  },
];

export function getPlanById(planId: string): PlanDefinition | undefined {
  return PLAN_CATALOG.find((plan) => plan.id === planId);
}

export function getPlansForModel(model: string): PlanDefinition[] {
  return PLAN_CATALOG.filter((plan) => plan.revenueModel === model);
}
