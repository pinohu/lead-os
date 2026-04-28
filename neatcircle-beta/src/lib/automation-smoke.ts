import { automationCatalog } from "./automation-catalog.ts";
import { embeddedSecrets } from "./embedded-secrets.ts";
import { hasConfiguredSecret, normalizeSecret } from "./admin-auth.ts";

type SmokeFixture = {
  route: string;
  method: "GET" | "POST";
  body?: unknown;
};

export const automationSmokeFixtures: SmokeFixture[] = [
  {
    route: "/api/automations/client-portal",
    method: "POST",
    body: {
      dryRun: true,
      companyName: "Acme Client Portal",
      firstName: "Ike",
      lastName: "Tester",
      email: "smoke+client-portal@example.com",
      domain: "portal.example.com",
      features: ["Document Vault", "Status Updates"],
    },
  },
  {
    route: "/api/automations/process-automation",
    method: "POST",
    body: {
      dryRun: true,
      companyName: "Acme Ops",
      firstName: "Ike",
      lastName: "Tester",
      email: "smoke+process@example.com",
      currentProcesses: ["Approvals", "Follow-up"],
      estimatedManualHours: 24,
      targetTools: ["HubSpot", "Airtable"],
    },
  },
  {
    route: "/api/automations/systems-integration",
    method: "POST",
    body: {
      dryRun: true,
      companyName: "Acme Integrations",
      firstName: "Ike",
      lastName: "Tester",
      email: "smoke+systems@example.com",
      existingSystems: ["HubSpot", "QuickBooks"],
      desiredIntegrations: [{ source: "HubSpot", destination: "QuickBooks", dataType: "Invoices" }],
      syncFrequency: "hourly",
    },
  },
  {
    route: "/api/automations/training-platform",
    method: "POST",
    body: {
      dryRun: true,
      companyName: "Acme Academy",
      firstName: "Ike",
      lastName: "Tester",
      email: "smoke+training@example.com",
      trainingType: "client",
      courseCount: 8,
      estimatedLearners: 120,
    },
  },
  {
    route: "/api/automations/business-intelligence",
    method: "POST",
    body: {
      dryRun: true,
      companyName: "Acme Analytics",
      firstName: "Ike",
      lastName: "Tester",
      email: "smoke+bi@example.com",
      dataSources: ["Stripe", "HubSpot"],
      kpis: ["MRR", "Pipeline"],
      reportingFrequency: "weekly",
    },
  },
  {
    route: "/api/automations/digital-transformation",
    method: "POST",
    body: {
      dryRun: true,
      companyName: "Acme Digital",
      firstName: "Ike",
      lastName: "Tester",
      email: "smoke+dx@example.com",
      currentState: "Spreadsheet-driven operations",
      goals: ["Faster onboarding", "Cleaner reporting"],
      timeline: "90 days",
      budgetRange: "$25k-$50k",
    },
  },
  {
    route: "/api/automations/compliance-training",
    method: "POST",
    body: {
      companyName: "Acme Compliance",
      employees: [
        { firstName: "Ike", lastName: "Tester", email: "smoke+comp1@example.com" },
        { firstName: "Jane", lastName: "Tester", email: "smoke+comp2@example.com", role: "Manager" },
      ],
      courses: ["HIPAA", "OSHA"],
    },
  },
  {
    route: "/api/automations/managed-services",
    method: "POST",
    body: {
      dryRun: true,
      companyName: "Acme MSP",
      firstName: "Ike",
      lastName: "Tester",
      email: "smoke+msp@example.com",
      plan: "Growth",
      currentTools: ["ConnectWise", "Slack"],
      painPoints: ["Ticket backlog"],
    },
  },
  {
    route: "/api/automations/re-syndication",
    method: "POST",
    body: {
      dryRun: true,
      syndicationName: "Acme Capital",
      contactInfo: { firstName: "Ike", lastName: "Tester", email: "smoke+res@example.com" },
      dealType: "equity",
      targetRaise: 4000000,
      propertyType: "Multifamily",
    },
  },
  {
    route: "/api/automations/immigration-law",
    method: "POST",
    body: {
      dryRun: true,
      firmName: "Acme Immigration",
      contactInfo: { firstName: "Ike", lastName: "Tester", email: "smoke+law@example.com" },
      visaTypes: ["h1b", "family"],
      caseVolume: 40,
      languages: ["English", "Spanish"],
    },
  },
  {
    route: "/api/automations/construction",
    method: "POST",
    body: {
      dryRun: true,
      companyName: "Acme Build",
      contactInfo: { firstName: "Ike", lastName: "Tester", email: "smoke+build@example.com" },
      projectTypes: ["Commercial", "Tenant Improvement"],
      annualRevenue: 6000000,
      safetyProgram: true,
    },
  },
  {
    route: "/api/automations/franchise",
    method: "POST",
    body: {
      dryRun: true,
      brandName: "Acme Franchise",
      contactInfo: { firstName: "Ike", lastName: "Tester", email: "smoke+franchise@example.com" },
      locationCount: 18,
      expansionPlans: "Open 6 more locations this year",
      trainingNeeds: ["Ops training", "Brand compliance"],
    },
  },
  {
    route: "/api/automations/staffing",
    method: "POST",
    body: {
      dryRun: true,
      agencyName: "Acme Staffing",
      contactInfo: { firstName: "Ike", lastName: "Tester", email: "smoke+staffing@example.com" },
      specialties: ["Healthcare", "Administrative"],
      placementsPerMonth: 22,
      clientCount: 14,
    },
  },
  {
    route: "/api/automations/church-management",
    method: "POST",
    body: {
      dryRun: true,
      organizationName: "Acme Church",
      contactInfo: { firstName: "Ike", lastName: "Tester", email: "smoke+church@example.com" },
      memberCount: 900,
      ministries: ["Youth", "Outreach"],
      needs: ["member-portal", "events"],
    },
  },
  {
    route: "/api/automations/creator-management",
    method: "POST",
    body: {
      dryRun: true,
      agencyName: "Acme Creator Mgmt",
      contactInfo: { firstName: "Ike", lastName: "Tester", email: "smoke+creator@example.com" },
      talentCount: 12,
      platforms: ["youtube", "instagram"],
      services: ["contracts", "brand-deals"],
    },
  },
  {
    route: "/api/automations/compliance-productized",
    method: "POST",
    body: {
      dryRun: true,
      resellerName: "Acme Compliance Reseller",
      contactInfo: { firstName: "Ike", lastName: "Tester", email: "smoke+cp@example.com" },
      targetMarket: "hr-consulting",
      clientCount: 35,
      pricingModel: "tiered",
    },
  },
];

