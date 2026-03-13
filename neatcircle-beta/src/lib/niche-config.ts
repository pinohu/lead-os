export interface NicheManifest {
  slug: string;
  label: string;
  shortDescription: string;
  market?: string;
  category: "core" | "blue-ocean" | "general";
}

export const nicheManifests: Record<string, NicheManifest> = {
  general: {
    slug: "general",
    label: "General Business",
    shortDescription: "Broad business automation and operational efficiency assessment.",
    category: "general",
  },
  "client-portal": {
    slug: "client-portal",
    label: "Client Portal Automation",
    shortDescription: "White-labeled portals, onboarding, and structured client delivery.",
    category: "core",
  },
  "process-automation": {
    slug: "process-automation",
    label: "Process Automation",
    shortDescription: "Workflow automation, triggers, and manual task elimination.",
    category: "core",
  },
  "systems-integration": {
    slug: "systems-integration",
    label: "Systems Integration",
    shortDescription: "Cross-platform integration, sync, and middleware design.",
    category: "core",
  },
  "training-platform": {
    slug: "training-platform",
    label: "Training Platform Creation",
    shortDescription: "LMS, course delivery, tracking, and certification systems.",
    category: "core",
  },
  "business-intelligence": {
    slug: "business-intelligence",
    label: "Business Intelligence",
    shortDescription: "Dashboards, reporting, and operational visibility.",
    category: "core",
  },
  "digital-transformation": {
    slug: "digital-transformation",
    label: "Digital Transformation",
    shortDescription: "Technology transformation strategy and implementation.",
    category: "core",
  },
  "compliance-training": {
    slug: "compliance-training",
    label: "Compliance Training",
    shortDescription: "Compliance learning systems and training operations.",
    category: "core",
  },
  "managed-services": {
    slug: "managed-services",
    label: "Managed Services",
    shortDescription: "Ongoing optimization, support, and platform stewardship.",
    category: "core",
  },
  "re-syndication": {
    slug: "re-syndication",
    label: "RE Syndication",
    shortDescription: "Investor portals, deal rooms, and capital operations.",
    market: "$21T",
    category: "blue-ocean",
  },
  "immigration-law": {
    slug: "immigration-law",
    label: "Immigration Law",
    shortDescription: "Case workflows, client intake, and multilingual service delivery.",
    market: "$9.9B",
    category: "blue-ocean",
  },
  construction: {
    slug: "construction",
    label: "Construction",
    shortDescription: "Project communication, documentation, and field workflows.",
    market: "$1.8T",
    category: "blue-ocean",
  },
  franchise: {
    slug: "franchise",
    label: "Franchise Operations",
    shortDescription: "Multi-location systems, franchisee management, and compliance.",
    market: "$827B",
    category: "blue-ocean",
  },
  staffing: {
    slug: "staffing",
    label: "Staffing Agencies",
    shortDescription: "Candidate/client portals, placement workflows, and timesheets.",
    market: "$218B",
    category: "blue-ocean",
  },
  "church-management": {
    slug: "church-management",
    label: "Church Management",
    shortDescription: "Member portals, giving, volunteer workflows, and events.",
    market: "$14B",
    category: "blue-ocean",
  },
  "creator-management": {
    slug: "creator-management",
    label: "Creator Management",
    shortDescription: "Talent operations, brand deals, content calendars, and revenue visibility.",
    market: "$250B",
    category: "blue-ocean",
  },
  "compliance-productized": {
    slug: "compliance-productized",
    label: "Compliance Productized",
    shortDescription: "White-label compliance course delivery and reseller operations.",
    market: "$7.6B",
    category: "blue-ocean",
  },
};
