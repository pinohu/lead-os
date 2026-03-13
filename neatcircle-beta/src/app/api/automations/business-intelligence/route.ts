import { createServiceAutomationRoute } from "@/lib/service-automation";

interface BusinessIntelligenceRequest {
  companyName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dataSources?: string[];
  kpis?: string[];
  reportingFrequency?: string;
}

export const POST = createServiceAutomationRoute<BusinessIntelligenceRequest>({
  slug: "business-intelligence",
  nameFieldLabel: "companyName",
  successMessage: "Business intelligence setup recorded in SuiteDash",
  getCompanyName: (body) => body.companyName,
  getContact: (body) => ({
    firstName: body.firstName,
    lastName: body.lastName,
    email: body.email,
    phone: body.phone,
  }),
  buildTags: (body) => [
    ...(body.dataSources ?? []).map((dataSource) => `ds-${dataSource.toLowerCase().replace(/\s+/g, "-")}`),
    ...(body.kpis ?? []).map((kpi) => `kpi-${kpi.toLowerCase().replace(/\s+/g, "-")}`),
    body.reportingFrequency
      ? `reporting-${body.reportingFrequency.toLowerCase().replace(/\s+/g, "-")}`
      : "",
  ],
  buildBackgroundInfo: (body) => [
    body.dataSources?.length ? `Data sources: ${body.dataSources.join(", ")}` : "",
    body.kpis?.length ? `KPIs: ${body.kpis.join(", ")}` : "",
    body.reportingFrequency ? `Reporting frequency: ${body.reportingFrequency}` : "",
  ],
});
