export interface ClientPreset {
  id: string;
  brandName: string;
  secondaryBrandName: string;
  legalName: string;
  brandPrimary: string;
  brandAccent: string;
  siteUrl: string;
  supportEmail: string;
  adminEmail: string;
  tenantTag: string;
  portalUrl: string;
  marketingHeadline: string;
  marketingDescription: string;
  openGraphDescription: string;
  enabledServices: string[];
  featuredCoreServices: string[];
  featuredBlueOceanServices: string[];
  featuredIndustries: string[];
}

export const clientPresets: Record<string, ClientPreset> = {
  neatcircle: {
    id: "neatcircle",
    brandName: "NeatCircle",
    secondaryBrandName: "Your Deputy",
    legalName: "NeatCircle LLC",
    brandPrimary: "Neat",
    brandAccent: "Circle",
    siteUrl: "https://neatcircle.com",
    supportEmail: "services@neatcircle.com",
    adminEmail: "ike@neatcircle.com",
    tenantTag: "neatcircle",
    portalUrl: "https://portal.yourdeputy.com",
    marketingHeadline: "Business Automation & Process Optimization",
    marketingDescription:
      "Systematic process optimization and operational efficiency solutions for middle-market companies. 209+ premium tools included. Zero software licensing fees.",
    openGraphDescription:
      "209+ premium business tools included in every engagement. Zero software licensing fees. 97% client satisfaction.",
    enabledServices: [
      "client-portal",
      "process-automation",
      "systems-integration",
      "training-platform",
      "business-intelligence",
      "digital-transformation",
      "compliance-training",
      "managed-services",
      "re-syndication",
      "immigration-law",
      "construction",
      "franchise",
      "staffing",
      "church-management",
      "creator-management",
      "compliance-productized",
    ],
    featuredCoreServices: [
      "client-portal",
      "process-automation",
      "systems-integration",
      "training-platform",
      "business-intelligence",
      "digital-transformation",
      "compliance-training",
      "managed-services",
    ],
    featuredBlueOceanServices: [
      "re-syndication",
      "immigration-law",
      "construction",
      "franchise",
      "staffing",
      "church-management",
      "creator-management",
      "compliance-productized",
    ],
    featuredIndustries: [
      "client-portal",
      "process-automation",
      "business-intelligence",
      "managed-services",
      "re-syndication",
      "immigration-law",
    ],
  },
  "professional-services": {
    id: "professional-services",
    brandName: "Professional Services OS",
    secondaryBrandName: "Operator Desk",
    legalName: "Professional Services OS",
    brandPrimary: "Professional",
    brandAccent: "OS",
    siteUrl: "https://professional-services.example.com",
    supportEmail: "hello@professional-services.example.com",
    adminEmail: "ops@professional-services.example.com",
    tenantTag: "professional-services",
    portalUrl: "https://portal.professional-services.example.com",
    marketingHeadline: "Adaptive Lead Capture for High-Ticket Service Firms",
    marketingDescription:
      "Assessments, webinars, AI chat, and pipeline automation for agencies, consultancies, and service operators.",
    openGraphDescription:
      "Intelligent funnels and client acquisition systems for service-led businesses.",
    enabledServices: [
      "client-portal",
      "process-automation",
      "systems-integration",
      "business-intelligence",
      "digital-transformation",
      "managed-services",
      "construction",
      "franchise",
      "staffing",
      "creator-management",
    ],
    featuredCoreServices: [
      "client-portal",
      "process-automation",
      "systems-integration",
      "business-intelligence",
    ],
    featuredBlueOceanServices: [
      "construction",
      "franchise",
      "staffing",
      "creator-management",
    ],
    featuredIndustries: [
      "client-portal",
      "construction",
      "franchise",
      "staffing",
      "creator-management",
      "business-intelligence",
    ],
  },
  "education-compliance": {
    id: "education-compliance",
    brandName: "Training Growth OS",
    secondaryBrandName: "Enablement Desk",
    legalName: "Training Growth OS",
    brandPrimary: "Training",
    brandAccent: "Growth",
    siteUrl: "https://training-growth.example.com",
    supportEmail: "hello@training-growth.example.com",
    adminEmail: "ops@training-growth.example.com",
    tenantTag: "training-growth",
    portalUrl: "https://portal.training-growth.example.com",
    marketingHeadline: "Compliance, LMS, and Enablement Funnels That Convert",
    marketingDescription:
      "Turn knowledge delivery into a product with assessments, webinars, certificates, and automated intake.",
    openGraphDescription:
      "Launch training, compliance, and membership funnels with intelligent routing.",
    enabledServices: [
      "training-platform",
      "compliance-training",
      "compliance-productized",
      "business-intelligence",
      "managed-services",
      "church-management",
    ],
    featuredCoreServices: [
      "training-platform",
      "compliance-training",
      "business-intelligence",
      "managed-services",
    ],
    featuredBlueOceanServices: [
      "compliance-productized",
      "church-management",
    ],
    featuredIndustries: [
      "training-platform",
      "compliance-training",
      "compliance-productized",
      "church-management",
      "business-intelligence",
      "managed-services",
    ],
  },
  "dtc-conversion": {
    id: "dtc-conversion",
    brandName: "DTC Conversion OS",
    secondaryBrandName: "Revenue Desk",
    legalName: "DTC Conversion OS",
    brandPrimary: "DTC",
    brandAccent: "OS",
    siteUrl: "https://dtc-conversion.example.com",
    supportEmail: "hello@dtc-conversion.example.com",
    adminEmail: "ops@dtc-conversion.example.com",
    tenantTag: "dtc-conversion",
    portalUrl: "https://portal.dtc-conversion.example.com",
    marketingHeadline: "Adaptive Acquisition for Offers With Faster Buying Cycles",
    marketingDescription:
      "Giveaways, coupon paths, evergreen proof, and recovery flows for conversion-focused operators.",
    openGraphDescription:
      "Convert more traffic with intelligent entry paths, recovery offers, and automated nurture.",
    enabledServices: [
      "process-automation",
      "systems-integration",
      "business-intelligence",
      "managed-services",
      "creator-management",
    ],
    featuredCoreServices: [
      "process-automation",
      "systems-integration",
      "business-intelligence",
      "managed-services",
    ],
    featuredBlueOceanServices: [
      "creator-management",
    ],
    featuredIndustries: [
      "process-automation",
      "systems-integration",
      "business-intelligence",
      "managed-services",
      "creator-management",
    ],
  },
};

export const defaultClientPresetId = "neatcircle";
