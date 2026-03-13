import { createServiceAutomationRoute } from "@/lib/service-automation";

interface ConstructionRequest {
  companyName: string;
  contactInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  projectTypes?: string[];
  annualRevenue?: number;
  employeeCount?: number;
  safetyProgram?: boolean;
}

function revenueRangeTag(revenue: number): string {
  if (revenue <= 1_000_000) return "revenue-under-1m";
  if (revenue <= 5_000_000) return "revenue-1m-5m";
  if (revenue <= 25_000_000) return "revenue-5m-25m";
  return "revenue-25m-plus";
}

export const POST = createServiceAutomationRoute<ConstructionRequest>({
  slug: "construction",
  nameFieldLabel: "companyName",
  successMessage: "Construction company intake recorded in SuiteDash",
  getCompanyName: (body) => body.companyName,
  getContact: (body) => body.contactInfo,
  buildTags: (body) => [
    ...(body.projectTypes ?? []).map((projectType) => `project-${projectType.toLowerCase().replace(/\s+/g, "-")}`),
    typeof body.annualRevenue === "number" ? revenueRangeTag(body.annualRevenue) : "",
    body.safetyProgram ? "safety-program" : "",
  ],
  buildBackgroundInfo: (body) => [
    body.projectTypes?.length ? `Project types: ${body.projectTypes.join(", ")}` : "",
    typeof body.annualRevenue === "number" ? `Annual revenue: $${body.annualRevenue.toLocaleString()}` : "",
    typeof body.employeeCount === "number" ? `Employee count: ${body.employeeCount}` : "",
    body.safetyProgram !== undefined ? `Safety program: ${body.safetyProgram ? "Yes" : "No"}` : "",
  ],
});
