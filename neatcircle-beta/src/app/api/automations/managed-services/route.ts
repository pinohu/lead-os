import { createServiceAutomationRoute } from "@/lib/service-automation";

interface ManagedServicesRequest {
  companyName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  plan?: string;
  currentTools?: string[];
  painPoints?: string[];
}

export const POST = createServiceAutomationRoute<ManagedServicesRequest>({
  slug: "managed-services",
  nameFieldLabel: "companyName",
  successMessage: "Managed services intake recorded in SuiteDash",
  getCompanyName: (body) => body.companyName,
  getContact: (body) => ({
    firstName: body.firstName,
    lastName: body.lastName,
    email: body.email,
    phone: body.phone,
  }),
  buildTags: (body) => [
    body.plan ? `plan-${body.plan.toLowerCase().replace(/\s+/g, "-")}` : "",
    ...(body.currentTools ?? []).map((tool) => tool.toLowerCase().replace(/\s+/g, "-")),
  ],
  buildBackgroundInfo: (body) => [
    body.plan ? `Plan: ${body.plan}` : "",
    body.currentTools?.length ? `Current tools: ${body.currentTools.join(", ")}` : "",
    body.painPoints?.length ? `Pain points: ${body.painPoints.join(", ")}` : "",
  ],
});
