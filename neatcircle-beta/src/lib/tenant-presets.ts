export interface TenantPreset {
  key: string;
  brandName: string;
  tenantTag: string;
  primaryUseCase: string;
  intakeBias: string[];
  bestFitFunnels: string[];
}

export const tenantPresets: TenantPreset[] = [
  {
    key: "professional-services",
    brandName: "Professional Services OS",
    tenantTag: "pro-services",
    primaryUseCase: "Agencies, consultancies, and service firms selling high-ticket automation projects.",
    intakeBias: ["assessment", "chat", "contact_form"],
    bestFitFunnels: ["client-audit", "high-ticket-call", "appointment-gen", "documentary-vsl"],
  },
  {
    key: "education-compliance",
    brandName: "Training Growth OS",
    tenantTag: "training-growth",
    primaryUseCase: "Compliance, LMS, and enablement businesses monetizing knowledge delivery.",
    intakeBias: ["webinar", "newsletter", "roi_calculator"],
    bestFitFunnels: ["webinar-live", "webinar-evergreen", "mini-class", "freemium-membership"],
  },
  {
    key: "ecommerce-dtc",
    brandName: "DTC Conversion OS",
    tenantTag: "dtc-conversion",
    primaryUseCase: "Offers with faster purchase cycles, promo ladders, and cart recovery needs.",
    intakeBias: ["giveaway", "exit_intent", "chat"],
    bestFitFunnels: ["giveaway-capture", "coupon-offer", "product-sales", "abandonment-recovery"],
  },
];