export async function runAutomationSmoke(
  baseUrl: string,
  automationSecret = process.env.AUTOMATION_API_SECRET ?? embeddedSecrets.automation.apiSecret,
) {
  const configuredAutomationSecret = normalizeSecret(automationSecret);
  if (!hasConfiguredSecret(configuredAutomationSecret)) {
    throw new Error("AUTOMATION_API_SECRET must be configured to run automation smoke tests.");
  }

  const results = [];

  for (const fixture of automationSmokeFixtures) {
    const response = await fetch(`${baseUrl}${fixture.route}`, {
      method: fixture.method,
      headers: {
        Authorization: `Bearer ${configuredAutomationSecret}`,
        "Content-Type": "application/json",
        "x-lead-os-dry-run": "1",
      },
      body: fixture.method === "POST" ? JSON.stringify(fixture.body ?? {}) : undefined,
    });

    let payload: unknown = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    results.push({
      route: fixture.route,
      method: fixture.method,
      ok: response.ok,
      status: response.status,
      payload,
    });
  }

  const failed = results.filter((result) => !result.ok);

  return {
    success: failed.length === 0,
    total: results.length,
    passed: results.length - failed.length,
    failed: failed.length,
    results,
  };
}

export function listSmokeRoutes() {
  const coveredRoutes = new Set(automationSmokeFixtures.map((fixture) => fixture.route));
  return automationCatalog.map((automation) => ({
    route: automation.route,
    covered: coveredRoutes.has(automation.route),
  }));
}
