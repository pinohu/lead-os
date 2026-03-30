export interface GmbProfile {
  slug: string;
  businessName: string;
  businessType: string;
  gmbCategory: string;
  gmbAdditionalCategories: string[];
  description: string;
  serviceArea: string;
  phone: string;
  email: string;
  hours: string;
  services: string[];
  primaryNiche: string;
  schemaType: string;
  citationSources: string[];
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
}

export const gmbProfiles: GmbProfile[] = [
  {
    slug: "marketing-agency",
    businessName: "Lead OS Agency Services",
    businessType: "Digital Marketing Agency",
    gmbCategory: "Marketing Agency",
    gmbAdditionalCategories: ["Advertising Agency", "Internet Marketing Service", "Business Consultant"],
    description:
      "Full-service lead generation and marketing automation agency. We replace 8+ marketing tools with one unified platform. Services include lead capture, scoring, multi-channel nurture, A/B testing, and ROI analytics. Serving agencies, service businesses, and franchises nationwide.",
    serviceArea: "Nationwide",
    phone: "(555) 100-2000",
    email: "services@leadosagency.com",
    hours: "Mon-Fri 9am-6pm",
    services: [
      "Lead Generation", "Marketing Automation", "CRM Setup", "Email Marketing", "SMS Marketing",
      "Landing Pages", "A/B Testing", "Analytics", "SEO", "Social Media Management",
      "Paid Advertising", "Content Marketing", "Client Reporting", "Review Management",
      "Funnel Building", "Conversion Optimization",
    ],
    primaryNiche: "general",
    schemaType: "ProfessionalService",
    citationSources: ["Yelp", "BBB", "Clutch", "UpCity", "G2", "Expertise.com"],
    address: {
      street: "1401 Elm Street, Suite 4200",
      city: "Dallas",
      state: "TX",
      zip: "75202",
      country: "US",
    },
  },
  {
    slug: "saas-platform",
    businessName: "Lead OS Platform",
    businessType: "SaaS Platform",
    gmbCategory: "Software Company",
    gmbAdditionalCategories: ["Technology Company", "Business Consultant", "Internet Service Provider"],
    description:
      "White-label lead generation and CRM platform for businesses of all sizes. AI-powered lead scoring, multi-channel nurture, marketplace, and analytics. Instant deployment with custom branding.",
    serviceArea: "Nationwide",
    phone: "(555) 200-3000",
    email: "hello@leadosplatform.com",
    hours: "24/7 (platform), Mon-Fri 9am-9pm (support)",
    services: [
      "SaaS Platform", "Lead Scoring", "CRM Software", "Marketing Automation",
      "White-Label Platform", "A/B Testing", "Analytics Dashboard", "API Integration",
      "Multi-Tenant Management", "Customer Health Scoring", "Trial Conversion Optimization",
      "Billing Management", "Support Automation", "Developer Tools",
    ],
    primaryNiche: "tech",
    schemaType: "SoftwareApplication",
    citationSources: ["G2", "Capterra", "ProductHunt", "Crunchbase", "TrustPilot", "Software Advice"],
    address: {
      street: "525 Market Street, Suite 3600",
      city: "San Francisco",
      state: "CA",
      zip: "94105",
      country: "US",
    },
  },
  {
    slug: "lead-generation",
    businessName: "Lead OS Marketplace",
    businessType: "Lead Generation Service",
    gmbCategory: "Lead Generation Service",
    gmbAdditionalCategories: ["Marketing Agency", "Business Consultant", "Sales Organization"],
    description:
      "Qualified business lead marketplace with AI-powered scoring and temperature-based pricing. Buy and sell pre-qualified leads with real-time outcome tracking across multiple industries.",
    serviceArea: "Nationwide",
    phone: "(555) 300-4000",
    email: "leads@leadosmarketplace.com",
    hours: "Mon-Fri 8am-8pm, Lead delivery 24/7",
    services: [
      "Qualified Lead Sales", "Lead Scoring", "Lead Marketplace", "Industry-Specific Leads",
      "Outcome Tracking", "Lead Verification", "Territory-Based Leads", "Volume Discounts",
      "Exclusive Leads", "Real-Time Lead Delivery", "Lead Quality Guarantee",
    ],
    primaryNiche: "general",
    schemaType: "ProfessionalService",
    citationSources: ["Clutch", "UpCity", "G2", "BBB", "Local Chamber"],
    address: {
      street: "200 Park Avenue South, Suite 1400",
      city: "New York",
      state: "NY",
      zip: "10003",
      country: "US",
    },
  },
  {
    slug: "technology-consultant",
    businessName: "Lead OS Consulting",
    businessType: "Technology Consultant",
    gmbCategory: "Business Consultant",
    gmbAdditionalCategories: ["IT Service Provider", "Management Consultant", "Technology Company"],
    description:
      "Business automation and technology implementation consultancy. We implement the lead systems other consultants recommend. CRM setup, process automation, systems integration, and managed services.",
    serviceArea: "Regional (Tri-State Area)",
    phone: "(555) 400-5000",
    email: "consult@leadosconsulting.com",
    hours: "Mon-Fri 9am-6pm, Emergency 24/7 for managed clients",
    services: [
      "CRM Implementation", "Process Automation", "Systems Integration", "Technology Consulting",
      "Business Analysis", "Digital Transformation", "Data Migration", "Staff Training",
      "Managed Services", "Strategy Sessions", "Technology Audit", "Workflow Design",
    ],
    primaryNiche: "coaching",
    schemaType: "ProfessionalService",
    citationSources: ["Clutch", "UpCity", "LinkedIn", "BBB", "Local Chamber", "GoodFirms"],
    address: {
      street: "1500 Walnut Street, Suite 900",
      city: "Philadelphia",
      state: "PA",
      zip: "19102",
      country: "US",
    },
  },
  {
    slug: "franchise-operations",
    businessName: "Lead OS Franchise Solutions",
    businessType: "Franchise Company",
    gmbCategory: "Franchise Company",
    gmbAdditionalCategories: ["Business Consultant", "Marketing Agency", "Management Consultant"],
    description:
      "Multi-location franchise management platform. Centralized lead routing, brand compliance, performance benchmarking, and training across all franchise territories. Serving franchise brands with 5-500+ locations.",
    serviceArea: "Nationwide",
    phone: "(555) 500-6000",
    email: "franchise@leadosfranchise.com",
    hours: "Mon-Fri 8am-6pm, Platform 24/7",
    services: [
      "Franchise Lead Management", "Multi-Location CRM", "Brand Compliance",
      "Performance Benchmarking", "Franchisee Training", "Territory Management",
      "Local Marketing Templates", "Centralized Reporting", "Franchisee Onboarding",
      "Discovery Day Management", "FDD Automation", "Location-Level Analytics",
    ],
    primaryNiche: "franchise",
    schemaType: "ProfessionalService",
    citationSources: ["IFA", "Franchise.org", "LinkedIn", "Entrepreneur Franchise 500"],
    address: {
      street: "303 Peachtree Street NE, Suite 2500",
      city: "Atlanta",
      state: "GA",
      zip: "30308",
      country: "US",
    },
  },
];

export function getGmbProfile(slug: string) {
  return gmbProfiles.find((p) => p.slug === slug);
}
